# Lead Scoring Logic

## Purpose
Score every lead consistently, explain the score, and assign a temperature.

Temperature values:
- hot
- warm
- cold
- junk

## MCA inbound scoring
Base principle:
Self-submitted owned-source funding leads have the strongest path to hot.

### Positive signals
- self-submitted via owned MCA page
- complete phone + email
- business name present
- revenue band indicates likely fit
- time in business indicates likely fit
- near-term urgency
- realistic funding request
- niche or geo page match with funding intent
- optional second-step qualifiers completed

### Negative signals
- missing phone and email
- no business name
- unrealistic or contradictory inputs
- weak attribution or broken funnel path
- obvious junk submission

### Example weighting
- owned self-submit: +25
- complete contact info: +15
- business name present: +10
- viable monthly revenue band: +15
- viable time in business: +10
- urgent need: +10
- realistic funding ask: +10
- second-step completion: +5

### Temperature thresholds
- 80-100 hot
- 55-79 warm
- 30-54 cold
- below 30 junk

## MCA prospect scoring
Base principle:
Public-source MCA records start lower than self-submitted inbound leads and require fit + verification.

### Positive signals
- live business website
- clear business phone
- public business email
- contact page present
- niche with likely working-capital demand
- multi-source verification
- clear location and category match

### Negative signals
- no website and weak listing
- no usable business contact info
- unclear business legitimacy
- duplicate match
- dead domain or stale listing

### Example weighting
- live website: +20
- public phone: +15
- public business email: +15
- contact page present: +10
- strong category fit: +15
- geo relevance: +10
- multi-source verification: +10
- freshness verification: +5

### Temperature thresholds
- 75-100 hot
- 50-74 warm
- 25-49 cold
- below 25 junk

## Debt inbound scoring
Base principle:
Debt hot leads must be self-submitted, consented, attributable, and clearly indicative of debt-relief intent.

### Positive signals
- self-submitted via owned debt page
- consent captured
- complete phone + email
- debt range suggests serviceable fit
- payment pressure present
- hardship signal present
- consultation intent explicit
- calculator/quiz completion

### Negative signals
- missing consent
- missing phone and email
- weak or contradictory inputs
- broken attribution
- obvious spam/junk

### Example weighting
- owned self-submit: +20
- consent captured: +20
- complete contact info: +15
- serviceable debt range: +15
- payment pressure: +10
- hardship indicator: +10
- consultation intent: +5
- quiz/calculator completion: +5

### Temperature thresholds
- 80-100 hot
- 55-79 warm
- 30-54 cold
- below 30 junk

## Required explanation output
Every scored lead must store:
- final score
- final temperature
- top positive reasons
- top negative reasons
- concise hot explanation

## Required hot explanation examples
### MCA inbound
- Self-submitted through owned MCA qualification page with complete business contact information and viable funding-fit inputs.

### MCA prospecting
- Public business prospect with verified website, phone, business email, and strong industry fit for working-capital outreach.

### Debt inbound
- Self-submitted debt lead with consent captured, complete contact information, hardship signal, and strong debt-relief intent.
