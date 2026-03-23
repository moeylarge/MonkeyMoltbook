# MonkeyMoltbook — HANDOFF

Updated: 2026-03-23 America/Los_Angeles

## Current phase

**Controlled Moltbook ingestion**

## Objective

Build a high-retention mobile app where users swipe through AI agents and get an immediate emotional reaction from the first message.

## What was done

- completed Phase 1 scaffold
- completed Phase 2 chat wiring
- completed Phase 3 local agent system
- completed Phase 4 swipe flow
- completed Phase 5 preload queue
- completed Phase 6 hook validation
- completed Phase 7 session-limit shell
- completed response quality system
- completed **controlled Moltbook ingestion**
- added Moltbook normalization layer with required fields:
  - `id`
  - `name`
  - `archetype`
  - `system_prompt`
  - `style`
  - `source`
  - `hooks`
- added hard constraints for the Moltbook path:
  - timeout: 500ms
  - cache TTL: 5 minutes
  - max active Moltbook agents: 3
  - source pattern: `local:local:moltbook`
- added safe fallback behavior:
  - if remote Moltbook fetch is absent, use local seed agents
  - if remote fetch errors, disable Moltbook and fall back to local-only behavior
- added Moltbook stats to `/health`
- kept local as the primary pool and Moltbook as secondary
- fixed a mixed old/new `agents.js` break during proof and re-ran verification cleanly

## Verified proof

- backend booted locally on `http://127.0.0.1:8787`
- `GET /health` returned:
  - `ok: true`
  - `phase: Controlled Moltbook ingestion`
  - `localAgentCount: 12`
  - `moltbookAgentCount: 3`
  - `sourcePattern: local:local:moltbook`
  - `moltbookEnabled: true`
  - `moltbookCacheSource: seed`
- `GET /agents` returned 15 total normalized agents, including 3 Moltbook agents
- repeated `GET /hook` calls showed local-local-Moltbook mixing in the live output
- mobile app bundle exported successfully with:
  - `npx expo export --platform ios --output-dir dist-moltbook-ingestion`
- exported bundle proved the app still compiles after Moltbook integration

## Important current truth

- Moltbook ingestion is working in controlled form
- current proof uses a seed-backed Moltbook source unless `MOLTBOOK_URL` is provided
- local remains primary, as intended
- two Moltbook seed hooks currently fall below the clean-pass threshold under the current validator
- Moltbook responses currently fall back to the local response bank when a remote-specific bank does not exist yet
- this is acceptable for now because hook/source integration was the primary goal of this phase

## Locked constraints currently being honored

- local remains primary
- Moltbook remains secondary
- timeout/caching/source-ratio controls are enforced
- no voice / TTS / memory persistence / social features
- no extra screens
- no real billing yet

## Next step

Best next step is a **Moltbook adapter implementation pass**:
- use public `/posts` author metadata as the first real source
- build author snapshot extraction
- derive archetype/style/hook candidates locally
- admit only strong candidates into the Moltbook secondary pool
- keep authenticated/profile-based ingestion as the later upgrade path if Moltbook API access is available

## Stop conditions

If real Moltbook data harms latency, quality, or stable fallback behavior, disable it immediately and keep local-only primary.
