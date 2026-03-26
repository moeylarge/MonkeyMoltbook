#!/usr/bin/env python3
import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path

DEFAULT_FIELDS = [
    'business_name',
    'website',
    'public_phone',
    'public_business_email',
    'city',
    'state',
    'category',
    'source_platform',
    'source_url',
    'contact_page_url',
    'normalized_domain',
    'notes',
    'niche_tag',
    'geography_tag',
    'record_status',
    'failure_reasons',
    'quality_score',
    'has_valid_phone',
    'has_valid_email',
    'has_contact_page',
    'domain_status',
]

PARKED_DOMAIN_PARTS = {
    'hugedomains.com', 'sedo.com', 'afternic.com', 'dan.com', 'undeveloped.com', 'parkingcrew.net'
}
BAD_PHONE_VALUES = {
    '0000000000', '1111111111', '1234567890', '3333333333', '5555555555', '9999999999'
}
BAD_EMAILS = {
    'user@domain.com', 'test@test.com', 'example@example.com', 'name@example.com'
}
NON_BUSINESS_NOTE_FLAGS = [
    'placeholder/non-business email',
    'suspicious',
    'malformed phone',
    'parked',
    'removed suspicious',
]
REVIEW_NOTE_FLAGS = [
    'no public business email captured',
    'no contact page url captured',
    'homepage fetch issue',
    'contact completeness is limited',
    'no clear public phone captured',
]


def normalize_domain(url: str) -> str:
    if not url:
        return ''
    url = url.strip().lower()
    url = re.sub(r'^https?://', '', url)
    url = re.sub(r'^www\.', '', url)
    return url.split('/')[0].split(':')[0]


def normalize_phone(phone: str) -> str:
    return re.sub(r'\D', '', phone or '')


def is_valid_phone(phone: str) -> bool:
    digits = normalize_phone(phone)
    if len(digits) == 11 and digits.startswith('1'):
        digits = digits[1:]
    if len(digits) != 10:
        return False
    if digits in BAD_PHONE_VALUES:
        return False
    if len(set(digits)) <= 2:
        return False
    if digits[:3] in {'000', '111', '123', '555'}:
        return False
    return True


def is_valid_email(email: str) -> bool:
    email = (email or '').strip().lower()
    if not email or email in BAD_EMAILS:
        return False
    if not re.match(r'^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$', email):
        return False
    if any(part in email for part in ['@example.', '@sentry.', 'your@email']):
        return False
    return True


def detect_domain_status(row: dict) -> str:
    website_domain = normalize_domain(row.get('website', ''))
    normalized = normalize_domain(row.get('normalized_domain', ''))
    source_domain = normalize_domain(row.get('source_url', ''))
    notes = (row.get('notes') or '').lower()
    all_domains = {d for d in [website_domain, normalized, source_domain] if d}

    if any(any(part in domain for part in PARKED_DOMAIN_PARTS) for domain in all_domains):
        return 'parked'
    if 'parked' in notes:
        return 'parked'
    if not website_domain and not normalized:
        return 'unreachable'
    if source_domain and website_domain and source_domain != website_domain and any(flag in notes for flag in ['directory', 'listing page', 'unrelated']):
        return 'irrelevant'
    return 'valid_business_site'


def score_row(row: dict) -> tuple[str, int, list[str], dict]:
    reasons: list[str] = []
    review_flags: list[str] = []
    notes = (row.get('notes') or '').lower()
    has_valid_phone = is_valid_phone(row.get('public_phone', ''))
    has_valid_email = is_valid_email(row.get('public_business_email', ''))
    has_contact_page = bool((row.get('contact_page_url') or '').strip())
    domain_status = detect_domain_status(row)

    if domain_status != 'valid_business_site':
        reasons.append(f'domain_status:{domain_status}')
    if row.get('public_phone') and not has_valid_phone:
        reasons.append('bad_phone')
    if row.get('public_business_email') and not has_valid_email:
        reasons.append('bad_email')
    if any(flag in notes for flag in NON_BUSINESS_NOTE_FLAGS):
        reasons.append('notes_hard_fail')

    if not row.get('public_phone'):
        review_flags.append('missing_phone')
    if not row.get('public_business_email'):
        review_flags.append('missing_email')
    if not has_contact_page:
        review_flags.append('missing_contact_page')
    if any(flag in notes for flag in REVIEW_NOTE_FLAGS):
        review_flags.append('notes_review')

    score = 0
    if domain_status == 'valid_business_site':
        score += 40
    if has_valid_phone:
        score += 25
    if has_valid_email:
        score += 20
    if has_contact_page:
        score += 10
    if row.get('city') and row.get('state') and row.get('category'):
        score += 5
    score = max(0, score - (25 * len(reasons)))

    if reasons:
        status = 'fail'
    elif has_valid_phone or has_valid_email or has_contact_page:
        status = 'review' if review_flags else 'pass'
    else:
        status = 'review'

    failure_reasons = reasons if status == 'fail' else review_flags
    return status, score, failure_reasons, {
        'has_valid_phone': has_valid_phone,
        'has_valid_email': has_valid_email,
        'has_contact_page': has_contact_page,
        'domain_status': domain_status,
    }


def main():
    parser = argparse.ArgumentParser(description='Validate and score prospect CSV rows.')
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--summary', required=True)
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    summary_path = Path(args.summary)

    with input_path.open(newline='') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        source_fields = reader.fieldnames or []

    fieldnames = source_fields + [f for f in DEFAULT_FIELDS if f not in source_fields]
    summary = Counter()
    reason_counts = Counter()
    scored_rows = []

    for row in rows:
        status, score, failure_reasons, derived = score_row(row)
        row['normalized_domain'] = row.get('normalized_domain') or normalize_domain(row.get('website', ''))
        row['record_status'] = status
        row['failure_reasons'] = '|'.join(failure_reasons)
        row['quality_score'] = str(score)
        row['has_valid_phone'] = 'true' if derived['has_valid_phone'] else 'false'
        row['has_valid_email'] = 'true' if derived['has_valid_email'] else 'false'
        row['has_contact_page'] = 'true' if derived['has_contact_page'] else 'false'
        row['domain_status'] = derived['domain_status']
        scored_rows.append(row)
        summary[status] += 1
        for reason in failure_reasons:
            reason_counts[reason] += 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scored_rows)

    summary_payload = {
        'input': str(input_path),
        'output': str(output_path),
        'total_rows': len(scored_rows),
        'status_counts': dict(summary),
        'reason_counts': dict(reason_counts),
    }
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary_payload, indent=2) + '\n')

    print(json.dumps(summary_payload, indent=2))


if __name__ == '__main__':
    main()
