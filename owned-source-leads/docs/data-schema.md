# Data Schema

## Overview
The schema supports three lead paths:
- MCA inbound
- MCA prospecting
- Debt inbound

## Table: leads
Unified top-level lead record.

Fields:
- id
- vertical                    # mca | debt
- lead_type                   # inbound | prospecting
- source_type                 # landing_page | quiz | calculator | form | consultation | public_directory | public_business_site | public_social | public_linkedin_company | public_listing
- exact_source_detail         # slug or source platform detail
- status                      # new | in_review | approved | rejected | exported | duplicate | junk
- score                       # integer 0-100
- temperature                 # hot | warm | cold | junk
- hot_explanation             # text summary
- scoring_version
- export_ready                # boolean
- buyer_readiness_status      # ready | missing_fields | blocked | review_required
- created_at
- updated_at
- first_seen_at
- last_verified_at

## Table: inbound_lead_details
Fields:
- lead_id
- page_url
- landing_page_slug
- referrer_url
- source_bucket
- funnel_step
- funnel_path_json
- form_version
- submission_timestamp
- ip_hash                     # optional hashed operational anti-fraud field if used
- user_agent_hash             # optional hashed operational anti-fraud field if used

## Table: mca_inbound_fields
Fields:
- lead_id
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
- existing_advance
- monthly_deposits_range
- amount_needed_by_when

## Table: debt_inbound_fields
Fields:
- lead_id
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

## Table: consent_records
Fields:
- id
- lead_id
- consent_required            # boolean
- consent_checkbox_value
- consent_text_shown
- consent_text_version
- disclosure_text_shown
- page_url
- form_version
- consent_timestamp

## Table: prospect_details
Fields:
- lead_id
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

## Table: attribution_events
Fields:
- id
- lead_id
- event_type                  # page_view | cta_click | form_start | form_submit | quiz_complete | calculator_complete
- page_url
- referrer_url
- utm_source
- utm_medium
- utm_campaign
- utm_term
- utm_content
- event_timestamp

## Table: scoring_snapshots
Fields:
- id
- lead_id
- vertical
- lead_type
- rules_applied_json
- positive_signals_json
- negative_signals_json
- score_components_json
- final_score
- final_temperature
- hot_reason_codes_json
- explanation_text
- scored_at

## Table: dedupe_keys
Fields:
- id
- lead_id
- dedupe_type                 # email | phone | domain | business_name_geo | person_vertical
- dedupe_value
- created_at

## Table: review_actions
Fields:
- id
- lead_id
- reviewer
- review_status               # pending | approved | rejected | needs_enrichment | duplicate
- notes
- action_timestamp

## Table: export_batches
Fields:
- id
- buyer_name
- vertical
- batch_status                # draft | ready | sent | failed
- record_count
- created_at
- exported_at

## Required indexes
- leads(vertical, lead_type, temperature, status)
- inbound_lead_details(landing_page_slug, submission_timestamp)
- prospect_details(source_platform, category, state)
- dedupe_keys(dedupe_type, dedupe_value)
- attribution_events(event_type, event_timestamp)
