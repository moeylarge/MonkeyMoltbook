# PROJECTS.md

This is the canonical project list for fast recovery after resets, daemon issues, or context loss.

## Operating rules

- Do **not** create cron jobs, heartbeat loops, or autonomous execution loops unless Moey explicitly asks.
- Use `NOW.md` and `HANDOFF.md` to preserve active state before context switches.
- If a project seems missing, check both:
  - `/Users/moey/.openclaw/workspace`
  - `/Users/moey/.openclaw_old/workspace`
- Commit meaningful workspace changes so project state survives session loss.

## Active projects

### 1) FACEMAXX
- **Status:** ACTIVE / CURRENT PRIMARY FOCUS
- **Type:** Mobile app
- **Current phase:** Phase 4 implemented; next should be Phase 5 retention systems
- **Last known state:** Phase 2 prototype completed with hook → upload → scan → result → breakdown → simulation → paywall → improvement flow
- **Last known path:** `/Users/moey/.openclaw_old/workspace/facemaxx-mobile`
- **Important note:** `facemaxx-mobile/` is **not present** in the current workspace snapshot. Do not assume it is gone; it was found in `.openclaw_old/workspace/`.
- **Next target:** restore/relocate the app into the active workspace, then continue Phase 3 (real image picker, local result generation, saved history, proof/polish)

### 2) UFC betting engine / website
- **Status:** PAUSED
- **Type:** Website / data refresh system
- **Current visible path:** `/Users/moey/.openclaw/workspace/ufc-operator-web`
- **Current state:** workspace snapshot mostly contains logs, not the full app state
- **Refresh note:** on 2026-03-20, the local LaunchAgent `com.moey.ufc-operator-live-odds` was changed from every 120 seconds to every 12 hours (`StartInterval = 43200`)
- **Cleanup note:** stale fast job `com.moey.ufc-operator-live-odds-fast` was disabled because it referenced a missing script
- **Caveat:** the main refresh job still references `.env.local`, so cadence is fixed but the refresh itself may still fail until the project/env is restored

### 3) Kids gaming skill app
- **Status:** PAUSED / CONTINUITY LOST
- **Type:** Mobile/web game app
- **Last known state:** the project had progressed much further than early Phase 1, but the final completion-stage state was not preserved before a long-session freeze/reset
- **Recovery note:** treat the previously completed state as unreliable unless the project files/proof are rediscovered; if resumed later, be ready to restart cleanly
- **Rule:** do not resume automatically unless Moey asks

### 4) KickChampz
- **Status:** BACKGROUND / STRATEGIC
- **Type:** content business / clipping growth system
- **Rule:** strategic project remains relevant, but it is not the current build focus unless Moey switches back to it
