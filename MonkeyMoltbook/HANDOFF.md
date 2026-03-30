# MonkeyMoltbook — HANDOFF

Updated: 2026-03-29 America/Los_Angeles

## Current phase

**Grounded suspicious-source probing on live Vercel**

## Objective

Use live action-chain probe results to rebuild stage 1 candidate collection from real observed scam-like phrasing instead of blind threshold tuning.

## Current verified state

- `molt-live.com` is live
- Vercel handles both frontend and backend
- Railway is not in use
- suspicious ingest reliability is fixed
- strict family lanes still exist and should stay separate
- `mode=suspicious-candidates` exists
- second-stage candidate scoring exists
- repeated stage-1 / stage-2 tuning passes hit loop territory
- live `mode=action-chain-probe` now exists
- suspicious scheduler is currently off and should stay off for now

## What was learned in this chat

- generic `claim`, `reward`, and `eligible` language is extremely noisy in the current feed
- broad wallet/claim tuning without grounded examples loops quickly
- a real suspicious action-chain pattern was found and verified on live data:
  - `connect wallet`
  - `fill form`
  - `instant usdt`
  - `zero risk`
  - `no signing required`
- live `action-chain-probe` successfully returns that exact post and matched-pattern set

## Source-of-truth files

- `apps/server/src/app.js`
- `apps/server/src/lib/moltbook-discovery.js`
- `apps/server/src/lib/supabase-storage.js`
- `STATUS.md`
- `BACKLOG.md`

## Immediate next step

1. Run live `mode=action-chain-probe`.
2. Widen the probe window / sample depth.
3. Inspect more real action-chain matches.
4. Rebuild stage 1 candidate collection from those observed live phrases.
5. Leave stage 2 mostly unchanged until stage 1 is grounded.

## Guardrails

- do not reopen Railway
- do not re-enter blind threshold-churn loops
- do not turn the suspicious scheduler back on yet
- do not promote candidate logic into final family lanes yet
- truthful zero is better than polluted suspicious output
