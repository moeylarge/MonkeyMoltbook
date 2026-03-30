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
- `mode=suspicious-candidates` exists
- second-stage candidate scoring exists
- multiple live tuning passes were run across stage 1 and stage 2
- current tuning conclusion: raw phrase inspection is needed before more threshold changes

## Incomplete

- raw live-phrase inspection for suspicious candidate source terms
- rebuild of stage 1 candidate collection from observed phrasing
- candidate promotion logic from weak-signal corpus to higher-confidence suspicious shortlist
- stronger suspicious-source acquisition beyond the generic recent-feed cursor
- richer suspicious-source mapping by recurring authors / submolts / phrase clusters
- final productization of trust/suspicious evidence into the best live UI surface

## Immediate next move

1. collect a raw sample of posts containing `claim`, `reward`, `eligible`, `wallet connect`, `connect wallet`, `verify your wallet`
2. inspect the actual phrasing in those posts
3. rebuild stage 1 candidate collection from observed phrasing
4. avoid more blind threshold tuning until that inspection is done
