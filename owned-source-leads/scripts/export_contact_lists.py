#!/usr/bin/env python3
import argparse
import csv
import json
from pathlib import Path

ROOT = Path('/Users/moey/.openclaw/workspace/owned-source-leads')

EXPORT_FIELDS = [
    'business_name',
    'website',
    'public_phone',
    'public_business_email',
    'city',
    'state',
    'category',
    'source_url',
]


def read_csv(path: Path):
    with path.open(newline='') as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows([{k: row.get(k, '') for k in fieldnames} for row in rows])


def has_phone(row: dict) -> bool:
    return str(row.get('has_valid_phone', row.get('public_phone', ''))).lower() == 'true' or bool(row.get('public_phone', '').strip())


def has_email(row: dict) -> bool:
    return str(row.get('has_valid_email', row.get('public_business_email', ''))).lower() == 'true' or bool(row.get('public_business_email', '').strip())


def main():
    parser = argparse.ArgumentParser(description='Export non-overlapping master / phone-only / email-only lists.')
    parser.add_argument('--input', required=True)
    parser.add_argument('--out-dir', required=True)
    parser.add_argument('--prefix', required=True)
    args = parser.parse_args()

    rows = read_csv(Path(args.input))
    out_dir = Path(args.out_dir)

    master, phone_only, email_only, excluded = [], [], [], []
    for row in rows:
        phone = has_phone(row)
        email = has_email(row)
        if phone and email:
            master.append(row)
        elif phone and not email:
            phone_only.append(row)
        elif email and not phone:
            email_only.append(row)
        else:
            excluded.append(row)

    master_path = out_dir / f'{args.prefix}-master.csv'
    phone_path = out_dir / f'{args.prefix}-phone-only.csv'
    email_path = out_dir / f'{args.prefix}-email-only.csv'
    excluded_path = out_dir / f'{args.prefix}-excluded-missing-both.csv'
    summary_path = out_dir / f'{args.prefix}-contact-lists-summary.json'

    write_csv(master_path, master, EXPORT_FIELDS)
    write_csv(phone_path, phone_only, EXPORT_FIELDS)
    write_csv(email_path, email_only, EXPORT_FIELDS)
    write_csv(excluded_path, excluded, EXPORT_FIELDS)

    summary = {
        'input': args.input,
        'master_count': len(master),
        'phone_only_count': len(phone_only),
        'email_only_count': len(email_only),
        'excluded_missing_both_count': len(excluded),
        'outputs': {
            'master': str(master_path),
            'phone_only': str(phone_path),
            'email_only': str(email_path),
            'excluded_missing_both': str(excluded_path),
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
