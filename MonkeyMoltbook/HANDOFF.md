# MonkeyMoltbook — HANDOFF

Updated: 2026-03-29 America/Los_Angeles

## Current phase

**MOLT-LIVE trust/search repair completed across core lanes; active work is now targeted suspicious-ingest reliability on live Vercel**

## Objective

Build MonkeyMoltbook / MOLT-LIVE as a website-first Moltbook intelligence and trust surface where:
- search and community ranking are materially trustworthy
- suspicious users and groups are surfaced from real evidence, not thin semantics
- ingestion can intentionally deepen risky language lanes instead of only relying on shallow generic feed sampling

## What was completed in this session

### 1) Suspicious user/account search overhaul
- rebuilt suspicious user search to merge stored author rows with post-backed author evidence
- tuned user/account risk behavior for:
  - `wallet`
  - `seed phrase`
  - `drainer`
  - `malware`
  - `exploit`
  - `claim`
  - `airdrop`
- repeated live tuning reduced false positives and made `airdrop` the clearest suspicious-user lane

### 2) Suspicious author persistence + audit architecture
- fixed awaited persistence for suspicious query-time author writes
- fixed evidence-author mapping from `source_author_id` to real stored `authors.id`
- fixed suspicious-author audit hydration so names resolve cleanly
- added separate audit lanes:
  - `/api/moltbook/audit/suspicious-authors`
  - `/api/moltbook/audit/mint-authors`
- explicit architecture rule is now locked:
  - mint/ticker abuse and evidence-backed suspicious users must remain separate lanes

### 3) Group-ranking repair pass completed in order
#### Mint
- cleaned and specialized
- current live behavior:
  - `mint` → `mbc20`
  - `hackai` → `mbc20`
  - `mbc20` → `mbc20`
  - `mbc-20` → `mbc-20`, then `mbc20`
  - `bot` → `mbc20`
  - `wang` → `mbc20`

#### Claim
- cleaned and specialized
- broad semantic leakage removed
- current live state is much stricter and no longer contaminated by irrelevant communities

#### Wallet
- cleaned to strict truthful zero at group level for now
- broad crypto/finance leakage removed
- current result is zero because the group corpus still lacks specialized wallet-risk community evidence

#### Exploit
- cleaned to strict truthful zero at group level for now
- broad semantic/security-discussion leakage removed
- current result is zero because the group corpus still lacks specialized exploit/drainer-style community evidence

### 4) Data-depth findings
- deeper generic ingest helped `claim` materially
- but wallet/exploit/drainer/seed-phrase group evidence remains thin even after deeper generic ingest
- conclusion: we need targeted suspicious-language ingestion, not just more generic cursor depth

### 5) Suspicious-language ingestion work
A lot of time was spent here, and this is the current live frontier.

#### What is proven
- Vercel is the correct and active deployment target for both frontend and backend
- Railway is not in the live path and should be ignored unless explicitly asked about
- normal backend routes work on Vercel
- dedicated one-shot Moltbook fetch probe route works on Vercel:
  - `/api/moltbook/probe/fetch`
- the fetch probe proves:
  - raw outbound Moltbook fetch is healthy on Vercel
  - one-page fetch returns quickly and successfully

#### What is not yet proven
- suspicious ingest still does not complete reliably end-to-end on Vercel
- it writes provisional job progress, but still stalls before finishing

#### What has already been narrowed
- handler starts
- provisional `ingestion_jobs` row is written
- `delayMs=0` is honored in current suspicious route tests
- suspicious route reaches `phase = before_sample_fetch`
- but it does not reach `sample_fetched`

#### Architectural work already done in source
- suspicious ingest was refactored away from the older crawler-like idea toward a probe-driven path
- dedicated shared probe logic exists in `moltbook-discovery.js`
- route + probe integration has been partially instrumented for phase tracking

#### Key current blocker
Even with the shared probe approach, the suspicious ingest route still has not been proven to return from the shared probe path and complete successfully on live Vercel.

The next debugging step should stay focused on this exact question:
- does suspicious ingest actually return from the shared probe function on live Vercel?

## Important source-of-truth files

- `apps/server/src/app.js`
- `apps/server/src/lib/supabase-storage.js`
- `apps/server/src/lib/trust-score.js`
- `apps/server/src/lib/moltbook-discovery.js`

## Highest-value next step

In the next chat, do this first:

1. confirm local HEAD, `origin/main`, and the live Vercel alias are all aligned before testing
2. continue the suspicious-ingest reliability/debug path
3. do not reopen broad ranking work first
4. highest-value next technical action:
   - add or verify probe-internal progress writes from inside the shared suspicious probe path itself
   - prove whether suspicious ingest returns from that path or stalls inside it
5. once suspicious ingest completes reliably, use it to deepen evidence for:
   - wallet
   - exploit
   - drainer
   - seed phrase
   - claim-style language
6. after ingestion reliability and evidence depth improve, move to the explicit trust product surface on `molt-live.com`

## Strong current judgment

The project made major real progress.

What is genuinely better now:
- suspicious-user architecture
- suspicious persistence and audit separation
- trust-search quality for mint/claim/wallet/exploit group lanes
- Vercel-backed backend confidence
- proof that direct Moltbook fetch works on Vercel

What is still the central unresolved engineering issue:
- making targeted suspicious ingestion complete reliably and predictably on live Vercel

## Guardrails

- Vercel handles both frontend and backend
- Railway is legacy/non-blocking
- do not reintroduce semantic junk into cleaned trust-search lanes just to avoid zero results
- truthful zero is better than polluted false confidence
- keep mint abuse and evidence-backed suspicious users as separate review lanes
