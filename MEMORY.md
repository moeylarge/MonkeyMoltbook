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
- backend now emits richer ratio/symmetry-style measurements, and the app now uses more of those fields in stored measurements, identity copy, battle explanation, recommendation detail, and visible UI panels
- archetype/recommendation logic is now more explicitly driven by measurement fields like jaw ratio, face ratio, symmetry, and backend quality/confidence signals
- before attempting a deeply trained attractiveness model, use the roadmap files in `facemaxx-mobile/` to build the measurement schema, dataset, and v1 model pipeline
- only add real monetization plumbing after validating the product loop

Recovery files to read first if context is lost:
- `PROJECTS.md`
- `NOW.md`
- `HANDOFF.md`
- `facemaxx-mobile/REVIEW_CHECKLIST.md`


End-of-context save:
- FACEMAXX has moved far beyond the original prototype. The app now uses a real local analysis backend path by default for scans/battle analysis, with fallback to the older in-app heuristic path if the backend is unavailable.
- Local backend stack chosen and working: OpenCV + InsightFace + MediaPipe + FACEMAXX calibration.
- Backend location: `facemaxx-mobile/analysis-backend/`
- Backend health endpoint: `http://127.0.0.1:8089/health`
- Web app local preview: `http://127.0.0.1:19008/`
- Proven backend status:
  - OpenCV preprocessing works
  - InsightFace detection works
  - MediaPipe landmarks work via Tasks API
  - `/analyze` returns a structured FACEMAXX payload end-to-end
- App integration status:
  - app now prefers backend analysis for main scans and battle image analysis
  - richer backend measurements now feed stored measurement data, explanation copy, visible UI panels, battle reasoning, and recommendation detail
  - backend measurement panel + geometry readout are visible in UI
  - archetype/recommendation behavior is now more measurement-driven
- Training/data pipeline status:
  - structured measurement vectors exist in app scan records
  - confidence/rejection logic exists
  - scans create local dataset export records
  - scans also write file-based JSON sample exports
  - training scaffold exists under `facemaxx-mobile/training/`
  - labeling workflow exists
  - manifest builder exists
  - annotation merge workflow exists
  - first 25-sample batch packet exists
  - incoming participant folder structure + Desktop shortcut exist
- Easy-access training folder symlink: `~/Desktop/FACEMAXX-training`
- Current important training/backend docs to read first in a new session:
  - `facemaxx-mobile/FULL_STACK_INTEGRATION_PLAN.md`
  - `facemaxx-mobile/FACEMAXX_V2_ROADMAP.md`
  - `facemaxx-mobile/analysis-backend/README.md`
  - `facemaxx-mobile/analysis-backend/USAGE.md`
  - `facemaxx-mobile/training/STATUS.md`
  - `facemaxx-mobile/training/FIRST_BATCH_PLAN.md`
  - `facemaxx-mobile/REVIEW_CHECKLIST.md`
- Best next steps after context reset:
  1. Continue visual review/polish of the live app now that backend measurements are visible
  2. Tighten any weak copy/labels revealed in visual review (especially upload/result/developer-ish labels)
  3. Continue backend/app refinement so more measurement fields influence battle reasoning and recommendations
  4. In parallel, start collecting the first real consented participant batch and place exports into `training/raw-exports/`
- Most important recent commits near the current state:
  - `f7b18e9` — fix MediaPipe integration and pass analyze test
  - `3b70047` — connect app scans to local analysis backend
  - `91ff585` — deepen backend response mapping in app
  - `28bd2a3` — enrich backend measurements and app mapping
  - `ed3edc3` — surface backend measurements in UI
  - `1ddaa56` — make archetype and recommendations more measurement-driven
