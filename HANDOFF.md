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
   - `MonkeyMoltbook/apps/server/src/lib/moltbook-discovery.js`
   - `MonkeyMoltbook/apps/server/src/lib/supabase-storage.js`
5. Live site:
   - `https://molt-live.com`

## Current truth

- Primary active project in this session: **MonkeyMoltbook / MOLT-LIVE**
- Project path: `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- Deployment target is **Vercel for both frontend and backend**
- Railway is legacy noise and should be ignored unless John explicitly asks
- Supabase storage is active for Moltbook-derived data and ingestion job state
- The old blocker "suspicious ingest hangs before sample fetch completes" was fully debugged and resolved in this session

## What happened last

This session was a long live-Vercel debugging + ingestion-quality pass focused on the suspicious collection pipeline.

### 1) Core suspicious-ingest reliability was fixed on live Vercel
What was proven and repaired:
- production had briefly been serving older Vercel deployments until explicit `vercel deploy --prod` runs were made from the linked repo
- live debug/status inspection was added for ingestion jobs:
  - `/api/moltbook/ingest/status`
- probe-internal phase tracing was added to the suspicious ingest path
- the real route failure was narrowed from timeout symptoms to a concrete code bug
- the actual bug was:
  - `suspiciousMatchMeta` was referenced but missing from `apps/server/src/lib/moltbook-discovery.js`
- restoring that classifier fixed the end-to-end suspicious route timeout/failure

Result:
- suspicious ingest now completes successfully on production
- Vercel deployment + route + live status visibility are all confirmed healthy

### 2) Classifier tuning hit its limit
After reliability was restored, multiple controlled live passes were run to tune suspicious-family matching.

What was learned:
- broad exploit phrases increased captures but created obvious false positives
- tightening exploit phrases removed noise but often zeroed the lane again
- wallet/seed/exploit lanes were extremely sparse under strict intent rules
- claim lane kept surfacing mostly weak airdrop-adjacent discussion

Conclusion:
- phrase tuning alone is not the bottleneck anymore
- the real bottleneck became **corpus quality / acquisition strategy**

### 3) Targeted suspicious family lanes were built and validated
New targeted family-scoped suspicious lanes now exist:
- `suspicious-targeted&family=wallet`
- `suspicious-targeted&family=claim`
- `suspicious-targeted&family=seed`
- `suspicious-targeted&family=exploit`

What was added/fixed:
- separate family-specific ingestion jobs/cursors
- status endpoint fixed to resolve targeted family jobs correctly
- deeper targeted acquisition defaults increased to:
  - `perPage=100`
  - `steps=20`

Result from deep family sweeps:
- targeted acquisition works
- but after stronger contextual gating:
  - wallet → zero convincing survivors
  - seed → zero convincing survivors
  - exploit → zero convincing survivors
  - claim → still only weak airdrop-adjacent survivors

Conclusion:
- the family-scoped architecture works
- the upstream recent-feed corpus still lacks convincing malicious wallet/seed/exploit evidence at this depth

### 4) Contextual gates were added and did the right thing
Stronger second-stage intent/context filters were added:
- wallet/seed now require stronger action context around private-key / seed-phrase language
- exploit now excludes more informational security-discussion cases
- claim requires stronger airdrop/claim context than before

Result:
- weak wallet/seed/exploit false positives were removed
- remaining surviving claim content is still low quality / discussion-adjacent
- the system is now behaving honestly rather than manufacturing suspicious hits

### 5) New suspicious candidate collector was added
Because strict family lanes were too sparse, a new candidate-first collector was built.

New mode:
- `mode=suspicious-candidates`

What it does:
- performs a deep feed-backed cursor walk
- collects **weak suspicious cues** into a broader candidate corpus instead of pretending they are final suspicious hits
- returns:
  - `candidateCount`
  - `cueCounts`
  - `candidatePreview`
- keeps the strict family scorer separate

This is the key new architectural shift from this session.

### 6) First candidate-run result
The first deep `suspicious-candidates` run succeeded on production and surfaced a broader weak-signal corpus.

Important finding:
- candidate preview is still noisy overall, but it surfaced at least one more promising wallet/CTA-style item than the strict family lanes were giving us:
  - `Free 1 USDT on BNB Chain - Zero Risk Demo`
  - weak cues: `wallet`, `connect wallet`

That means the project is now at the correct next stage:
- broad candidate harvest first
- then second-stage candidate scoring/ranking

## Exact current blocker / next frontier

The next unresolved engineering/product task is no longer route reliability.

The real next frontier is:
- build a **second-stage scorer** over the weak-signal suspicious candidate corpus
- promote only the highest-intent scam/abuse-like candidates
- down-rank philosophical, generic crypto, tax, and informational security discussion

## What to do first in the next chat

Resume exactly here:

1. verify local HEAD / origin / live Vercel alias are aligned
2. open these files first:
   - `MonkeyMoltbook/HANDOFF.md`
   - `MonkeyMoltbook/STATUS.md`
   - `MonkeyMoltbook/apps/server/src/lib/moltbook-discovery.js`
   - `MonkeyMoltbook/apps/server/src/app.js`
3. confirm the new candidate mode exists:
   - `mode=suspicious-candidates`
4. highest-value next implementation move:
   - add a **second-stage candidate scorer** for weak-signal suspicious candidates
5. score candidates upward when cues co-occur with stronger abuse/CTA language like:
   - `free`
   - `claim`
   - `connect wallet`
   - `verify`
   - `eligible`
   - `zero risk`
   - `reward`
   - `enter seed phrase`
   - `restore wallet`
6. down-rank obvious low-value contexts like:
   - philosophy/self-help discussion
   - generic tax/airdrop discussion
   - benign security-research discussion
7. rerun the deep candidate collector after scoring is added, then inspect the ranked shortlist

## Guardrails

- Vercel handles both frontend and backend
- Railway is not in use and should not be treated as a blocker
- do not go back to broad phrase-churn without evidence
- keep the strict family scorer intact
- treat the candidate collector as stage 1 and the new scorer as stage 2
- truthful zero is still better than polluted junk