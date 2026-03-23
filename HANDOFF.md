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

- Primary active project: **MonkeyMoltbook**
- Project path: `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- Build mode is locked to phased execution from John’s directive
- Current completed phase: **Phase 1 — scaffold**
- Mobile shell exists and preserves the single-screen rule
- Backend exists as Node.js + Express + WebSocket scaffold
- Verified local backend health endpoint: `http://127.0.0.1:8787/health`
- Immediate mode is **Phase 2 — chat**, not broader feature expansion

## What to do next for MonkeyMoltbook

1. Read:
   - `MonkeyMoltbook/HANDOFF.md`
   - `MonkeyMoltbook/STATUS.md`
   - `MonkeyMoltbook/docs/MVP.md`
2. Start Phase 2 only
3. Connect mobile to backend WebSocket
4. Render the first live hook message in-app
5. Re-run verification before moving to agents/swipe/preload work

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

## 2026-03-23 LooksMaxx submission milestone
- LooksMaxx was fully built, uploaded, and submitted to Apple today.
- Current App Store Connect state: **Waiting for Review**.
- If resuming LooksMaxx, do not restart launch prep from scratch.
- Resume by checking:
  1. App Store Connect review status
  2. `facemaxx-mobile/HANDOFF.md`
  3. `facemaxx-mobile/STATUS.md`
- Only act if Apple review changes state (approval / rejection / request for more info).
