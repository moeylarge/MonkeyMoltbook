# MonkeyMoltbook — HANDOFF

Updated: 2026-03-29 America/Los_Angeles

## Current phase

**MOLT-LIVE suspicious route reliability fixed; active work is now suspicious-source acquisition and candidate scoring on live Vercel**

## Objective

Build MonkeyMoltbook / MOLT-LIVE as a website-first Moltbook intelligence and trust surface where:
- search and community ranking are materially trustworthy
- suspicious users and groups are surfaced from real evidence, not thin semantics
- acquisition can deepen risky language lanes intentionally instead of only relying on a shallow recent-feed view

## What was completed in this session

### 1) Live suspicious-ingest route reliability was fully debugged and fixed
This was the biggest engineering win of the session.

What happened:
- production was briefly serving stale Vercel deployments until explicit `vercel deploy --prod` runs were made from the linked repo
- a live job-status endpoint was added:
  - `/api/moltbook/ingest/status`
- probe-internal progress writes were added to the suspicious ingest path
- production traces narrowed the route failure to a concrete code bug
- the actual bug was that `suspiciousMatchMeta` was referenced but missing from `apps/server/src/lib/moltbook-discovery.js`
- restoring that classifier fixed the suspicious route timeout/failure

Result:
- suspicious ingest now completes end-to-end on live Vercel
- deployment, status visibility, and runtime confidence are materially better than before

### 2) Suspicious family tuning was pushed until the real limit became clear
After reliability was restored, repeated controlled live passes were run for:
- claim
- wallet
- seed
- exploit

What was learned:
- broader exploit phrases increased captures but created obvious junk
- tightening exploit phrases removed that junk but often zeroed the lane again
- wallet/seed/exploit were sparse under strict intent rules
- claim kept surfacing mostly weak airdrop-adjacent discussion

Conclusion:
- phrase churn is no longer the primary bottleneck
- the bottleneck is now corpus quality / acquisition strategy

### 3) Targeted suspicious family lanes were built
New targeted suspicious family lanes exist on production:
- `mode=suspicious-targeted&family=wallet`
- `mode=suspicious-targeted&family=claim`
- `mode=suspicious-targeted&family=seed`
- `mode=suspicious-targeted&family=exploit`

Supporting fixes:
- family-specific ingestion jobs/cursors
- targeted status endpoint resolution repaired
- deeper targeted acquisition defaults increased to:
  - `perPage=100`
  - `steps=20`

### 4) Contextual gates were added and worked correctly
Additional gates now require stronger intent/context before a post counts as suspicious.

Examples:
- wallet/seed require stronger action context around private-key / seed-phrase language
- exploit filters out more informational security-discussion cases
- claim requires stronger airdrop/claim context than before

Result:
- weak wallet/seed/exploit false positives were removed
- the system now behaves more honestly
- but the remaining corpus is still thin on convincing malicious content

### 5) Deep targeted acquisition results
With the deeper family lanes, live production runs showed:
- wallet/seed/exploit can now be crawled much deeper through separate cursors/jobs
- but after contextual gating, they mostly return truthful zero
- claim still tends to surface airdrop-adjacent crypto discussion rather than obviously malicious scam content

Strong conclusion:
- targeted family acquisition works
- the generic recent-feed source still does not provide enough high-quality malicious evidence on its own

### 6) New candidate-first suspicious collector was added
Because strict family outputs stayed too sparse, a new broader acquisition stage was added.

New mode:
- `mode=suspicious-candidates`

What it does:
- walks the feed deeply using the working cursor source
- harvests **weak suspicious cues** rather than pretending they are final suspicious hits
- returns:
  - `candidateCount`
  - `cueCounts`
  - `candidatePreview`
- keeps the strict family scorer separate

This is the key new architecture shift from this session.

### 7) First candidate-run result
The first deep `suspicious-candidates` production run succeeded.

Important result:
- the broader candidate corpus is noisy overall, which is expected
- but it did surface at least one more promising wallet/CTA-style item than the strict family lanes were giving us:
  - `Free 1 USDT on BNB Chain - Zero Risk Demo`
  - weak cues: `wallet`, `connect wallet`

That is currently the most important evidence from the new acquisition stage.

## Current source-of-truth files

- `apps/server/src/app.js`
- `apps/server/src/lib/moltbook-discovery.js`
- `apps/server/src/lib/supabase-storage.js`

## Current best judgment

The central unresolved task is no longer route reliability.
That part was fixed.

The real next frontier is now:
- candidate-first suspicious-source acquisition
- then second-stage candidate scoring/ranking

The architecture is now:
- stage 1 = broad weak-signal candidate collection
- stage 2 = stricter candidate scoring / promotion
- final family lanes = high-confidence outputs only

## Highest-value next step

In the next chat, do this first:

1. verify local HEAD / origin / live Vercel alias are aligned
2. open:
   - `apps/server/src/app.js`
   - `apps/server/src/lib/moltbook-discovery.js`
3. confirm `mode=suspicious-candidates` exists and is live
4. build a **second-stage candidate scorer** that ranks candidate posts higher when weak cues co-occur with stronger abuse/CTA language such as:
   - free
   - claim
   - connect wallet
   - verify
   - eligible
   - zero risk
   - reward
   - enter seed phrase
   - restore wallet
5. down-rank obvious low-value contexts such as:
   - philosophy/general discussion
   - generic tax/airdrop discussion
   - benign security-research discussion
6. rerun the deep candidate collector and inspect the ranked shortlist
7. only after ranking improves, decide whether to promote any second-stage candidate logic back into final suspicious family outputs

## Guardrails

- Vercel handles both frontend and backend
- Railway is not in use
- do not revert to broad phrase sprawl
- preserve the strict family scorer and contextual gates
- use the candidate collector as the new acquisition surface
- truthful zero is still better than polluted suspicious outputs