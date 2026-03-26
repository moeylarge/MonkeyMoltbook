# Debt Inbound Lead Engine

## Goal
Generate self-submitted, consented debt-settlement leads from pages, calculators, quizzes, and consultation flows that we own.

## Scope
Owned inbound only.
No consumer scraping.
No cold consumer outbound list generation.

## Page set — first required pages
- /debt-settlement
- /do-i-qualify-for-debt-settlement
- /credit-card-debt-help
- /debt-relief-options
- /debt-settlement-vs-consolidation
- /monthly-payment-pressure-calculator
- /debt-settlement-california
- /debt-settlement-florida
- /consultation-request
- /debt-hardship-check

## Page behavior rules
Each page must:
- educate clearly
- avoid deceptive promises
- route toward one assessment CTA
- capture attribution
- store consent language shown at time of submit
- avoid collecting unnecessary sensitive data too early

## Primary CTAs
- Start Free Assessment
- Check If You May Qualify
- See Your Options
- Request Consultation
- Start Debt Relief Review

## Funnel design

### Step 1 — Intent page
User lands on debt-help, qualification, comparison, or calculator page.

### Step 2 — Quiz, calculator, or short form
Collect:
- first_name
- last_name
- phone
- email
- state
- estimated_unsecured_debt_range
- payment_pressure_level
- hardship_indicator
- consultation_intent
- preferred_contact_method
- consent_checkbox

### Step 3 — Consent capture
Store:
- consent_text_version
- consent_checkbox_value
- consent_timestamp
- page_url
- form_version

### Step 4 — Scoring
Assign score + temperature + reason codes.

### Step 5 — Review readiness
Lead appears in dashboard with consent proof and attribution.

## Debt hot lead criteria
A lead is hot when most of the following are true:
- self-submitted through an owned debt page
- consent is present and stored
- estimated unsecured debt suggests serviceable need
- payment pressure is meaningful
- hardship signal is present
- consultation intent is explicit
- contact fields are complete
- source path is intact

## Explanation examples
- Self-submitted through debt qualification page
- Consent captured at intake
- Debt amount range suggests likely fit
- Hardship/payment pressure indicates strong intent
- Requested consultation or debt review

## Compliance posture
- conservative intake
- clear disclosures
- no deceptive savings claims
- no scraping consumer hardship data
- store consent proof cleanly
