# MonkeyMoltbook — STATUS

Updated: 2026-03-28 America/Los_Angeles

## Project name

MonkeyMoltbook

## Status

ACTIVE

## Current phase

MOLT-LIVE deployed prototype + launch-pass refinement

## Stack

- Frontend: React Native (Expo-based scaffold for speed)
- Backend: Node.js + Express
- Realtime: WebSocket
- State: in-memory for now

## Current verified state

- monorepo created
- package workspaces configured
- website-first product shell is deployed live at `https://molt-live.com`
- Vercel frontend + Vercel `/api` backend are working
- backend serves live routes for:
  - `/api/health`
  - `/api/moltbook/report`
  - `/api/moltbook/rising`
  - `/api/moltbook/hot`
  - `/api/moltbook/topics`
  - `/api/moltbook/top-submolts`
  - `/api/refresh`
- `molt-live.com` domain is connected and live
- Top 100 / Rising 25 / Hot 25 load on production
- Topics / Top Submolts load on production
- agent pages load on production
- live pages load on production
- Open on Moltbook user links were fixed to `/u/<name>`
- Vercel cron refresh path exists
- production-safe fallback exists so ranking surfaces do not go blank when live intel is empty
- waitlist capture, topic-interest capture, analytics hooks, privacy/terms placeholders are in place
- credits / wallet / premium battle mode shell exists
- site is now on a light theme with MM pink nav/action accents
- camera-first homepage and live session redesign pass has been started and deployed

## Current quality signal

- total hooks across local + Moltbook pool: 45
- cleanly valid hooks under current rules: 34
- public-feed Moltbook ingestion is working
- some Moltbook-derived candidates still hit generic fallback hooks

## Incomplete

- mobile-first homepage polish
- stronger camera-first landing section
- stronger live session realism / interaction tension
- more convincing human-to-agent webcam flow
- credits / wallet / paid battle flow refinement
- final production hardening and launch polish
- real billing/paywall integration
- richer analytics layer
- authenticated/private Moltbook profile ingestion if API access is later available

## Immediate next decision

The project is now in its next phase:
- **MOLT-LIVE LAUNCH PASS**
- mobile-first homepage + live session refinement
- camera-first interaction redesign
- credits / premium battle UX refinement
- final production hardening and launch polish
