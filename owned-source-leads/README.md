# Owned-Source Hot Lead Generation System

This project defines a functionality-first, loop-free system for generating hot leads from owned sources for:
- Merchant Cash Advance buyers
- Debt Settlement buyers

## Current state
- Phase 1 strategy docs completed
- Phase 2 foundation built
- Phase 3 MCA inbound pages built
- Phase 4 debt inbound pages started

## Live foundation
- SQLite datastore
- attribution event storage
- scoring layer
- dashboard UI
- lead detail view UI
- test intake page
- JSON API routes

## Live MCA pages
- /merchant-cash-advance
- /do-i-qualify-for-mca
- /same-day-business-funding
- /merchant-cash-advance-restaurants
- /merchant-cash-advance-los-angeles

## Live debt pages
- /debt-settlement
- /do-i-qualify-for-debt-settlement
- /monthly-payment-pressure-calculator

## Immediate next build order
1. verify MCA prospecting flow end-to-end
2. add normalization/dedupe review actions
3. build buyer routing/export layer

## Prospect data pipeline
Use the validator first, then the staged pipeline.

### Validate an existing CSV
```bash
npm run prospects:validate -- \
  --input data/texas-roofing-prospects-v1.csv \
  --output data/exports/texas-roofing-prospects-v1-scored.csv \
  --summary data/exports/texas-roofing-prospects-v1-summary.json
```

This adds:
- `record_status` = `pass|review|fail`
- `failure_reasons`
- `quality_score`
- `has_valid_phone`
- `has_valid_email`
- `has_contact_page`
- `domain_status`

### Run the resumable staged pipeline
```bash
npm run prospects:pipeline -- \
  --input data/texas-roofing-prospects-v1.csv \
  --run-name texas-roofing-v1
```

This writes:
- `data/staging/discovered.ndjson`
- `data/staging/canonical.ndjson`
- `data/staging/enriched.ndjson`
- `data/exports/<run>-scored.csv`
- `data/exports/<run>-pass.csv`
- `data/exports/<run>-review.csv`
- `data/exports/<run>-fail.csv`
- `data/exports/<run>-manifest.json`
