# NOW.md

Updated: 2026-03-20 12:51 AM America/Los_Angeles

## Current active focus

**FACEMAXX**

## What we were doing

We were about to move from FACEMAXX Phase 2 into **Phase 3**.

Phase 2 was described as complete in concept:
- photo-entry screen
- scan illusion
- identity output (score / tier / archetype / rank)
- structured breakdown
- future simulation tease
- share-card tease
- paywall / progression layer
- improvement / retention framing

## What changed right before this note

Before moving to Phase 3, Moey asked to change the UFC betting refresh cadence.
That was done locally:
- `com.moey.ufc-operator-live-odds` → `43200` seconds (12 hours)
- `com.moey.ufc-operator-live-odds-fast` → disabled

## Current blocker / risk

The FACEMAXX project folder is **not in the current workspace snapshot**.
It was located at:
- `/Users/moey/.openclaw_old/workspace/facemaxx-mobile`

So the next practical step is **not** to blindly start coding in the current workspace.
The next step is:
1. restore or copy `facemaxx-mobile/` into the active workspace, or deliberately continue from the old workspace location
2. verify the project still runs
3. then begin Phase 3

Update: `facemaxx-mobile/` has now been restored into the active workspace and Phase 3 implementation has started in the live copy.

## Phase 3 target

Make FACEMAXX feel like a real product, not just a staged prototype:
- real image picker / upload handling
- local result-generation logic
- saved scan history / persistence
- proof / screenshots / verification
- motion and spacing polish

## Phase 3 progress so far

Implemented in `facemaxx-mobile/App.tsx`:
- Expo image picker wiring (`expo-image-picker`)
- local persisted scan history via AsyncStorage
- deterministic local score generation from selected image/photo seed
- history screen for rerating / opening prior scans
- restored FACEMAXX into active workspace at `/Users/moey/.openclaw/workspace/facemaxx-mobile`

Still pending:
- runtime verification / screenshots
- polish pass on motion and spacing

## Guardrails

- Do **not** create cron jobs or loops unless Moey explicitly asks
- Do **not** switch projects without clear instruction
- Preserve recovery state here and in `HANDOFF.md`
