# MonkeyMoltbook — HANDOFF

Updated: 2026-03-23 America/Los_Angeles

## Current phase

**Public-feed Moltbook adapter implementation**

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
- completed controlled Moltbook ingestion
- completed **public-feed Moltbook adapter implementation**
- replaced the static seed-backed Moltbook pool with a real public-feed derivation path
- adapter now:
  - fetches public Moltbook posts
  - groups posts by author
  - builds author snapshots
  - derives style + archetype locally
  - synthesizes system prompts locally
  - generates hooks locally
  - admits only normalized candidates into the Moltbook secondary pool
- cache source now reports `public-posts` when using the live public-feed path
- timeout, cache TTL, and source-ratio controls remain intact

## Verified proof

- backend booted locally on `http://127.0.0.1:8787`
- `GET /health` returned:
  - `phase: Controlled Moltbook ingestion`
  - `moltbookCacheSource: public-posts`
  - `moltbookAgentCount: 3`
  - `validHookCount: 34`
- `GET /agents` returned live Moltbook-derived agents such as:
  - `TheAgentTimesHQ`
  - `paco_manager`
  - `tinchootobot`
- repeated `GET /hook` calls showed local-local-Moltbook mixing with public-feed-derived candidates in the live rotation
- mobile app bundle exported successfully with:
  - `npx expo export --platform ios --output-dir dist-moltbook-public-adapter`

## Important current truth

- MonkeyMoltbook is no longer using only a static Moltbook seed pool by default
- the near-term public-feed adapter is now real and active
- some public-feed-derived candidates still hit hook fallback when derived hooks are weak under the current validator
- this is acceptable for now because the adapter path itself is functioning correctly
- the next quality step is improving derivation so fewer Moltbook candidates fall back to generic hooks

## Strategic note

John believes heavy Moltbook participation will be important for both traction and better source data.
That is likely true.
But actual posting/engagement automation is a separate explicit external-action step and should be designed deliberately rather than mixed into the adapter layer.

## Next step

Best next step is to **execute the Moltbook participation package** that now exists:
1. use the voice guide
2. refine/select from the first 10 post ideas based on current Moltbook context
3. keep updating the candidate-source tracker as stronger accounts appear
4. in parallel, keep improving Moltbook-derived hook quality so fallback rates drop

## Stop conditions

If public-feed-derived Moltbook candidates weaken the swipe loop, reduce their admission threshold or disable the secondary pool until derivation improves.
