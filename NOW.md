# NOW.md

Updated: 2026-03-20 12:51 AM America/Los_Angeles

## Current active focus

**FACEMAXX**

## Status for next session

Moey resumed FACEMAXX. Phase 3 has been runtime-validated enough to continue, and Phase 4 is now implemented.

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

Phase 4 progress so far:
- personalized improvement engine added
- max potential score surfaced in the plan view
- recommendations now include category, impact, difficulty, time to result, and estimated score lift
- identity tagline added to result flow
- uncertainty-loop copy added to encourage re-uploads

Post-phase refinement progress so far:
- glow-up tracker now includes timeline graph + best-version card
- wording shifted further toward face optimization / potential framing
- battle mode upgraded toward a true two-face compare via manual friend entry
- share system now supports multiple caption tones

Still pending:
- screenshots / visual proof capture
- final visual review using `facemaxx-mobile/REVIEW_CHECKLIST.md`
- any last micro-cleanup after visual review
- serious backend/model work should follow `facemaxx-mobile/FACEMAXX_V2_ROADMAP.md`
- chosen analysis direction is now the fuller stack: OpenCV + InsightFace + MediaPipe + FACEMAXX calibration
- `analysis-backend/` is now scaffolded with preprocess/detect/landmarks/calibration/server modules
- Python environment installed successfully and backend health check now passes at `http://127.0.0.1:8089/health`
- `/analyze` now succeeds end-to-end on a real face test image: OpenCV preprocessing works, InsightFace detection works, MediaPipe landmark extraction works via the Tasks API, and calibration returns a structured FACEMAXX payload
- FACEMAXX app now prefers the local backend (`http://127.0.0.1:8089/analyze`) for scans and battle analysis, with heuristic fallback if the backend is unavailable
- response mapping has been deepened so backend quality/detection/landmark signals feed more directly into UI explanations and stored measurement quality fields
- backend now emits richer measurement fields (ratios/symmetry-style metrics), and the app now threads more of those into stored measurements, identity copy, battle copy, and recommendation detail
- richer backend measurements are now also exposed visually in the UI via a backend measurement panel and geometry readout
- archetype/recommendation logic has now been pushed further toward measurement-driven behavior using jaw ratio, face ratio, symmetry, and backend quality signals
- next backend/app step: continue refining learned/calibrated mapping so these measurement-driven decisions become less hand-tuned over time
- collect the first 25 real labeled samples and run the merge flow on actual data
- real monetization plumbing only if Moey wants to move beyond prototype framing

Latest major upgrade:
- direct in-app camera capture added
- score engine moved from URI/hash-style mock behavior toward image-derived local analysis using uploaded image metadata, byte-signal sampling, and face-detection-derived structural cues
- battle mode now supports a real second uploaded image and second analysis pass
- manual battle entry remains as fallback when no second image is provided
- structured measurement vectors now exist in app scan records (landmarks, ratios, symmetry, quality/confidence, rejection/warning outputs)
- scans now also create local training-style dataset export records
- scans now write file-based JSON sample exports via Expo file system, not just app storage
- first dataset/training scaffold docs added (`RATING_RUBRIC.md`, `training/README.md`)

Latest polish pass:
- spacing tightened across major screens
- button sizing and tap targets made more consistent
- wrapped multi-card rows more safely for mobile layouts
- section rhythm and vertical spacing cleaned up

Latest review notes:
- archetype labels aligned more closely with the original FACEMAXX brief
- tier labels aligned with Normie / Above Average / Attractive / Elite / Genetic Outlier
- social caption tones softened away from overly gimmicky phrasing while keeping engagement
- optimization framing tightened further across the app

## Guardrails

- Do **not** create cron jobs or loops unless Moey explicitly asks
- Do **not** switch projects without clear instruction
- Preserve recovery state here and in `HANDOFF.md`


Context-save update:
- FACEMAXX current state is strong enough that a new session should NOT restart planning from scratch.
- Local backend is working end-to-end and app is connected to it.
- Immediate resume point: visual review + polish, then continue backend/app refinement and real sample collection.
