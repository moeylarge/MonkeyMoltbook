# MCA Inbound Lead Engine

## Goal
Generate self-submitted MCA leads from pages, forms, quizzes, and qualification flows that we own.

## Page set — first required pages
- /merchant-cash-advance
- /same-day-business-funding
- /do-i-qualify-for-mca
- /merchant-cash-advance-restaurants
- /merchant-cash-advance-trucking
- /merchant-cash-advance-auto-repair
- /merchant-cash-advance-los-angeles
- /merchant-cash-advance-miami
- /merchant-cash-advance-houston
- /working-capital-for-small-business

## Page behavior rules
Each page must:
- target one clear funding intent
- explain the offer above the fold
- provide one primary CTA above the fold
- capture attribution on load and submit
- route to short form or quiz
- feed scoring on submission

## Primary CTAs
- Check If You Qualify
- Get Funding Options
- See If Your Business Pre-Qualifies
- Request Working Capital Review
- Start Qualification Check

## Funnel design

### Step 1 — Intent page
User lands on a page tied to a query or niche.

### Step 2 — Short qualification form
Collect:
- first_name
- last_name
- business_name
- phone
- email
- business_type
- city
- state
- monthly_revenue_range
- time_in_business
- funding_amount_range
- urgency
- preferred_contact_method

### Step 3 — Optional second-step qualifiers
Collect, if user continues:
- existing_advance
- monthly_deposits_range
- amount_needed_by_when

### Step 4 — Scoring
Assign hot/warm/cold/junk + score + explanation.

### Step 5 — Review and export readiness
Lead appears in dashboard and review queue with attribution proof.

## Hot lead criteria — MCA inbound
A lead is hot when most of the following are true:
- self-submitted through an owned funding page
- contact fields are complete
- funding request is realistic
- monthly revenue band is viable
- time in business is viable
- urgency indicates near-term need
- business type is fundable or serviceable
- attribution is intact

## Explanation examples
- Self-submitted on MCA qualification page
- Strong funding intent on same-day funding page
- Complete business contact information
- Revenue and time-in-business suggest viable MCA fit
- Requested funding with near-term urgency

## Required stored proof
- page_url
- landing_page_slug
- first_seen_at
- submitted_at
- referrer
- utm_source
- utm_medium
- utm_campaign
- form_version
- scoring_snapshot_id
- temperature
- hot_reason_codes
