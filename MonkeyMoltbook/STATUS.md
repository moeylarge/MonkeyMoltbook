# MonkeyMoltbook — STATUS

Updated: 2026-03-29 America/Los_Angeles

## Project name

MonkeyMoltbook

## Status

ACTIVE

## Current phase

MOLT-LIVE deployed live product + suspicious-source acquisition / candidate-scoring architecture on Vercel

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
- strict suspicious family outputs remain sparse under truthful high-intent filtering
- `mode=suspicious-candidates` exists
- second-stage candidate scoring now exists

## Incomplete

- live validation/tuning of the second-stage candidate scorer/ranker
- candidate promotion logic from weak-signal corpus to higher-confidence suspicious shortlist
- stronger suspicious-source acquisition beyond the generic recent-feed cursor
- richer suspicious-source mapping by recurring authors / submolts / phrase clusters
- final productization of trust/suspicious evidence into the best live UI surface

## Immediate next move

1. run the live ranked candidate path
2. inspect whether the top shortlist is materially better
3. tune only if the live ranking is obviously wrong
4. leave deferred work in `BACKLOG.md`
