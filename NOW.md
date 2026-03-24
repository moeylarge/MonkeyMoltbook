# NOW.md

Updated: 2026-03-23 America/Los_Angeles

## Current active focus

**RIZZ MAXX**

## Resume point

RIZZ MAXX is now the current primary project.

Execution mode is locked to John’s master build directive:
- PLAN -> DESIGN -> BUILD -> RUN -> VERIFY -> PROVE
- no category drift
- no social/chat/marketplace features
- no speculative re-architecture
- no retry loops past 3 failed fix attempts

## Current truth

- project path: `/Users/moey/.openclaw/workspace/rizz-maxx`
- current completed phase: **Phase 5 — Real Analysis Integration**
- required execution docs exist
- implementation scaffold exists at `rizz-maxx/app`
- local adapter server exists at `rizz-maxx/server`
- the app now supports:
  - sample/set loading
  - remove/reorder controls
  - minimum-photo analysis gating
  - loading state
  - results rendering
- real analysis integration now exists via:
  - app client: `rizz-maxx/app/src/analysisApi.ts`
  - adapter service: `http://127.0.0.1:8091`
  - upstream backend: `http://127.0.0.1:8089/analyze`
- the app preserves an explicit fallback boundary:
  - `REAL LOCAL ANALYSIS` when the adapter path succeeds
  - `MOCKED LOCAL ANALYSIS` when it fails
- real-path proof succeeded in the app web flow
- native simulator/device runtime proof remains unverified on this machine because simulator tooling is unavailable
- product category is locked: AI dating profile optimizer mobile app
- MVP explicitly excludes swiping, chat, messaging, social graph, marketplace, and broad coaching features

## Current next steps

1. Continue improving real ranking and feedback quality
2. Add more backend failure-case coverage and recovery behavior
3. Preserve explicit mock fallback until the real path is robust
4. Keep persistence and premium billing untouched
5. Do not claim calibrated backend quality before proof

## Secondary project state

- **MonkeyMoltbook:** moved to background after focus switch; resume only if explicitly requested
- **LooksMaxx:** submitted to Apple; current state is **Waiting for Review**; do not reopen unless review changes
- **UFC:** paused; verify app/env/refresh pipeline before doing more work
- **Social Clip OS:** background; continuity still thinner than primary projects

## Guardrails

- Do **not** create cron jobs or loops unless John explicitly asks
- Do **not** switch project category or broaden scope
- Do **not** code beyond phase order
- Update continuity files before major project switches or resets
