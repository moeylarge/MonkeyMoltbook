# MEMORY.md

## Purpose

This file stores durable cross-session memory only.

It is for:
- long-term project facts
- stable strategic decisions
- durable technical choices
- continuity architecture
- recovery rules

It is not for:
- temporary session summaries
- the currently active project
- short-lived next steps
- raw chat logs
- speculative or unverified status
- day-to-day implementation churn

If information is likely to change soon, it belongs in `NOW.md`, `HANDOFF.md`, or project-local `HANDOFF.md` / `STATUS.md`, not here.

---

## Identity / continuity warning

If user identity or agent identity matters, it must be written into authoritative continuity files.

Do not assume prior chat history alone is enough.

Identity and continuity should be anchored in:
- `IDENTITY.md` → agent identity and operating rules
- `USER.md` → user identity and stable preferences
- `PROJECTS.md` → canonical project index
- `NOW.md` → only the currently active project / resume point
- `HANDOFF.md` → latest recovery path after session/UI/daemon failure
- `MEMORY.md` → durable cross-session memory
- project-local `HANDOFF.md` / `STATUS.md` → implementation-state truth close to the code

---

## Continuity architecture

Use this continuity split going forward:

- `PROJECTS.md` → canonical index of all projects
- `NOW.md` → only the current active project and immediate resume point
- `HANDOFF.md` → latest global recovery path after UI/session/daemon/context failure
- `MEMORY.md` → durable decisions and long-term memory worth keeping across sessions
- project-local `HANDOFF.md` / `STATUS.md` → current implementation-state truth near the code

### Precedence rule

When recovering continuity, prefer sources in this order:

1. `IDENTITY.md`
2. `USER.md`
3. `NOW.md`
4. `HANDOFF.md`
5. `PROJECTS.md`
6. `MEMORY.md`
7. project-local `HANDOFF.md` / `STATUS.md`
8. archived logs only if needed

### Interpretation rule

Treat:
- `NOW.md` as the source of truth for what is active right now
- `HANDOFF.md` as the source of truth for what happened last and what should happen next
- `PROJECTS.md` as the source of truth for what projects exist
- `MEMORY.md` as the source of truth for durable long-term project facts and strategic decisions

Do not use `MEMORY.md` as the primary source for current active status if more current structured files exist.

---

## LooksMaxx

Canonical project path:
`/Users/moey/.openclaw/workspace/facemaxx-mobile`

Older notes may refer to the same project as:
- FACEMAXX
- LooksMaxxing

Current brand direction is settled around:
- LooksMaxx

### Durable project memory

- the project has moved far beyond the original prototype shell
- the app uses a real local analysis backend path by default for scans and battle analysis, with heuristic fallback when needed
- battle mode supports a real second uploaded image and second analysis pass
- structured measurement vectors exist in scan records
- scans create local dataset-style export records and file-based JSON sample exports
- the product/app surface has been materially polished beyond early mock-flow stage

### Durable backend direction

Chosen local stack:
- OpenCV
- InsightFace
- MediaPipe
- local calibration layer

Backend location:
- `facemaxx-mobile/analysis-backend/`

Verified local endpoint:
- `http://127.0.0.1:8089/health`

Verified behavior:
- `/analyze` has been verified end-to-end on a real face image

Strategic backend rule:
- do **not** switch to a hosted third-party analysis API unless that decision is explicitly revisited and replaced

### Durable product direction

- launch strategy was changed to a free-first launch before stronger monetization pressure
- the free period is intended for learning, traction, and feedback
- App Store naming block was already chosen:
  - `LooksMaxx`
  - fallback: `LooksMaxx: Looks Rater`
  - fallback: `LooksMaxx: Looks Rating System`
- App Store subtitle is locked:
  - `Looks rating, face analysis, beauty scan`
- App Store keywords are locked:
  - `looksmax,looksmaxxing,face analysis,looks rating,glow up,attractiveness test,face scan,beauty score,archetype,selfie,beautymaxx,beautymax`
- Apple submission / launch checklist already exists and is part of the launch-prep path
- explicit launch discipline was set:
  - no new feature ideas
  - no random redesigns
  - only fix real launch blockers
  - submit
- product-quality rule was set:
  - use the app like a real product
  - if something feels off twice, log it and then fix it

### Current-state rule for LooksMaxx

Do not store “LooksMaxx is the current primary project” in durable memory, because that can change.

Whether LooksMaxx is the active focus right now must be determined from:
- `NOW.md`
- `HANDOFF.md`
- `facemaxx-mobile/HANDOFF.md`
- `facemaxx-mobile/STATUS.md`

### Important docs

Global:
- `PROJECTS.md`
- `NOW.md`
- `HANDOFF.md`

Project-local:
- `facemaxx-mobile/HANDOFF.md`
- `facemaxx-mobile/STATUS.md`
- `facemaxx-mobile/REVIEW_CHECKLIST.md`
- `facemaxx-mobile/analysis-backend/README.md`
- `facemaxx-mobile/LOOKSMAXXING_V2_ROADMAP.md`

---

## UFC betting engine / website

Visible project path:
- `/Users/moey/.openclaw/workspace/ufc-operator-web`

Related path:
- `/Users/moey/.openclaw/workspace/ufc-analytics`

### Durable memory

- refresh cadence was intentionally changed to every 12 hours
- stale fast job was disabled
- John recalls that the UFC project also included a website at `https://www.ufcpickspro.com/`
- John recalls that the site was deployed on Vercel and that password protection was added
- current caveat: the visible local workspace snapshot does **not** currently preserve obvious Vercel config or password-protection implementation details, so that deployment state may need to be recovered from Vercel rather than local files

### Resume caution

- env/config and real runtime state should be verified before resuming work

### Important doc

- `ufc-operator-web/HANDOFF.md`

---

## Social Clip OS

Project path:
- `/Users/moey/.openclaw/workspace/social-clip-os`

### Durable memory

- project exists
- it has a documented Kick lower-third workflow
- continuity is currently thinner here than in LooksMaxx

### Resume docs

- `social-clip-os/HANDOFF.md`
- `social-clip-os/templates/kick/README.md`

---

## Durable project roster rule

The set of projects may evolve over time.

Do not infer the active project from this file alone.
Use `PROJECTS.md` to determine what projects exist.
Use `NOW.md` to determine which project is active right now.
Use `HANDOFF.md` to determine the latest recovery path.

---

## Memory hygiene rules

When updating this file:

- keep only durable information likely to matter again across future sessions
- remove or relocate temporary status to `NOW.md` or `HANDOFF.md`
- do not copy raw transcripts into this file
- do not store volatile “current focus” statements here
- do not store short-lived next-step lists here
- do not let this file become a dumping ground for session summaries

If a fact is important but likely to change soon, it does not belong here.

---

## Recovery rule

After context loss, future-me should be able to answer within about 60 seconds:

1. what projects exist
2. where the code lives
3. which files contain current truth
4. what durable decisions are already locked
5. where to look next for exact current status

To answer:
- use `PROJECTS.md` for project list
- use `NOW.md` for active focus
- use `HANDOFF.md` for latest resume path
- use project-local `HANDOFF.md` / `STATUS.md` for implementation truth
- use `MEMORY.md` for durable long-term context only