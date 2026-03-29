# MonkeyMoltbook — HANDOFF

Updated: 2026-03-29 America/Los_Angeles

## Current phase

**MOLT-LIVE live product refinement + backend-backed search/community expansion + rolling collector automation**

## Objective

Build MonkeyMoltbook as a **website-first** Moltbook intelligence and live AI discovery platform, with MOLT-LIVE as the real interaction layer.

Active product direction now includes:
- Moltbook public-data ingestion and ranking
- website-first discovery surfaces
- live session entry via chat / voice / webcam modes
- transcript persistence + export
- wallet / credits backend
- future Stripe billing, but not yet activated

## What was completed in this session

### Homepage / product surface
- homepage hierarchy was reworked toward:
  - stronger proof near the top
  - stronger live-session realism
  - credits/battle integration closer to user desire path
  - less equal-weight discovery clutter
- homepage hero stat `ranked agents in feed` was locked to `100`
- homepage still feels too clustered and needs another pass of subtraction tomorrow

### SEO / indexability
- homepage title / description / canonical / OG / Twitter basics were added
- `robots.txt` and `sitemap.xml` were added
- sitemap was submitted to Google Search Console and Bing Webmaster Tools
- route-level metadata was added for key routes
- crawlable intro text was added to ranking pages
- `What is Molt Live?` page was added and included in sitemap

### Automation / storage
- Vercel cron refresh was set up and verified:
  - 15 min fast refresh
  - 30 min fuller refresh
- Supabase was introduced as external storage
- `supabase/schema.sql` was created and applied incrementally
- external persistence is now live for:
  - authors
  - posts
  - submolts
  - ranking snapshots
  - topic clusters
  - raw author/post/submolt snapshots
- storage/debug endpoints exist and refresh persistence was verified in production

### Live session backbone
- live session implementation docs were created:
  - `LIVE_SESSION_ARCHITECTURE_SPEC.md`
  - `LIVE_SESSION_CREDITS_IMPLEMENTATION_PLAN.md`
- first real live session loop is now active:
  - create session
  - send typed message
  - store agent reply
  - fetch transcript
  - export transcript
- Supabase session tables were added and verified

### Credits / plans
- wallet / credits backend was added and verified
- spend actions are live in backend and connected to transcript/system events
- current spend model:
  - `chat_unlock` → 2
  - `priority_prompt` → 3
  - `queue_jump` → 5
  - `session_extend_5m` → 8
  - `premium_agent_unlock` → 12
  - `battle_unlock` → 15
- monthly plans were defined as:
  - Basic — 100 credits — $19/mo
  - Silver — 300 credits — $49/mo
  - Gold — 750 credits — $99/mo
- old placeholder credit products were hidden from the active flow
- Stripe checkout endpoint is scaffolded, but billing is intentionally off

### Live room UX direction
- chat mode was elevated to a first-class mode
- live room now supports mode selection:
  - Chat
  - Voice
  - Webcam
- chat mode got its own simplified layout
- voice/webcam keep the richer room layout
- credits are more deferred until the session is active
- labels were tightened for clarity
- still not final; the room needs one more user-judgment pass tomorrow

## Important files created / updated

- `MonkeyMoltbook/LIVE_SESSION_ARCHITECTURE_SPEC.md`
- `MonkeyMoltbook/SUPABASE_STORAGE_SPEC.md`
- `MonkeyMoltbook/LIVE_SESSION_CREDITS_IMPLEMENTATION_PLAN.md`
- `MonkeyMoltbook/TRUST_SCORE_V1_SPEC.md`
- `MonkeyMoltbook/supabase/schema.sql`
- `MonkeyMoltbook/apps/server/src/lib/trust-score.js`
- `MonkeyMoltbook/apps/server/src/lib/supabase-storage.js`
- `MonkeyMoltbook/apps/server/src/app.js`
- `MonkeyMoltbook/apps/web/src/App.jsx`
- `MonkeyMoltbook/apps/web/src/styles.css`
- `apps/server/src/lib/live-sessions.js`
- `apps/server/src/lib/credits.js`

## Key production/system truths

- live site: `https://molt-live.com`
- Vercel cron only for site/data automation
- explicitly do **not** use OpenClaw cron for this project
- Supabase project in use should be treated as temporary/trust-reduced because service role was exposed in chat; can be replaced later
- Stripe checkout remains off for now by explicit choice

## Next step for the next chat

Do this first:
1. apply the new trust tables in Supabase SQL (`entity_risk_scores`, `entity_risk_events`, `risky_domains`) because production storage does not have them yet
2. audit whether Vercel cron runs are actually growing data coverage
3. inspect backend/debug counts for authors, posts, communities, search documents
4. re-test Groups search and a few `/community/:slug` pages after collector runs
5. if growth is good, improve search ordering/relevance next
6. continue tuning trust heuristics from live corpus examples before stronger ranking/demotion is enabled
7. if growth is weak, investigate better/internal Moltbook data sources more aggressively
8. keep the future trust/safety layer in view as a major differentiator

## Strong current judgment

The biggest remaining issue is not backend anymore.

It is:
- homepage clustering
- too much information density
- some room-level UX still feeling half-real / half-system-demo
- copy needing simplification and demotion in the right places

Tomorrow should be a cleanup / judgment pass, not another architecture expansion pass.

## Useful commit trail from this session

Key later-session commits include:
- `a225da8` — Polish MOLT-LIVE homepage hierarchy and live flow
- `8611064` — Add MOLT-LIVE basic SEO and sitemap
- `11538fa` — Add route-level SEO metadata for MOLT-LIVE
- `81d7299` — Make Moltbook external links prominent on agent cards
- `dba4b86` — Add crawlable intro text to Molt ranking pages
- `fffd643` — Add indexable What Is Molt Live page
- `4ac3504` — Add What Is Molt Live page to sitemap
- `4a4dafa` — Polish desktop trust realism and conversion flow
- `6ea545c` — Set up automated Vercel refresh cadence for MOLT-LIVE
- `f0e5f36` — Add Supabase schema and storage scaffold for MOLT-LIVE
- `aad847c` — Persist Molt posts and submolts to Supabase
- `3e01068` — Build first real live session backend and UI flow
- `9d1b1f2` — Polish real live session room UI
- `d4d1846` — Add wallet and credits backend endpoints
- `215bc61` — Connect wallet and spend actions to live room UI
- `89bbf6a` — Add chat mode as first-class live credits option
- `f4edb67` — Hide old credit products and show monthly plans only
- `db67356` — Simplify chat mode live room layout
- `64d883f` — Lock homepage feed stat and tighten live room labels
- `5c28705` — Clarify live mode messaging and defer credits until active

## Guardrails

- do not activate Stripe tomorrow unless John explicitly decides to
- do not re-open storage/cron work unless broken
- do not add more major feature surfaces before the cleanup list exists
- preserve the current working backbone and simplify the UX from here
 preserve the current working backbone and simplify the UX from here
