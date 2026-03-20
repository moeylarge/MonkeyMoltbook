# MEMORY.md

## FACEMAXX

FACEMAXX is the current primary project and lives at `/Users/moey/.openclaw/workspace/facemaxx-mobile`.

As of 2026-03-20, FACEMAXX has progressed from recovery/state-loss mode into a prototype-complete, review-ready build.

Completed layers:
- core flow
- breakdown engine
- identity/progression framing
- improvement engine
- retention systems
- viral/share systems
- monetization framing
- follow-up refinement pass

Important upgrades completed on 2026-03-20:
- timeline graph + best-version card
- copy shifted toward optimization/potential framing
- battle mode upgraded toward real two-face compare
- multiple caption/share tones
- image-derived local analysis replaced older seed/hash-only scoring behavior
- battle mode now supports a real second uploaded image and second analysis pass
- structured measurement vectors now exist in app scan records, including landmarks/ratios/symmetry/quality/confidence/rejection outputs
- scans now create local training-style dataset export records for future model work
- scans now also write file-based JSON sample exports through Expo file system
- v2 docs now include roadmap, measurement schema, dataset schema, rating rubric, model plan, and training scaffold

Current recommendation:
- FACEMAXX now also has a documented v2 roadmap for real measurement / dataset / model / calibration work
- the workspace now includes a real labeling scaffold under `facemaxx-mobile/training/` with annotation schema/template, merge rules, status docs, raw/annotation/merged/review folders, a manifest builder script, an annotation merge script, and a first-batch rater packet
- the chosen technical direction for the next serious engine upgrade is the fuller local stack: OpenCV + InsightFace + MediaPipe + FACEMAXX calibration, scaffolded under `facemaxx-mobile/analysis-backend/`
- `analysis-backend/` now contains initial Python modules for preprocessing, detection/alignment, landmarks, calibration, FastAPI server, requirements, and usage docs, and the local backend environment installs successfully with a passing `/health` check
- `/analyze` now works end-to-end against a real face test image: OpenCV preprocessing works, InsightFace detection works, MediaPipe landmark extraction works via the Tasks API, and FACEMAXX calibration returns a structured payload
- FACEMAXX app now prefers the local backend endpoint for primary scans and battle-image analysis, while retaining heuristic fallback
- response mapping was deepened so backend quality/detection/landmark results now influence UI explanations and stored measurement quality fields more directly
- before attempting a deeply trained attractiveness model, use the roadmap files in `facemaxx-mobile/` to build the measurement schema, dataset, and v1 model pipeline
- only add real monetization plumbing after validating the product loop

Recovery files to read first if context is lost:
- `PROJECTS.md`
- `NOW.md`
- `HANDOFF.md`
- `facemaxx-mobile/REVIEW_CHECKLIST.md`
