# MEMORY.md

## Identity / continuity warning

If persona/user identity matters, it must be written into `IDENTITY.md`, `USER.md`, daily memory files, or this file. Do not assume prior chat history alone is enough.

## Project memory system

Use this continuity split going forward:
- `PROJECTS.md` → canonical index of all projects
- `NOW.md` → only the current active project / resume point
- `HANDOFF.md` → recovery path after UI/session/daemon failures
- `MEMORY.md` → durable decisions worth keeping across sessions
- project-local `HANDOFF.md` / `STATUS.md` → implementation-state truth close to the code

## LooksMaxx / FACEMAXX / LooksMaxxing

LooksMaxx is the current primary project and lives at `/Users/moey/.openclaw/workspace/facemaxx-mobile`.

Older notes may refer to the same project as **FACEMAXX** or **LooksMaxxing**.
Current brand direction is now settled around **LooksMaxx**.

### Durable state
- the project has moved far beyond the original prototype shell
- app now uses a real local analysis backend path by default for scans/battle analysis, with heuristic fallback when needed
- battle mode now supports a real second uploaded image and second analysis pass
- structured measurement vectors exist in scan records
- scans create local dataset-style export records and file-based JSON sample exports
- app/product surface has been materially polished beyond early mock-flow stage

### Backend direction
- chosen local stack:
  - OpenCV
  - InsightFace
  - MediaPipe
  - local calibration layer
- backend location: `facemaxx-mobile/analysis-backend/`
- health endpoint: `http://127.0.0.1:8089/health`
- `/analyze` has been verified end-to-end on a real face image
- do **not** switch to a hosted third-party analysis API right now

### Product direction
- current top product priority is making the **$4.99 one-time Full Review** feel excellent
- monthly Pro is a later step and should not launch until recurring-value features are real
- use the app like a real product for a while; if something feels off twice, log it and then fix it

### Current best next steps
1. Continue visual review/polish of the live app
2. Tighten weak copy/labels and remove trust-breaking or developer-ish UI
3. Continue backend/app refinement so recommendations and battle reasoning become more measurement-driven and less hand-tuned
4. Start collecting the first real consented participant/labeled sample batch when ready

### Important docs
- `PROJECTS.md`
- `NOW.md`
- `HANDOFF.md`
- `facemaxx-mobile/HANDOFF.md`
- `facemaxx-mobile/STATUS.md`
- `facemaxx-mobile/REVIEW_CHECKLIST.md`
- `facemaxx-mobile/analysis-backend/README.md`
- `facemaxx-mobile/LOOKSMAXXING_V2_ROADMAP.md`

## UFC betting engine / website

- visible project path: `/Users/moey/.openclaw/workspace/ufc-operator-web`
- related path: `/Users/moey/.openclaw/workspace/ufc-analytics`
- refresh cadence was intentionally changed to every 12 hours
- stale fast job was disabled
- caveat: env/config and real runtime state should be verified before resuming work
- local continuity file: `ufc-operator-web/HANDOFF.md`

## Social Clip OS

- path: `/Users/moey/.openclaw/workspace/social-clip-os`
- project exists and currently has a documented Kick lower-third workflow
- continuity is thinner here than in LooksMaxx
- if resumed, start with `social-clip-os/HANDOFF.md` and `social-clip-os/templates/kick/README.md`

## Recovery rule

After context loss, future-me should be able to answer within about 60 seconds:
1. what projects exist
2. which one is active
3. where the code lives
4. what changed recently
5. what should happen next
