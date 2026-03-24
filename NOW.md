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
- current state: **free-first launch candidate with strong core loop, persistence/history, compare flow, and premium prototype gate**
- implementation scaffold exists at `rizz-maxx/app`
- local adapter server exists at `rizz-maxx/server`
- real analysis integration exists via:
  - app client: `rizz-maxx/app/src/analysisApi.ts`
  - adapter service: `http://127.0.0.1:8091`
  - upstream backend: `http://127.0.0.1:8089/analyze`
- the app preserves an explicit fallback boundary:
  - `REAL LOCAL ANALYSIS` when the adapter path succeeds
  - `MOCKED LOCAL ANALYSIS` when it fails
- launch-critical polish pass is complete enough in the current environment
- screenshot deliverables exist in `rizz-maxx/screenshots/`
- native iOS simulator launch is proven
- native smoke test is complete enough for launch confidence:
  - onboarding passed
  - upload passed
  - analysis passed
  - results passed
  - saved reopen passed
  - compare passed
  - premium screen/unlock state worked; real purchase action is intentionally unimplemented
- real billing / purchase flow integration remains intentionally deferred because launch strategy is free-first for the first few weeks
- product category is locked: AI dating profile optimizer mobile app
- MVP explicitly excludes swiping, chat, messaging, social graph, marketplace, and broad coaching features

## Current next steps

1. deeper ranking/feedback calibration from real-world testing data
2. physical-device native proof/QA on an actual iPhone
3. final launch asset refinement if needed
4. keep explicit mock fallback until the real path is robust
5. do not claim calibrated backend quality before proof

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
