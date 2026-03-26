# Deduplication Rules

## Objective
Prevent duplicate leads from inflating counts, damaging buyer trust, or causing repeated review work.

## Lead classes
- MCA inbound
- MCA prospecting
- Debt inbound

## Deduplication principles
1. Never silently destroy records.
2. Mark duplicates and link them to a canonical lead.
3. Keep source/event history even if a lead is deduped.
4. Inbound and prospecting records can dedupe differently.
5. Debt leads must preserve consent records even when deduped.

## Canonical lead rule
Choose the canonical record by:
1. highest data completeness
2. strongest attribution proof
3. strongest consent proof where required
4. newest valid submission for inbound intent
5. most recently verified record for prospecting

## MCA inbound dedupe keys
Primary:
- phone
- email
- business_name + state + funding_amount_range within recent window

Secondary:
- business_name + city + state
- phone + business_name
- email + business_name

## Debt inbound dedupe keys
Primary:
- phone
- email

Secondary:
- first_name + last_name + state + phone
- first_name + last_name + state + email

## MCA prospecting dedupe keys
Primary:
- normalized_domain
- normalized_phone

Secondary:
- business_name + city + state
- public_business_email
- source_platform + source_url

## Time windows
### Inbound
- same-day duplicate window: aggressive merge review
- 7-day duplicate window: mark probable duplicate and review
- 30-day repeat inquiry: preserve as re-engagement if newer submission shows renewed intent

### Prospecting
- 30-day verification window: likely same record
- 90-day stale record: allow refresh instead of hard duplicate block

## Special cases
### Repeat inbound with stronger intent
If the same person/business submits again with better completion or higher urgency:
- keep newest as canonical
- preserve older submission as history
- mark as repeat_intent, not junk

### Debt inbound consent mismatch
If duplicate records have differing consent proof:
- canonical record must include the strongest valid consent record
- never export a debt lead missing consent proof

### Prospect + inbound collision
If a business exists in prospecting and later self-submits inbound:
- inbound record becomes primary sales record
- prospect record remains linked as source history
- never treat public prospecting as stronger than self-submitted inbound intent

## Duplicate statuses
- duplicate_exact
- duplicate_probable
- repeat_intent
- refreshed_prospect
- canonical

## Operator actions
- merge to canonical
- keep separate
- mark repeat intent
- reject junk duplicate
- refresh stale prospect

## Export rule
No lead marked duplicate_exact or duplicate_probable may export until reviewed or resolved.
