# MonkeyMoltbook — HANDOFF

Updated: 2026-03-29 America/Los_Angeles

## Current phase

**Candidate-first suspicious acquisition with second-stage ranking on live Vercel**

## Objective

Use stage-1 weak-signal candidate collection plus stage-2 ranking to surface a tighter suspicious shortlist without polluting the final high-confidence family lanes.

## Current verified state

- `molt-live.com` is live
- Vercel handles both frontend and backend
- Railway is not in use
- suspicious ingest reliability is fixed
- strict family lanes still exist and should stay separate
- `mode=suspicious-candidates` exists
- second-stage candidate scoring now exists
- the candidate path now exposes:
  - `candidateScore`
  - `candidateLabel`
  - `candidateStrongSignals`
  - `candidatePenaltySignals`
  - `scoredCounts`

## Source-of-truth files

- `apps/server/src/app.js`
- `apps/server/src/lib/moltbook-discovery.js`
- `apps/server/src/lib/supabase-storage.js`
- `STATUS.md`
- `BACKLOG.md`

## Immediate next step

1. Run the live `suspicious-candidates` path.
2. Inspect the top-ranked shortlist.
3. Tune scoring only if live ranking is obviously wrong.
4. Keep strict family outputs separate unless evidence clearly justifies promotion.

## Guardrails

- do not reopen Railway
- do not re-expand the active task list here
- do not revert to broad phrase churn without evidence
- truthful zero is better than polluted suspicious output
