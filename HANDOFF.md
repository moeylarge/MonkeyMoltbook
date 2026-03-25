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
   - `rizz-maxx/STATUS.md`
   - `rizz-maxx/app/src/analysisApi.ts`
   - `rizz-maxx/server/src/index.mjs`
4. If OpenClaw itself seems unhealthy, check service status:
   - `openclaw gateway status`
   - if needed: `openclaw gateway start`
   - then: `openclaw status`
5. Local dashboard URL:
   - `http://127.0.0.1:18789/`

## Current truth

- Primary active project: **FRIENDS AI**
- Project path: `/Users/moey/.openclaw/workspace/friends-ai`
- Current phase: **concept architecture locked / prompt-pack prep**
- Working title is currently locked as `Friends AI`
- Core world geometry is now locked and written down:
  - `Central Peak`
  - apartment `2A` = Mon + Rachelle
  - apartment `2B` = Chance + Jojo
  - Russ as constant across-the-hall presence
  - hallway as active scene engine
- Supporting café anchor `Gunty` is locked
- Launch/test format is locked as a `4-minute pilot`
- Pilot title is locked as `Not a Couple`
- The project is no longer living only in chat; the source-of-truth docs now exist in project files

## What to do next for FRIENDS AI

1. Read in this order:
   - `friends-ai/MASTER_BIBLE.md`
   - `friends-ai/PILOT_SCRIPT_NOT_A_COUPLE_V2.md`
   - `friends-ai/PRODUCTION_BEAT_SHEET_NOT_A_COUPLE.md`
   - `friends-ai/CAST_BIBLE.md`
   - `friends-ai/VISUAL_STYLE_GUIDE.md`
   - `friends-ai/HANDOFF.md`
2. Do **not** re-brainstorm the concept from scratch if those docs are present
3. Build `PROMPT_PACK_V1.md` from the locked project docs
4. Derive prompts in this order:
   - characters
   - sets / locations
   - style / continuity rules
   - pilot shot prompts
5. Keep output premium, warm, cozy, and consistent; avoid cheap/cartoon/furry drift

## Important project truths to not lose

- RIZZ MAXX is a premium mobile app for dating profile optimization
- It is not a dating app and must not drift into chat/social/marketplace features
- The emotional loop is critical: judged -> empowered -> wants to improve -> wants deeper detail
- Results should be framed around profile effectiveness and first-impression strength, not fake scientific certainty
- The real path is proven live, but quality/calibration is still early and should not be overstated

## Background project notes

### MonkeyMoltbook
- focus moved away after the RIZZ MAXX switch
- if resumed, continue from `MonkeyMoltbook/HANDOFF.md` and `MonkeyMoltbook/STATUS.md`

### LooksMaxx
- submitted to Apple on 2026-03-23
- current App Store Connect state: **Waiting for Review**
- do not restart launch prep unless Apple review changes state

### UFC
- local cadence change remains:
  - `com.moey.ufc-operator-live-odds` every 12 hours
  - `com.moey.ufc-operator-live-odds-fast` disabled
- verify env and refresh pipeline before future work

## Hard preferences from John

- **No cron jobs unless explicitly requested**
- **No autonomous loops**
- avoid drift and category expansion

## When the chat freezes

Use this order:
1. Do not assume the project is gone
2. Check gateway health
3. Read continuity files
4. Prefer a fresh session if the old one was very long
5. Before major resets/restarts, update continuity files first
ct state: **Waiting for Review**
- do not restart launch prep unless Apple review changes state

### UFC
- local cadence change remains:
  - `com.moey.ufc-operator-live-odds` every 12 hours
  - `com.moey.ufc-operator-live-odds-fast` disabled
- verify env and refresh pipeline before future work

## Hard preferences from John

- **No cron jobs unless explicitly requested**
- **No autonomous loops**
- avoid drift and category expansion

## When the chat freezes

Use this order:
1. Do not assume the project is gone
2. Check gateway health
3. Read continuity files
4. Prefer a fresh session if the old one was very long
5. Before major resets/restarts, update continuity files first
 files
4. Prefer a fresh session if the old one was very long
5. Before major resets/restarts, update continuity files first
