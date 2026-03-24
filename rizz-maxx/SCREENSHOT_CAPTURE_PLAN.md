# RizzMaxx — Shot-by-Shot Screenshot Capture Plan

## Purpose
Map the final 14-shot App Store screenshot package to the current app state so capture work is concrete and efficient.

This answers:
- which current screens already satisfy the slot
- which screens still need polish before final capture
- which existing screenshots can likely be reused vs replaced

---

# High-level assessment

## Current reusable base captures already present
Files in `rizz-maxx/screenshots/`:
- `01-onboarding.png`
- `02-upload.png`
- `03-results.png`
- `04-saved.png`
- `05-compare.png`

## Current app screens/components relevant to final set
Primary screens:
- `app/src/screens/OnboardingScreen.tsx`
- `app/src/screens/UploadScreen.tsx`
- `app/src/screens/ResultsScreen.tsx`
- `app/src/screens/SavedScreen.tsx`
- `app/src/screens/CompareScreen.tsx`
- `app/src/screens/PremiumScreen.tsx`

Key proof/depth components:
- `ResultsHero.tsx`
- `PremiumDetailsCard.tsx`
- `PremiumPreviewCard.tsx`
- `LoadingState.tsx`
- `HistoryStatsCard.tsx`
- `CompareSummaryCard.tsx`
- `CompareDetailsCard.tsx`

---

# iPhone capture plan

## 1) Onboarding hero
### Current screen match
- `OnboardingScreen.tsx`

### Current asset match
- likely based on existing `screenshots/01-onboarding.png`

### Status read
- **likely reusable with polish review**

### Why
The screen already has:
- strong opening promise
- CTA
- product explanation
- hero visual support

### What to check before locking
- top headline readability in App Store crop
- whether the current title is too long for final screenshot framing
- whether the visual hierarchy cleanly matches the new screenshot copy deck

### Reuse verdict
- **reuse candidate**
- replace only if hierarchy/crop feels weak

---

## 2) Upload / set-building
### Current screen match
- `UploadScreen.tsx`

### Current asset match
- likely based on existing `screenshots/02-upload.png`

### Status read
- **likely reusable with light polish**

### Why
The screen already shows:
- loaded sample set support
- metrics cards
- upload framing
- set-building guidance

### What to check before locking
- use a loaded sample set, not empty state
- make sure metrics are legible at App Store size
- choose photo order that looks credible and visually strong

### Reuse verdict
- **reuse candidate**
- replace if current screenshot is too busy or too empty

---

## 3) Results hero
### Current screen match
- `ResultsScreen.tsx`
- `ResultsHero.tsx`
- best-photo and first-cut sections live on this screen

### Current asset match
- likely based on existing `screenshots/03-results.png`

### Status read
- **strong reuse candidate, but highest-priority polish review**

### Why
This is already the core product payoff screen.
It contains:
- score
- summary
- best photo to lead with
- first photo to remove

### What to check before locking
- headline area should not feel crowded
- score + summary + best/weakest need a clean crop hierarchy
- if premium-locked state hides too much, use the strongest free preview that still proves value

### Reuse verdict
- **reuse if excellent**
- otherwise recapture deliberately; this is the most important screenshot in the full set

---

## 4) Saved analyses / history
### Current screen match
- `SavedScreen.tsx`
- `HistoryStatsCard.tsx`
- `CompareSummaryCard.tsx`
- `SavedAnalysisCard.tsx`

### Current asset match
- likely based on existing `screenshots/04-saved.png`

### Status read
- **probably reusable, but depends on saved-data richness**

### Why
The screen is structurally correct for the slot.

### What to check before locking
- saved state should contain enough realistic saved analyses
- cards should look populated, not sparse
- if too many elements compete, crop toward the strongest history section

### Reuse verdict
- **reuse candidate if populated well**
- replace if current data density feels thin

---

## 5) Compare view
### Current screen match
- `CompareScreen.tsx`
- `CompareSummaryCard.tsx`
- `CompareDetailsCard.tsx`

### Current asset match
- likely based on existing `screenshots/05-compare.png`

### Status read
- **likely reusable with moderate polish review**

### Why
The screen already serves the exact intended story:
- old vs new
- summary delta
- details of what changed

### What to check before locking
- ensure two strong saved analyses exist
- the comparison delta must read instantly
- choose crop emphasizing summary + improved/changed signal

### Reuse verdict
- **reuse candidate**
- replace if current comparison is not visually obvious enough

---

## 6) Premium / pricing
### Current screen match
- `PremiumScreen.tsx`
- `PricingOptionCard`

### Current asset match
- **no known existing screenshot yet**

### Status read
- **new capture required**

### Why
No existing premium screenshot is in the saved set.

### Important continuity note
Current `PremiumScreen.tsx` visible prices are:
- `$4.99/mo`
- `$29.99`

But current locked business truth is:
- `$9.99`
- `$29.99`

