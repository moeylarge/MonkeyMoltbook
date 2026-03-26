#!/usr/bin/env python3
import argparse
import csv
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('/Users/moey/.openclaw/workspace/owned-source-leads')
DATA = ROOT / 'data'
STAGING = DATA / 'staging'
EXPORTS = DATA / 'exports'
VALIDATOR = ROOT / 'scripts' / 'validate_prospect_csv.py'
MASTER_EXPORTER = ROOT / 'scripts' / 'export_master_csv.py'

BASE_FIELDS = [
    'business_name', 'website', 'public_phone', 'public_business_email', 'city', 'state',
    'category', 'source_platform', 'source_url', 'contact_page_url', 'normalized_domain',
    'notes', 'niche_tag', 'geography_tag'
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_csv(path: Path):
    if not path.exists():
        return []
    with path.open(newline='') as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_ndjson(path: Path, rows: list[dict]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w') as f:
        for row in rows:
            f.write(json.dumps(row) + '\n')


def normalize_domain(url: str) -> str:
    if not url:
        return ''
    value = url.strip().lower()
    value = value.removeprefix('https://').removeprefix('http://').removeprefix('www.')
    return value.split('/')[0].split(':')[0]


def stage_discover(input_csv: Path):
    rows = read_csv(input_csv)
    discovered = []
    for row in rows:
        payload = {field: row.get(field, '') for field in BASE_FIELDS}
        payload['normalized_domain'] = row.get('normalized_domain') or normalize_domain(row.get('website', ''))
        payload['pipeline_stage'] = 'discovered'
        payload['job_state'] = 'queued'
        payload['last_attempt_at'] = now_iso()
        payload['retry_count'] = row.get('retry_count', '0') or '0'
        discovered.append(payload)
    write_ndjson(STAGING / 'discovered.ndjson', discovered)
    return discovered


def stage_canonicalize(rows: list[dict]):
    deduped = []
    seen = set()
    for row in rows:
        key = row.get('normalized_domain') or normalize_domain(row.get('website', '')) or row.get('business_name', '').strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        row = dict(row)
        row['pipeline_stage'] = 'canonicalized'
        row['job_state'] = 'ready_for_enrichment'
        deduped.append(row)
    write_ndjson(STAGING / 'canonical.ndjson', deduped)
    return deduped


def stage_enrich(rows: list[dict]):
    enriched = []
    for row in rows:
        row = dict(row)
        row['pipeline_stage'] = 'enriched'
        row['job_state'] = 'ready_for_validation'
        row['has_phone'] = 'true' if row.get('public_phone') else 'false'
        row['has_email'] = 'true' if row.get('public_business_email') else 'false'
        row['has_contact_page'] = 'true' if row.get('contact_page_url') else 'false'
        enriched.append(row)
    write_ndjson(STAGING / 'enriched.ndjson', enriched)
    return enriched


def stage_validate(rows: list[dict], run_name: str):
    input_path = STAGING / f'{run_name}-validation-input.csv'
    scored_path = EXPORTS / f'{run_name}-scored.csv'
    summary_path = EXPORTS / f'{run_name}-summary.json'
    fieldnames = sorted({key for row in rows for key in row.keys()} | set(BASE_FIELDS))
    write_csv(input_path, rows, fieldnames)
    subprocess.run([
        str(VALIDATOR),
        '--input', str(input_path),
        '--output', str(scored_path),
        '--summary', str(summary_path),
    ], check=True)
    return scored_path, summary_path


def split_exports(scored_csv: Path, run_name: str):
    rows = read_csv(scored_csv)
    buckets = {'pass': [], 'review': [], 'fail': []}
    for row in rows:
        buckets[row.get('record_status', 'review')].append(row)
    fieldnames = list(rows[0].keys()) if rows else []
    outputs = {}
    for status, status_rows in buckets.items():
        out_path = EXPORTS / f'{run_name}-{status}.csv'
        write_csv(out_path, status_rows, fieldnames)
        outputs[status] = str(out_path)

    master_path = EXPORTS / f'{run_name}-master.csv'
    subprocess.run([
        str(MASTER_EXPORTER),
        '--input', str(scored_csv),
        '--output', str(master_path),
    ], check=True)
    outputs['master'] = str(master_path)
    outputs['master_summary'] = str(EXPORTS / f'{run_name}-master-summary.json')
    return outputs


def write_manifest(run_name: str, counts: dict, summary_path: Path, exports: dict):
    manifest = {
        'run_name': run_name,
        'created_at': now_iso(),
        'staging': {
            'discovered': str(STAGING / 'discovered.ndjson'),
            'canonicalized': str(STAGING / 'canonical.ndjson'),
            'enriched': str(STAGING / 'enriched.ndjson'),
        },
        'counts': counts,
        'summary': str(summary_path),
        'exports': exports,
    }
    manifest_path = EXPORTS / f'{run_name}-manifest.json'
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    return manifest_path


def main():
    parser = argparse.ArgumentParser(description='Resumable staged pipeline for prospect CSVs.')
    parser.add_argument('--input', required=True)
    parser.add_argument('--run-name', default='prospects-v1')
    args = parser.parse_args()

    input_csv = Path(args.input)
    discovered = stage_discover(input_csv)
    canonical = stage_canonicalize(discovered)
    enriched = stage_enrich(canonical)
    scored_csv, summary_path = stage_validate(enriched, args.run_name)
    exports = split_exports(scored_csv, args.run_name)
    manifest_path = write_manifest(args.run_name, {
        'discovered': len(discovered),
        'canonicalized': len(canonical),
        'enriched': len(enriched),
    }, summary_path, exports)

    print(json.dumps({
        'run_name': args.run_name,
        'manifest': str(manifest_path),
        'exports': exports,
    }, indent=2))


if __name__ == '__main__':
    main()
