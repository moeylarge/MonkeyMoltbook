#!/usr/bin/env python3
import argparse
import csv
import html
import re
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

USER_AGENT = 'Mozilla/5.0'
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
BAD_EMAIL_PARTS = ['example.com', 'user@domain.com', 'your@email', 'test@', '@sentry.', '@example.']
FIELDS = [
    'business_name','website','public_phone','public_business_email','city','state','category',
    'source_platform','source_url','contact_page_url','normalized_domain','notes','niche_tag','geography_tag'
]


def normalize_domain(url: str) -> str:
    if not url:
        return ''
    if '://' not in url:
        url = 'https://' + url
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return ''
    host = host.split('@')[-1].split(':')[0]
    return host[4:] if host.startswith('www.') else host


def fetch(url: str, timeout=15):
    req = Request(url, headers={'User-Agent': USER_AGENT})
    with urlopen(req, timeout=timeout, context=CTX) as r:
        raw = r.read(650000)
        ct = r.headers.get('Content-Type', '')
        return r.geturl(), raw.decode('utf-8', 'ignore'), ct


def clean_text(txt: str) -> str:
    txt = re.sub(r'<script.*?</script>', ' ', txt, flags=re.S | re.I)
    txt = re.sub(r'<style.*?</style>', ' ', txt, flags=re.S | re.I)
    txt = re.sub(r'<noscript.*?</noscript>', ' ', txt, flags=re.S | re.I)
    txt = re.sub(r'<.*?>', ' ', txt)
    txt = html.unescape(txt)
    txt = re.sub(r'\s+', ' ', txt)
    return txt.strip()


def extract_phone(text: str) -> str:
    phones = re.findall(r'(?:\+1[\s\-.]*)?(?:\(?\d{3}\)?[\s\-.]*)\d{3}[\s\-.]*\d{4}', text)
    for p in phones:
        digits = re.sub(r'\D', '', p)
        if len(digits) == 11 and digits.startswith('1'):
            digits = digits[1:]
        if len(digits) != 10:
            continue
        if digits[:3] in {'000','111','123','555'}:
            continue
        if len(set(digits)) <= 2:
            continue
        return f'({digits[:3]}) {digits[3:6]}-{digits[6:]}'
    return ''


def extract_email(text: str, domain_hint='') -> str:
    emails = re.findall(r'[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}', text, re.I)
    for e in emails:
        e = e.strip(' .;,)(').lower()
        if any(b in e for b in BAD_EMAIL_PARTS):
            continue
        if domain_hint and normalize_domain('https://' + e.split('@',1)[1]) == domain_hint:
            return e
    for e in emails:
        e = e.strip(' .;,)(').lower()
        if any(b in e for b in BAD_EMAIL_PARTS):
            continue
        return e
    return ''


def extract_contact_link(html_text: str, base_url: str) -> str:
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html_text, re.I)
    good = []
    for href in hrefs:
        low = href.lower()
        if low.startswith(('mailto:', 'tel:', 'javascript:')):
            continue
        if any(k in low for k in ['/contact', 'contact-us', 'contact_', 'get-a-quote', 'request-a-quote', 'free-estimate', 'estimate', 'inspection', 'quote', '#contact']):
            absu = urljoin(base_url, href)
            if normalize_domain(absu) == normalize_domain(base_url):
                good.append(absu)
    if not good:
        return ''
    good = sorted(set(good), key=lambda x: (0 if 'contact' in x.lower() else 1, len(x)))
    return good[0]


def enrich_row(row: dict):
    row = dict(row)
    notes = row.get('notes', '')
    try:
        final_url, html_text, ct = fetch(row.get('website') or row.get('source_url') or '')
        if 'html' not in ct.lower() and '<html' not in html_text[:500].lower():
            row['notes'] = (notes + ' Homepage fetch returned non-HTML content.').strip()
            return row
        text = clean_text(html_text)
        domain = normalize_domain(final_url)
        row['website'] = final_url
        row['normalized_domain'] = row.get('normalized_domain') or domain
        if not row.get('public_phone'):
            row['public_phone'] = extract_phone(text)
        if not row.get('public_business_email'):
            row['public_business_email'] = extract_email(text, domain)
        if not row.get('contact_page_url'):
            row['contact_page_url'] = extract_contact_link(html_text, final_url)
        if row.get('contact_page_url'):
            try:
                _, contact_html, contact_ct = fetch(row['contact_page_url'])
                if 'html' in contact_ct.lower() or '<html' in contact_html[:500].lower():
                    contact_text = clean_text(contact_html)
                    if not row.get('public_phone'):
                        row['public_phone'] = extract_phone(contact_text)
                    if not row.get('public_business_email'):
                        row['public_business_email'] = extract_email(contact_text, domain)
            except Exception as e:
                row['notes'] = (notes + f' Contact fetch issue: {type(e).__name__}.').strip()
                return row
        found = []
        if row.get('public_phone'):
            found.append('phone')
        if row.get('public_business_email'):
            found.append('email')
        if row.get('contact_page_url'):
            found.append('contact_url')
        row['notes'] = (notes + (' Enriched homepage/contact fields: ' + ', '.join(found) + '.' if found else ' Enrichment found no contact fields.')).strip()
        return row
    except Exception as e:
        row['notes'] = (notes + f' Homepage fetch issue: {type(e).__name__}.').strip()
        return row


def main():
    parser = argparse.ArgumentParser(description='Enrich contact fields for prospect CSV rows.')
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--workers', type=int, default=6)
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    with input_path.open(newline='') as f:
        rows = list(csv.DictReader(f))

    enriched = [None] * len(rows)
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {ex.submit(enrich_row, row): i for i, row in enumerate(rows)}
        for future in as_completed(futures):
            enriched[futures[future]] = future.result()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(enriched)

    print(f'enriched_rows={len(enriched)} output={output_path}')


if __name__ == '__main__':
    main()
