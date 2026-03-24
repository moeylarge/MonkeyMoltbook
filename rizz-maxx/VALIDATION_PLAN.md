# VALIDATION_PLAN.md

## Validation standard
Nothing is complete until it is run and verified.

## Phase validation checkpoints

### Product definition
- all required docs exist
- docs are internally consistent
- scope remains MVP only

### Design definition
- design tokens are defined
- result screen hierarchy is explicit
- screen list and flow are locked

### App shell
- app boots locally
- navigation works
- theme renders correctly
- no dead-end screens

### Upload flow
- user can add 4-10 photos
- previews render
- reorder works
- remove/replace works
- analyze CTA gates correctly

### Analysis flow
- loading state renders
- analysis endpoint or mock pipeline returns valid payload
- failure state is recoverable

### Results flow
- score renders
- best/worst photos render
- strengths/weaknesses render
- action plan renders
- premium teaser renders

### Persistence
- analysis saves
- history list reloads
- prior analysis reopens

### Premium
- paywall renders
- unlock state persists
- premium detail gates correctly

## Proof artifacts to produce later
- screenshots for each core screen
- short end-to-end run notes
- explicit verified/unverified status in STATUS.md
