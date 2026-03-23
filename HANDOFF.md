# HANDOFF.md

If the session gets lost, the UI freezes, or the daemon goes weird, use this file first.

Updated: 2026-03-23 America/Los_Angeles

## Immediate recovery checklist

1. Open the active workspace:
   - `/Users/moey/.openclaw/workspace`
2. Read these root files in order:
   - `PROJECTS.md`
   - `NOW.md`
   - `HANDOFF.md`
3. Open the active project's local continuity files:
   - `facemaxx-mobile/HANDOFF.md`
   - `facemaxx-mobile/STATUS.md`
4. If OpenClaw itself seems unhealthy, check service status:
   - `openclaw gateway status`
   - if needed: `openclaw gateway start`
   - then: `openclaw status`
5. Local dashboard URL:
   - `http://127.0.0.1:18789/`

## Current truth

- Primary active project: **LooksMaxx**
- Older docs/chats may still call it **FACEMAXX** or **LooksMaxxing**
- Project path: `/Users/moey/.openclaw/workspace/facemaxx-mobile`
- Project is already in a strong local-build state
- Local backend is real, working, and connected to the app
- Immediate mode is **review + polish + trustworthiness refinement**, not blank-slate planning

## What to do next for LooksMaxx

1. Read:
   - `facemaxx-mobile/HANDOFF.md`
   - `facemaxx-mobile/STATUS.md`
   - `facemaxx-mobile/REVIEW_CHECKLIST.md`
2. Run a fresh visual/product review
3. Tighten weak copy, labels, and any trust-breaking UX
4. Continue backend/app refinement so measurement-driven decisions feel more credible
5. Start first real labeled/exported sample collection when ready

## Important project truths to not lose

- The backend stack is local and deliberate:
  - OpenCV
  - InsightFace
  - MediaPipe
  - local calibration layer
- Do **not** switch to a hosted third-party looks-analysis API right now
- Current business/product focus is a **free-first launch** for **2–4 weeks** or until roughly **1000 users**
- Immediate goal is traction/feedback/learning, not early monetization pressure
- Monthly Pro is future-facing, not the immediate launch priority

## UFC note

Before later LooksMaxx work, Moey requested a UFC refresh cadence change.
That was applied locally:
- `com.moey.ufc-operator-live-odds` now runs every **12 hours** (`43200`)
- `com.moey.ufc-operator-live-odds-fast` is **disabled**

If UFC work resumes:
- read `ufc-operator-web/HANDOFF.md`
- verify `.env.local`
- verify refresh pipeline before changing anything else

## Social Clip OS note

Social Clip OS exists and currently has a documented Kick lower-third workflow.
If it becomes active again:
- read `social-clip-os/HANDOFF.md`
- read `social-clip-os/templates/kick/README.md`
- generate fresh samples before making design calls

## Hard preferences from Moey

- **No cron jobs**
- **No autonomous loops**
- Ask before periodic automation or background execution changes

## When the chat freezes

Use this order:
1. Do not assume the project is gone
2. Check gateway health
3. Read continuity files
4. Prefer a fresh session if the old one was very long
5. Before major resets/restarts, update continuity files first

## Why these files exist

The point is simple:
- lose the session, keep the thread
- lose the UI, keep the plan
- lose the daemon, keep the recovery path
