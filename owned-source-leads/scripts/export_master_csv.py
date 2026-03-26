#!/usr/bin/env python3
import argparse
import csv
import json
from pathlib import Path

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


def main():
    parser = argparse.ArgumentParser(description='Export one unified master CSV.')
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    rows = read_csv(Path(args.input))
    write_csv(Path(args.output), rows, EXPORT_FIELDS)

    summary = {
        'input': args.input,
        'output': args.output,
        'row_count': len(rows),
        'fields': EXPORT_FIELDS,
    }
    summary_path = Path(args.output).with_name(Path(args.output).stem + '-summary.json')
    summary_path.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
