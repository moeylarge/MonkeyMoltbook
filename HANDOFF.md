If the session gets lost, the UI freezes, or the daemon goes weird, use this file first.

Updated: 2026-03-29 America/Los_Angeles

## Immediate recovery checklist

1. Open the active workspace:
   - `/Users/moey/.openclaw/workspace`
2. Read these root files in order:
   - `PROJECTS.md`
   - `NOW.md`
   - `HANDOFF.md`
3. Open the active project's handoff first:
   - `MonkeyMoltbook/HANDOFF.md`
4. Then open supporting project docs as needed:
   - `MonkeyMoltbook/apps/server/src/app.js`
   - `MonkeyMoltbook/apps/server/src/lib/supabase-storage.js`
   - `MonkeyMoltbook/apps/server/src/lib/trust-score.js`
   - `MonkeyMoltbook/apps/server/src/lib/moltbook-discovery.js`
5. Live site:
   - `https://molt-live.com`

## Current truth

- Primary active project: **MonkeyMoltbook / MOLT-LIVE**
- Project path: `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- Deployment target is **Vercel for both frontend and backend**
- Railway is legacy noise and should be ignored unless John explicitly asks to clean it up
- Current phase: **trust/search repair + suspicious ingestion/debug on live Vercel**
- Supabase external storage is active for Moltbook-derived data
- Core trust/search architecture is materially improved across users, groups, persistence, and audit lanes

## What happened last

A long production trust/search session completed on MOLT-LIVE.

### User-side suspicious search
- suspicious user/account search was rebuilt to merge stored author rows with post-backed evidence instead of thin profile text
- user intent handling was tuned for:
  - `wallet`
  - `seed phrase`
  - `drainer`
  - `malware`
  - `exploit`
  - `claim`
  - `airdrop`
- final live user trust state materially improved, with strongest justified suspicious lane in `airdrop`

### Persistence and audit fixes
- evidence-backed suspicious-author persistence was fixed end-to-end:
  - query-time suspicious author writes are awaited
  - evidence authors are resolved to real stored `authors.id` via `source_author_id`
  - audit hydration now maps persisted rows back to real stored author names
- dedicated audit lanes now exist:
  - `/api/moltbook/audit/suspicious-authors`
  - `/api/moltbook/audit/mint-authors`
- critical rule is now explicit:
  - mint/ticker spam and evidence-backed suspicious authors are separate lanes and must stay separated

### Group-ranking repair pass
The four priority group trust/search lanes were repaired in order:
1. `mint`
2. `claim`
3. `wallet`
4. `exploit`

Current outcome:
- `mint` family is now clean and specialized:
  - `mint` → `mbc20`
  - `hackai` → `mbc20`
  - `mbc20` → `mbc20`
  - `mbc-20` → `mbc-20`, then `mbc20`
  - `bot` → `mbc20`
  - `wang` → `mbc20`
- `claim` family is now strict and no longer polluted by broad semantic junk
- `wallet` family is now strict and truthfully returns zero on groups given current corpus depth
- `exploit` family is now strict and truthfully returns zero on groups given current corpus depth

### Data-depth finding
- deeper generic ingest helped `claim` materially
- but `wallet` / `exploit` / `drainer` / `seed phrase` remain data-starved at the group level
- the blocker is no longer ranking pollution there; it is targeted evidence scarcity

### Suspicious ingestion debugging on Vercel
This is the current active frontier and the most important unresolved item.

What is now proven:
- Vercel is the correct deployment target for frontend and backend
- normal backend health routes work on Vercel
- raw one-page Moltbook fetch works on Vercel via dedicated probe route:
  - `/api/moltbook/probe/fetch`
- suspicious ingest route starts and writes provisional job progress to Supabase
- suspicious ingest route still hangs before `sample_fetched`
- `delayMs=0` is now honored in the suspicious ingest path
- the failure boundary was narrowed to the suspicious sample-fetch/probe area

Key architectural move made:
- suspicious ingest was refactored away from the old crawler-like path toward a **probe-driven path**
- dedicated one-page probe logic exists in source
- however, this probe-driven suspicious ingest path is still not yet proven end-to-end complete on live Vercel

## Exact current blocker

The main unresolved issue is:
- suspicious ingest on live Vercel still times out before completing
- it writes `phase = before_sample_fetch`
- but does not reach `sample_fetched`

Important nuance:
- the dedicated fetch probe route succeeds quickly on Vercel
- so the remaining bug is no longer “can Vercel fetch Moltbook?”
- it is specifically about the suspicious ingest execution path and probe integration inside that route

## Latest verified source-of-truth files

- `MonkeyMoltbook/apps/server/src/app.js`
- `MonkeyMoltbook/apps/server/src/lib/supabase-storage.js`
- `MonkeyMoltbook/apps/server/src/lib/trust-score.js`
- `MonkeyMoltbook/apps/server/src/lib/moltbook-discovery.js`

## What to do first in the next chat

Resume exactly here:

1. verify local HEAD / origin / live Vercel alias are aligned before testing anything
2. continue debugging the suspicious-ingest execution path
3. highest-value next technical move:
   - instrument **inside the shared suspicious probe path itself** or otherwise surface probe-internal progress directly to the job row
   - prove whether suspicious ingest actually returns from the shared probe function
4. do not reopen broader ranking work first; that part is mostly in a better state already
5. preserve the current strict trust-search behavior for:
   - `mint`
   - `claim`
   - `wallet`
   - `exploit`
6. keep the product roadmap order explicit from here:
   1. final reliability of suspicious targeted ingestion on Vercel
   2. strengthen shallow suspicious evidence outside airdrop/promo lanes
   3. then build the explicit trust product surface on `molt-live.com`

## Guardrails

- Vercel handles both frontend and backend
- Railway is not in use
- do not treat Railway errors as live blockers
- do not relax the strict cleaned ranking lanes just to force non-zero results
- truthful zero is better than polluted junk results
- do not switch suspicious ingest back to a broad crawler model until the probe-driven path is stable
