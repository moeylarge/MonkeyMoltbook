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
   - `rizz-maxx/PRD.md`
   - `rizz-maxx/DESIGN_SYSTEM.md`
4. If OpenClaw itself seems unhealthy, check service status:
   - `openclaw gateway status`
   - if needed: `openclaw gateway start`
   - then: `openclaw status`
5. Local dashboard URL:
   - `http://127.0.0.1:18789/`

## Current truth

- Primary active project: **RIZZ MAXX**
- Project path: `/Users/moey/.openclaw/workspace/rizz-maxx`
- Product category is locked: AI dating profile optimizer, not a dating app
- Execution order is locked:
  - PLAN -> DESIGN -> BUILD -> RUN -> VERIFY -> PROVE
- Current completed phase: **Phase 1 — Product Definition**
- Required execution docs now exist
- No implementation scaffold exists yet
- Immediate mode is **Phase 2 — Design Definition**, not feature coding drift

## What to do next for RIZZ MAXX

1. Read:
   - `rizz-maxx/STATUS.md`
   - `rizz-maxx/SCREENS_AND_FLOWS.md`
   - `rizz-maxx/DESIGN_SYSTEM.md`
2. Begin Phase 2 only
3. Convert design system into concrete screen layouts/component structure
4. Lock the results-screen hierarchy and premium-gate presentation
5. Then scaffold the app shell in Phase 3

## Important project truths to not lose

- RIZZ MAXX is a premium mobile app for dating profile optimization
- It is not a dating app and must not drift into chat/social/marketplace features
- The emotional loop is critical: judged -> empowered -> wants to improve -> wants deeper detail
- Results should be framed around profile effectiveness and first-impression strength, not fake scientific certainty
- The product must feel premium, modern, emotionally engaging, and App Store-ready

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
