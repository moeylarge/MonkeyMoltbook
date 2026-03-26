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
The live stack is verified, and the first lean finish export now exists. The project should stay in pilot-finish mode and avoid reopening broad rebuild work.

New finish-cut checkpoint:
- audited usable assets for Shots 01, 02, 04, 05, 06, optional 07, and 08 in `friends-ai/FINISH_CUT_AUDIT_2026-03-25.md`
- wrote lean assembler config: `friends-ai/assembler/config/not-a-couple-v3-restructured-finish.json`
- exported updated cut: `friends-ai/assembler/output/not-a-couple-v3-restructured-finish.mp4`
- build artifacts + subtitles: `friends-ai/assembler/build/not-a-couple-v3-restructured-finish/`
- actual cut path used: Shot 01 -> Shot 02 -> Shot 04 -> Shot 05 -> Shot 06 -> Shot 08
- Shot 03 omitted intentionally
- Shot 07 omitted intentionally in the first export
- Shot 08 used as locked still, not motion
- export uses temp `say` voices and generated room tone so the assembly can be judged immediately without new paid work


Active stack:
- Fal = stills / identity lock
- Kling = motion
- HeyGen = talking-character
- ElevenLabs = voices

Latest verified Mon + Chance truth:
- hero-lock package extended with tighter prompt control and upload-ready reference variants

Latest verified Shot 08 truth:
- deterministic rebuild package now exists at `friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button/`
- best existing ensemble geometry source is `friends-ai-pilot-assets/story-shots/07-ensemble-payoff.png`
- stronger cleaned one-source upload reference was prepared at `friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button/fal-input/08-final-spiral-upload-ref-strongclean-v2.jpg`
- controlled direct FAL still pass 1 remains audit memory only and was a **REJECT** because readable-ish chalkboard copy and partial mirrored window-logo language were reconstructed into the image
- one controlled direct FAL still pass 2 was completed and saved at `friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button/outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png`
- payload audit saved at `friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button/outputs/2026-03-25/shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.json`
- scorecard saved at `friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button/scorecards/shot-08-direct-pass-2-strongclean-v2-scorecard-2026-03-25.md`
- latest Shot 08 still verdict is **PASS / FINAL STILL LOCKED**
- one controlled Kling O1 reference-conditioned motion attempt was then completed and saved at `friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button/motion-clips/2026-03-25/shot-08-final-spiral-2026-03-25-motion-pass-1-kling-o1-reference.mp4`
- motion scorecard saved at `friends-ai-pilot-assets/quality-rebuild/shot-08-final-spiral-button/scorecards/shot-08-motion-pass-1-kling-o1-reference-scorecard-2026-03-25.md`
- latest Shot 08 motion verdict is **REJECT / CLOSED FOR NOW** because the motion pass rewrote acting, posture, and ensemble hierarchy instead of preserving the locked still
- John explicitly approved keeping the Shot 08 still locked as final and running no more Shot 08 motion variants unless motion strategy is reopened
- browser pass 2 proved the playground was brittle because it retained stock example `image_urls` instead of binding the approved close reference
- a clean direct FAL Nano Banana Pro edit path is now verified from this machine using `friends-ai/.env` + a one-image data-URI payload
- one real direct still pass was completed and saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-1.png`
- payload audit saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-1.json`
- that direct pass is still a **REJECT** because Mon remains too soft/cute and the pair tension is not benchmark-grade yet
- one more surgical direct pass was completed and saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-3.png`
- payload audit saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-3.json`
- that pass was a **REJECT** because the background still carried readable mirrored `Central Perk`-style homage signage
- a same-geometry cleaned close reference was then prepared and saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/fal-input/04-mon-chance-upload-ref-close-cleaned.jpg`
- one deterministic direct still pass was run using that cleaned reference as the sole bound source image
- keeper output saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.png`
- payload audit saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/outputs/2026-03-25/mon-chance-2026-03-25-direct-pass-4-cleanref.json`
- scorecard saved at `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-4-cleanref-scorecard-2026-03-25.md`
- latest real Mon + Chance still verdict is now **PASS / KEEPER**
- the prior blocker is resolved: the cleaned reference prevented readable homage signage while preserving Central Peak continuity and pair geometry
- immediate resume docs now live in:
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/deterministic-handoff-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/run-log-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-1-scorecard-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-2-scorecard-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-3-scorecard-2026-03-25.md`
  - `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-direct-pass-4-cleanref-scorecard-2026-03-25.md`

Recommended order:
1. preserve `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/fal-input/04-mon-chance-upload-ref-close-cleaned.jpg` as the approved bound still reference for this beat
2. treat `mon-chance-2026-03-25-direct-pass-4-cleanref.png` as the Mon + Chance hero-shot keeper
3. keep `mon-chance-2026-03-25-motion-pass-3-kling-o1-reference.mp4` as the current Shot 04 motion keeper
4. keep `shot-08-final-spiral-2026-03-25-direct-pass-2-strongclean-v2.png` locked as the final Shot 08 still deliverable
5. keep Shot 08 motion closed for now; do not run more motion variants unless John explicitly reopens motion strategy
6. Shot 03 was reopened for one controlled shared-eyeline-source still retry under `friends-ai-pilot-assets/quality-rebuild/shot-03-group-notices-sign/` and the result was still **REJECT**
7. do not spend another paid Shot 03 still pass from that geometry; solving it now requires a newly staged six-character source rather than another prompt tweak
8. for the immediate finish push, treat Shot 03 as **skippable / restructurable**, not mandatory
9. use the finish path in `friends-ai/PILOT_FINISH_MODE_2026-03-25.md`: Shot 01 -> Shot 02 -> Shot 04 -> Shot 05 -> Shot 06 -> optional Shot 07 bridge only if needed -> Shot 08 final still
10. use editorial timing, dialogue, and sound to carry the missing group-notice exposition instead of reopening broad generation work
11. two direct Veo 2 motion tests failed on face stability / tension preservation and remain audit memory only:
   - pass 1 clip: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-1-veo2.mp4`
   - pass 1 scorecard: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-motion-pass-1-veo2-scorecard-2026-03-25.md`
   - pass 2 clip: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-2-veo2-minimal.mp4`
   - pass 2 scorecard: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-motion-pass-2-veo2-minimal-scorecard-2026-03-25.md`
12. one controlled Kling O1 reference-conditioned motion attempt is now complete and **PASS**:
   - clip: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/motion-clips/2026-03-25/mon-chance-2026-03-25-motion-pass-3-kling-o1-reference.mp4`
   - scorecard: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/scorecards/mon-chance-motion-pass-3-kling-o1-reference-scorecard-2026-03-25.md`
   - review contact sheet: `friends-ai-pilot-assets/quality-rebuild/mon-chance-hero-lock/review/motion-pass-3-kling-o1-reference/contact-sheet.jpg`
13. keep the locked still fixed; it did not need to be reopened
14. treat the current direct Veo 2 image-to-video path as rejected for this shot
15. no GitHub skill / external workflow escalation is warranted unless John explicitly wants assembler/config implementation work

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
