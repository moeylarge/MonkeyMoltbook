# Buyer Readiness Specification

## Objective
A lead is buyer-ready only when it has enough proof, structure, and qualification context to be sold directly to an MCA or debt-settlement buyer.

## Required buyer-ready fields
- lead_id
- vertical
- lead_type
- source_type
- exact_source_detail
- page_url or source_url
- created_at
- score
- temperature
- status
- hot_explanation
- review_status
- export_ready

## Required buyer-ready details — inbound
- submitted fields
- attribution trail
- landing page slug
- submission timestamp
- funnel step completed
- form version
- consent record where required

## Required buyer-ready details — MCA prospecting
- business_name
- website
- public_phone
- public_business_email
- city
- state
- category
- source_platform
- source_url
- contact_page_url
- verification timestamp

## Required readiness gates
A lead is NOT buyer-ready if:
- attribution is missing
- core contact fields are missing
- score not calculated
- temperature not assigned
- explanation missing
- duplicate unresolved
- review status blocked
- debt lead missing consent record

## Export categories
- MCA inbound hot leads
- MCA prospecting hot leads
- Debt inbound hot leads
- Warm-review batches by vertical

## Buyer-facing proof expectations
We should be able to answer:
- where did this lead come from?
- when was it collected or submitted?
- what made it hot?
- what fields are present?
- was consent captured where required?
- was it deduplicated?

## Export-ready decision rule
A lead becomes export_ready=true only when:
1. required fields are present
2. scoring snapshot exists
3. temperature exists
4. hot explanation exists
5. duplicate status is clear
6. review status is approved or auto-approved per rule
7. consent requirements are satisfied for debt inbound
