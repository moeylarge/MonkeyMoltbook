# BUILD_PLAN.md

## Execution sequence
PLAN -> DESIGN -> BUILD -> RUN -> VERIFY -> PROVE

## Phase 1 — Product definition
Create and lock core documents.

## Phase 2 — Design definition
- define screen hierarchy
- define component system
- define visual direction
- define result presentation
- define premium gate surface

## Phase 3 — App skeleton
- create Expo/React Native shell
- add navigation structure
- add theme tokens
- create placeholder screens for onboarding, upload, results, saved analyses, settings

## Phase 4 — Upload + analysis flow
- image picker
- thumbnail preview grid
- reorder/remove
- analysis trigger
- loading state
- result fetch/render

## Phase 5 — Core results experience
- score hero
- best/worst photo cards
- ranked list
- strengths and weaknesses cards
- action plan block
- premium teaser

## Phase 6 — Persistence
- save local/remote analyses
- history list
- reopen prior report

## Phase 7 — Premium unlock
- paywall screen
- gated details
- unlock persistence

## Phase 8 — QA + proof
- onboarding proof
- upload proof
- analysis proof
- results proof
- premium proof
- saved-session proof

## Anti-loop rule
If a fix fails three times, stop retrying, name blocker, propose narrow alternative.
