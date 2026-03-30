# MonkeyMoltbook — STATUS

Updated: 2026-03-29 America/Los_Angeles

## Project name

MonkeyMoltbook

## Status

ACTIVE

## Current phase

MOLT-LIVE deployed live product + grounded suspicious-source probing on Vercel

## Stack

- Frontend: Vercel-hosted site surface
- Backend: Node.js + Express on Vercel `/api`
- Persistence: Supabase-backed storage and ingestion job state

## Current verified state

- website-first product shell is live at `https://molt-live.com`
- Vercel frontend + Vercel `/api` backend are working
- deployment target is Vercel for both frontend and backend
- backend serves key Moltbook live/search/collection routes including:
  - `/api/health`
  - `/api/moltbook/report`
  - `/api/molt-live/search`
  - `/api/molt-live/community/:slug`
  - `/api/moltbook/collect/rolling`
  - `/api/moltbook/ingest/expanded`
  - `/api/moltbook/ingest/status`
  - `/api/moltbook/reindex/search`
  - `/api/moltbook/probe/fetch`
- suspicious ingest route reliability on Vercel was restored
- the missing `suspiciousMatchMeta` bug was fixed
- targeted suspicious family lanes exist for wallet / claim / seed / exploit
- `mode=suspicious-candidates` exists
- second-stage candidate scoring exists
- live `mode=action-chain-probe` now exists
- suspicious scheduler is off by design for now
- live probe currently confirms one concrete suspicious action-chain cluster:
  - `connect wallet`
  - `fill form`
  - `instant usdt`
  - `zero risk`
  - `no signing required`

## Incomplete

- widen live action-chain probe coverage and inspect more real matches
- rebuild stage 1 candidate collection from observed phrasing
- candidate promotion logic from weak-signal corpus to higher-confidence suspicious shortlist
- stronger suspicious-source acquisition beyond the generic recent-feed cursor
- richer suspicious-source mapping by recurring authors / submolts / phrase clusters
- final productization of trust/suspicious evidence into the best live UI surface

## Immediate next move

1. run live `mode=action-chain-probe`
2. widen the probe window and inspect more real matches
3. rebuild stage 1 from observed live action-chain phrasing
4. keep scheduler/manual collection conservative until stage 1 is trustworthy
