# Operator Workflow

## Objective
Run a loop-free lead operation that prioritizes owned-source hot lead generation and produces buyer-ready records.

## Workflow 1 — Daily inbound check
1. open dashboard
2. review new inbound leads today
3. filter hot leads first
4. verify attribution and captured fields
5. verify scoring explanation
6. approve buyer-ready leads
7. push non-ready leads to review_required or missing_fields

## Workflow 2 — MCA prospect review
1. open MCA prospect queue
2. sort by score desc
3. review only hot and warm prospects first
4. verify website, phone, email, source URL, category, city/state
5. reject junk or duplicate records immediately
6. approve review-ready prospects for export bucket

## Workflow 3 — Funnel QA
1. review top landing pages by submissions
2. inspect form start vs submit drop-off
3. inspect page-level hot lead rate
4. only change pages with proven weak conversion or broken attribution
5. lock working pages after verification

## Workflow 4 — Buyer export prep
1. filter approved + export_ready leads
2. separate by vertical and lead type
3. generate export batch
4. verify required proof fields
5. log batch creation
6. mark exported records after send

## Workflow 5 — Exception handling
- duplicate -> mark duplicate and link canonical lead
- missing attribution -> block export
- missing consent for debt -> block export
- broken scoring -> rescore before review
- weak prospect record -> send to needs_enrichment or reject

## Operator rule set
- do not rebuild working pages without proof of failure
- do not widen intake fields without reason
- do not export without proof fields
- do not let content pages exist without CTA path
- do not treat prospecting leads as equivalent to self-submitted inbound intent
