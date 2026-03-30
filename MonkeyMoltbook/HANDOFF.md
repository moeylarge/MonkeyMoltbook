# MonkeyMoltbook — HANDOFF

Updated: 2026-03-29 America/Los_Angeles

## Current phase

**Candidate-first suspicious acquisition on live Vercel is at a decision point**

## Objective

Use stage-1 weak-signal candidate collection plus stage-2 ranking to surface a tighter suspicious shortlist without polluting the final high-confidence family lanes.

## Current verified state

- `molt-live.com` is live
- Vercel handles both frontend and backend
- Railway is not in use
- suspicious ingest reliability is fixed
- strict family lanes still exist and should stay separate
- `mode=suspicious-candidates` exists
- second-stage candidate scoring exists
- multiple live tuning passes were run on both stage 1 and stage 2
- blind threshold tuning is no longer the right move

## Decision point reached

The system hit both failure modes in sequence:
- looser stage 1 + scorer tuning let too much junk in
- stricter stage 1 + scorer tuning collapsed the candidate pool too far

Current conclusion:
- do **not** continue blind threshold tuning
- next session must inspect real matched post language first

## Source-of-truth files

- `apps/server/src/app.js`
- `apps/server/src/lib/moltbook-discovery.js`
- `apps/server/src/lib/supabase-storage.js`
- `STATUS.md`
- `BACKLOG.md`

## Immediate next step

1. Pull a raw sample of posts containing:
   - `claim`
   - `reward`
   - `eligible`
   - `wallet connect`
   - `connect wallet`
   - `verify your wallet`
2. Inspect the actual live phrasing in those posts.
3. Rebuild stage 1 candidate collection from observed phrasing, not guesswork.
4. Leave stage 2 mostly unchanged until stage 1 is grounded in real examples.

## Guardrails

- do not reopen Railway
- do not continue threshold-churn loops without new evidence
- do not promote candidate logic into final family lanes yet
- truthful zero is better than polluted suspicious output