So this screen is a **required polish/update zone before final capture**.

### Required pre-capture check
- price display must match current locked pricing truth
- final premium framing must feel clean and trustworthy
- choose whether the screen emphasizes monthly vs lifetime or balances both

### Reuse verdict
- **cannot reuse**
- **must capture new after pricing/polish check**

---

## 7) Expanded results breakdown / action-plan proof
### Current screen match
- `ResultsScreen.tsx` premium-unlocked state
- sections:
  - `What is working`
  - `What is costing you`
  - `What to do next`
  - possibly `Replacement guidance`

### Current asset match
- **no known existing screenshot yet**

### Status read
- **new capture required**

### Why
This screen slot was only recently locked.
It is the proof-of-depth shot.

### Best exact crop recommendation
Capture the premium-unlocked result state with strongest emphasis on:
- `What is costing you`
- `What to do next`
- optionally part of `Replacement guidance`

### Why this crop
That is the clearest proof that the product is strategic, not just scoring.

### Reuse verdict
- **cannot reuse**
- **must capture new**

---

# iPad capture plan

## General rule
Do not simply enlarge the iPhone shots.
Use the same 7-screen story, but recapture with more breathable layout and stronger composition.

## iPad 1) Onboarding hero
- source: `OnboardingScreen.tsx`
- status: **new iPad capture required**
- likely low-risk if phone version is already strong

## iPad 2) Upload / set-building
- source: `UploadScreen.tsx`
- status: **new iPad capture required**
- important to use wider layout cleanly

## iPad 3) Results hero
- source: `ResultsScreen.tsx`
- status: **new iPad capture required**
- likely one of the highest-value tablet captures

## iPad 4) Saved analyses / history
- source: `SavedScreen.tsx`
- status: **new iPad capture required**
- larger canvas should make history feel richer

## iPad 5) Compare view
- source: `CompareScreen.tsx`
- status: **new iPad capture required**
- should benefit strongly from more space

## iPad 6) Premium / pricing
- source: `PremiumScreen.tsx`
- status: **new iPad capture required**
- must wait until pricing display matches locked price truth

## iPad 7) Expanded results breakdown / action plan
- source: premium-unlocked `ResultsScreen.tsx`
- status: **new iPad capture required**
- likely very strong on iPad because the action-plan depth can breathe

---

# Screens that already satisfy a final slot structurally
These screens already map well to the final storyboard and likely do not need conceptual redesign:
- OnboardingScreen
- UploadScreen
- ResultsScreen
- SavedScreen
- CompareScreen
- PremiumScreen

Meaning: this is mostly a **capture/polish problem**, not a product-structure problem.

---

# Screens that still need polish before final capture

## 1) Premium / pricing screen
### Why
- current visible code still shows `$4.99/mo`, which conflicts with the locked current business truth of `$9.99`
- final capture should not happen until this is reconciled

## 2) Expanded action-plan proof state
### Why
- this is a new screenshot slot
- needs intentional crop choice and likely premium-unlocked capture state
- must make the app feel deeper than a generic photo score tool

## 3) Results hero (conditional polish)
### Why
- this is the highest-value screenshot in the whole set
- even if existing capture is usable, it deserves deliberate review and possible recapture

## 4) Saved / compare data setup (conditional polish)
### Why
- these screens may need stronger seeded analysis data to feel submission-ready
- if existing data looks sparse, capture quality will underperform

---

# Reuse vs replace summary

## Likely reusable or reusable-with-light-polish
- `01-onboarding.png`
- `02-upload.png`
- `03-results.png` (pending strongest review)
- `04-saved.png`
- `05-compare.png`

## Must be newly created
- iPhone premium / pricing
- iPhone expanded results breakdown / action plan
- all 7 iPad screenshots

## Most likely replacement candidates if quality is not high enough
- `03-results.png`
- `04-saved.png`
- `05-compare.png`

---

# Recommended execution order

## Pass 1 — lock blocking polish
1. reconcile premium screen price display with locked truth (`$9.99` / `$29.99`)
2. decide exact premium-unlocked results crop for screenshot #7
3. ensure saved/compare seed data is strong enough for capture

## Pass 2 — finalize iPhone set
1. onboarding
2. upload
3. results hero
4. saved/history
5. compare
6. premium/pricing
7. action-plan proof

## Pass 3 — capture iPad set
Repeat same narrative order, but optimize composition for tablet.

---

# Tight conclusion

## Already structurally good
- the app already has the right 7-screen story

## Main polish risks
- premium pricing mismatch
- proof-of-depth screenshot not yet captured
- some existing captures may need a stronger data state or crop

## Fastest path to submission-quality screenshots
- reuse the strongest 5 existing phone captures if they survive review
- create 2 new iPhone screenshots
- create full 7-shot iPad set
- do not capture premium/pricing until the displayed prices are reconciled with the locked current pricing truth
