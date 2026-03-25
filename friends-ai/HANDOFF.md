# HANDOFF.md

## Project
Friends AI

## Current state
Friends AI is now a formally structured concept project in the workspace, with the core creative architecture written down instead of living only in chat.

### Locked current truth
- working title: `Friends AI`
- world anchor cafe: `Central Peak`
- apartment `2A` residents: Mon + Rachelle
- apartment `2B` residents: Chance + Jojo
- Russ is a constant across-the-hall presence
- Gunty is the recurring deadpan café worker anchor
- current launch format: `4-minute pilot`
- pilot title: `Not a Couple`

### Core concept
An original comfort sitcom designed to give audiences the emotional warmth, chemistry, and returnability of a beloved friend-group show, while building its own cast, world, visual language, and dialogue identity.

## Source-of-truth docs
Read these first:
1. `friends-ai/MASTER_BIBLE.md`
2. `friends-ai/PILOT_SCRIPT_NOT_A_COUPLE_V2.md`
3. `friends-ai/PRODUCTION_BEAT_SHEET_NOT_A_COUPLE.md`
4. `friends-ai/CAST_BIBLE.md`
5. `friends-ai/VISUAL_STYLE_GUIDE.md`
6. `friends-ai/PROMPT_PACK_V1.md`
7. `friends-ai/IDENTITY_LOCK_BATCH.md`
8. `friends-ai/DRIFT_REVIEW_FRAMEWORK.md`
9. `friends-ai/PRODUCTION_STACK_MAP_V1.md`
10. `friends-ai/TOOL_DECISION_MATRIX.md`
11. `friends-ai/API_ACCESS_TRACKER.md`
12. `friends-ai/IDENTITY_LOCK_RUNBOOK.md`
13. `friends-ai/FAL_IDENTITY_LOCK_MON_V1.md`
14. `friends-ai/FAL_IDENTITY_LOCK_CHANCE_V1.md`
15. `friends-ai/FAL_MON_REQUEST_V1.md`
16. `friends-ai/FAL_MON_REQUEST_V1.sh`

## What was completed
- master concept architecture written down
- pilot script v2 written
- shot-by-shot production beat sheet written
- cast bible written
- visual style guide written
- `PROMPT_PACK_V1.md` written
- `IDENTITY_LOCK_BATCH.md` written
- `DRIFT_REVIEW_FRAMEWORK.md` written
- `PRODUCTION_STACK_MAP_V1.md` written
- `TOOL_DECISION_MATRIX.md` written
- `API_ACCESS_TRACKER.md` written
- `IDENTITY_LOCK_RUNBOOK.md` written
- machine-level access snapshot written: `ACCESS_VERIFICATION_SNAPSHOT_2026-03-24.md`
- active live stack is now verified enough to start:
  - Fal
  - Kling
  - HeyGen
  - ElevenLabs
- active still-image backbone changed from Replicate to Fal after Replicate remained blocked and Fal passed funded API generation
- first Fal-ready identity-lock prompts written:
  - `FAL_IDENTITY_LOCK_MON_V1.md`
  - `FAL_IDENTITY_LOCK_CHANCE_V1.md`
- first direct Fal Mon request artifacts written:
  - `FAL_MON_REQUEST_V1.md`
  - `FAL_MON_REQUEST_V1.sh`

## Correct next step
The live stack is verified, and Mon + Chance hero-shot prep is now one step further along.

Active stack:
- Fal = stills / identity lock
- Kling = motion
- HeyGen = talking-character
- ElevenLabs = voices

Latest verified Mon + Chance truth:
- hero-lock package extended with tighter prompt control and upload-ready reference variants
- browser pass 2 proved the playground was brittle because it retained stock example `image_urls` instead of binding the approved close reference
- a clean direct FAL Nano Banana Pro edit path is now verified from this machine using `friends-ai/.env` + a one-image data-URI payload
- one real direct still pass was completed and saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-1.png`
- payload audit saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-1.json`
- that direct pass is still a **REJECT** because Mon remains too soft/cute and the pair tension is not benchmark-grade yet
- one more surgical direct pass was completed and saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-3.png`
- payload audit saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-3.json`
- that pass is also a **REJECT**: Mon improved and reads more controlled, but the background still carries readable mirrored `Central Perk`-style homage signage, so Central Peak continuity still hard-fails
- immediate resume docs now live in:
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/deterministic-handoff-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/run-log-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-1-scorecard-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-2-scorecard-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-3-scorecard-2026-03-25.md`

Recommended order:
1. prepare a same-geometry close reference that removes or obscures the window-sign region from the bound source image
2. keep using `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/run_direct_still_pass.mjs`
3. keep a single-image deterministic bind
4. rerun only after the source reference no longer carries the homage-sign memory
5. only if it clears all gates, upscale or motion-test it

## Risks / cautions
- much of the strategic title discussion was intentionally aggressive around discoverability; keep the actual creative execution structurally original enough to avoid devolving into direct-copy scene design
- do not let generation drift into random furry/cartoon energy
- keep the world premium, cozy, and emotionally readable
- preserve consistent geography for Central Peak, 2A, 2B, and hallway

## Resume line
If resuming after a reset: do **not** re-brainstorm the series from scratch and do **not** keep extending the old 9-shot cut. Read the pilot quality docs first, then move directly into the Mon + Chance hero-lock package in `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/`.
cozy, and emotionally readable
- preserve consistent geography for Central Peak, 2A, 2B, and hallway

## Resume line
If resuming after a reset: do **not** re-brainstorm the series from scratch. Read the docs above and move directly into the Fal identity-lock flow starting with the Mon request script.
