# Verification Checklist

## Phase 1 — Strategy verification
- owned-source strategy exists
- hot lead definitions exist per vertical
- MCA inbound engine exists
- MCA prospecting engine exists
- debt inbound engine exists
- schema exists
- scoring logic exists
- buyer-readiness spec exists
- dashboard requirements exist
- operator workflow exists

## Phase 2 — Foundation verification
- datastore created
- attribution events stored
- scoring snapshots stored
- dashboard renders required metrics
- lead detail view shows all required fields
- export-ready flag works
- logs exist

## Phase 3 — MCA inbound verification
- main MCA landing page loads
- first 3 niche/city pages load
- CTA click tracked
- form start tracked
- form submit tracked
- score assigned on submit
- lead appears in dashboard
- lead detail shows source and scoring explanation
- at least one test lead reaches buyer-ready state

## Phase 4 — Debt inbound verification
- debt landing page loads
- debt calculator or quiz works
- consent capture stored
- score assigned on submit
- lead appears in dashboard
- lead detail shows consent proof
- export blocked if consent missing
- at least one test debt lead reaches buyer-ready state with consent

## Phase 5 — MCA prospecting verification
- public-source collector stores records
- normalization works
- enrichment works
- dedupe flags duplicates
- prospect scoring works
- review queue works
- approved prospect reaches buyer-ready state

## Phase 6 — Proof verification
- exact source attribution visible
- scoring explanation visible
- hot explanation visible
- dashboard metrics match stored records
- buyer export fields present
- operator flow can be followed without ambiguity
