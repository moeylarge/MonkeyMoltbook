# Compliance Notes

## Objective
Set conservative operating rules for lead generation in MCA and debt settlement.

## Global rules
- use only lawful public business data for MCA prospecting
- do not scrape private consumer data
- do not buy lead lists as a system dependency
- store attribution and proof cleanly
- do not make deceptive claims

## MCA notes
- focus on business-purpose funding pages and business-source prospecting
- avoid collecting restricted financial data during initial intake
- collect only what is needed for fit, routing, and review

## Debt notes
Debt inbound must be more conservative.

Rules:
- inbound only
- self-submitted only
- consent capture required
- disclosure text shown must be stored
- do not scrape consumer hardship data
- do not collect unnecessary sensitive data too early
- do not present deceptive promises or guaranteed outcomes

## Consent handling
For debt inbound, store:
- consent checkbox value
- consent text shown
- consent version
- timestamp
- page URL
- form version

## Export restriction rule
Do not export debt inbound leads if consent proof is missing, broken, or unverifiable.

## Review caution
This system spec is operational, not legal advice.
Before production launch, final page copy, disclosures, and buyer handoff language should be reviewed for the intended jurisdiction and traffic sources.
