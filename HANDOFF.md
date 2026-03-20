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
- Intended next phase: **finish Phase 3, then move to Phase 4**
- FACEMAXX has been restored into the active workspace at:
  - `/Users/moey/.openclaw/workspace/facemaxx-mobile`
- Moey ended the night to sleep and wants to resume tomorrow from FACEMAXX, not restart context discovery

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

## When the chat freezes

Use this checklist in order:

1. **Do not assume the project is lost**
   - first assume the UI/session may be broken before assuming the work is gone
2. **Check the gateway**
   - `openclaw gateway status`
   - if needed: `openclaw gateway start`
3. **Check the main session state**
   - `openclaw status`
4. **Reopen the local dashboard**
   - `http://127.0.0.1:18789/`
5. **Read continuity files before resuming work**
   - `PROJECTS.md`
   - `NOW.md`
   - `HANDOFF.md`
6. **If the session was extremely long or near context limits**
   - prefer a fresh `/new` after reading the continuity files
7. **Before major phase completion, update continuity files first**
   - especially before refreshing, restarting, or switching chats

## Why these files exist

The point is simple:
- lose the session, keep the thread
- lose the UI, keep the plan
- lose the daemon, keep the recovery path
