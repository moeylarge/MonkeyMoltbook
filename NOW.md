Updated: 2026-03-29 America/Los_Angeles

## Current active focus

**MONKEYMOLTBOOK / MOLT-LIVE**

## Resume point

Active focus is no longer suspicious-ingest route reliability.
That part was debugged and fixed on live Vercel in this session.

Resume from the new state:
- suspicious ingest works on production
- targeted suspicious family lanes work on production
- deep targeted acquisition works on production
- strict contextual gates work on production
- the new active frontier is **candidate-first suspicious-source acquisition + second-stage scoring**

## Current truth

- project path: `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- live site: `https://molt-live.com`
- deployment target: **Vercel for both frontend and backend**
- Railway is not part of the active deployment path
- Supabase storage and ingestion job state are active
- debug/status endpoint exists for ingestion jobs:
  - `/api/moltbook/ingest/status`
- suspicious ingest is no longer hanging on live Vercel
- the missing `suspiciousMatchMeta` bug was fixed
- targeted family lanes now exist for:
  - wallet
  - claim
  - seed
  - exploit
- deep targeted acquisition defaults are now:
  - `perPage=100`
  - `steps=20`
- contextual gates removed most weak wallet/seed/exploit false positives
- claim still surfaces weak airdrop-adjacent discussion more than true scam/abuse intent
- new weak-signal candidate collector exists:
  - `mode=suspicious-candidates`

## Immediate next actions

1. keep the current strict family scorer and contextual gates as-is
2. keep the new candidate collector as the primary acquisition surface
3. build a **second-stage candidate scorer** over the weak-signal corpus
4. promote candidates when weak cues co-occur with stronger abuse/CTA language, for example:
   - free
   - claim
   - connect wallet
   - verify
   - eligible
   - zero risk
   - reward
   - enter seed phrase
   - restore wallet
5. down-rank low-value contexts such as:
   - philosophy/general discussion
   - generic tax/airdrop discussion
   - benign security-research discussion
6. rerun the deep candidate collector and inspect the ranked shortlist

## Guardrails

- keep Vercel as the deployment target
- do not let Railway distract the path
- do not reopen broad phrase-churn without evidence
- preserve the strict family scorer as the final gate
- use candidate collection as stage 1, candidate scoring as stage 2
- truthful zero remains acceptable if the corpus does not justify more