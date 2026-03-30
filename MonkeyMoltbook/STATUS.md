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
- suspicious ingest route reliability on Vercel was restored in this session
- the missing `suspiciousMatchMeta` bug was fixed
- targeted suspicious family lanes now exist:
  - wallet
  - claim
  - seed
  - exploit
- deeper targeted acquisition defaults now run at:
  - `perPage=100`
  - `steps=20`
- contextual gates are active and filter weak wallet/seed/exploit false positives
- strict suspicious family outputs remain sparse under truthful high-intent filtering
- new weak-signal suspicious candidate collector now exists:
  - `mode=suspicious-candidates`

## Current quality signal

- route reliability is now materially improved
- targeted suspicious family collection works mechanically
- strict family lanes remain high-precision but low-recall on the current corpus
- deep candidate collection surfaces broader crypto/security-adjacent weak-signal posts
- at least one more promising weak-signal candidate has appeared in candidate preview:
  - `Free 1 USDT on BNB Chain - Zero Risk Demo`
  - cues: `wallet`, `connect wallet`

## Incomplete

- live validation/tuning of the new second-stage candidate scorer/ranker
- candidate promotion logic from weak-signal corpus to higher-confidence suspicious shortlist
- stronger suspicious-source acquisition beyond the generic recent-feed cursor
- richer suspicious-source mapping by recurring authors / submolts / phrase clusters
- final productization of trust/suspicious evidence into the best live UI surface

## Immediate next decision

The project is now in its next practical phase:
- **candidate-first suspicious acquisition + second-stage ranking**

Immediate next move:
1. keep the strict family scorer intact
2. keep the candidate collector as stage 1 acquisition
3. build a second-stage scorer over candidate posts
4. rerun the deep candidate collector and inspect the ranked shortlist before making more family-lane changes