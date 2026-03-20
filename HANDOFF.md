# HANDOFF.md

If the session gets lost, reset, or the daemon/UI goes weird, use this file first.

Updated: 2026-03-20 12:51 AM America/Los_Angeles

## Immediate recovery checklist

1. Open the active workspace:
   - `/Users/moey/.openclaw/workspace`
2. Read these files in order:
   - `PROJECTS.md`
   - `NOW.md`
   - `HANDOFF.md`
3. If OpenClaw seems missing, check service health:
   - `openclaw gateway status`
   - if needed: `openclaw gateway start`
   - then: `openclaw status`
4. Local dashboard URL:
   - `http://127.0.0.1:18789/`

## Current truth

- Primary active project: **FACEMAXX**
- Intended next phase: **Phase 3**
- FACEMAXX app folder was not found in the active workspace snapshot
- FACEMAXX was found here instead:
  - `/Users/moey/.openclaw_old/workspace/facemaxx-mobile`

## What to do next for FACEMAXX

Update:
- `facemaxx-mobile/` has been restored into the active workspace
- Phase 3 implementation is now underway in `/Users/moey/.openclaw/workspace/facemaxx-mobile`
- TypeScript validation passed after the Phase 3 code update

Current next steps:
1. Run the restored project and confirm it boots on-device/web
2. Verify the new Phase 3 features actually work in runtime:
   - real image picker / upload handling
   - local result-generation logic
   - saved scan history / persistence
3. Capture proof screenshots / verification
4. Do the polish pass on motion and spacing

## UFC note

Before Phase 3, Moey requested a UFC refresh cadence change.
That was applied locally on this machine:
- `com.moey.ufc-operator-live-odds` now runs every **12 hours** (`43200`)
- `com.moey.ufc-operator-live-odds-fast` is **disabled**

Caveat:
- the UFC refresh job still references `ufc-operator-web/.env.local`
- the current visible UFC workspace snapshot is incomplete/log-heavy
- if UFC work resumes, verify actual app files and env state before changing anything else

## Hard preference from Moey

- **No cron jobs**
- **No autonomous loops**
- If periodic automation is ever proposed again, ask first

## Why these files exist

The point is simple:
- lose the session, keep the thread
- lose the UI, keep the plan
- lose the daemon, keep the recovery path
