# MCA Prospecting Engine

## Goal
Generate strong-fit MCA business prospects from lawful public business data gathered by our own collection system.

## Scope
This engine is secondary to inbound MCA, but required.
It produces review-ready prospect leads, not automatic hot leads.

## Allowed source classes
- public business websites
- public directories
- public contact pages
- public company social profiles
- public LinkedIn company pages
- public listing platforms

## Prohibited collection
Do not collect:
- private consumer data
- hidden data
- banking info
- SSNs
- non-public personal information
- personal emails not clearly public for business use

## Prospect flow

### Step 1 — Collect source records
Create raw business-source records with:
- business_name
- source_platform
- source_url
- website
- public_phone
- public_business_email
- city
- state
- category
- contact_page_url

### Step 2 — Normalize
Normalize fields:
- canonical business name
- canonical domain
- normalized phone
- normalized category
- normalized city/state

### Step 3 — Enrich
Derive and store:
- industry_fit
- likely funding relevance
- website health
- contactability completeness
- geography fit
- multi-location indicator
- notes

### Step 4 — Deduplicate
Deduplicate by:
- normalized_domain
- normalized_phone
- normalized_business_name + city + state

### Step 5 — Score
Score based on:
- business legitimacy signals
- likely funding fit
- contactability completeness
- vertical niche match
- geography priority
- freshness of verification

### Step 6 — Temperature
Assign:
- hot
- warm
- cold
- junk

Hot here means high-fit review-ready prospect, not self-submitted intent.

### Step 7 — Review queue
Operator approves, rejects, or enriches further.

## Required fields
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
- notes
- score
- temperature
- status
- created_at
- last_verified_at

## MCA prospect hot criteria
A prospect may be marked hot when:
- business identity is clear and legitimate
- category shows likely funding demand
- public contactability is strong
- location and business type align with target niche
- source and verification are recent
- duplicate risk is low

## Reason code examples
- Public business website with clear contact path
- Strong niche fit for working-capital demand
- Contact phone and business email present
- Verified recent public listing and live website
