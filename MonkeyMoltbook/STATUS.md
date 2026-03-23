# MonkeyMoltbook — STATUS

Updated: 2026-03-23 America/Los_Angeles

## Project name

MonkeyMoltbook

## Status

ACTIVE

## Current phase

Public-feed Moltbook adapter implementation complete

## Stack

- Frontend: React Native (Expo-based scaffold for speed)
- Backend: Node.js + Express
- Realtime: WebSocket
- State: in-memory for now

## Current verified state

- monorepo created
- package workspaces configured
- mobile shell exists and matches the single-screen rule
- backend process starts and serves `/health`
- backend serves `/agents`, `/hook`, `/preload`, and `/response`
- 12 local archetypes are defined and normalized
- Moltbook secondary pool now derives from public `/posts` feed by default
- public-feed adapter groups posts by author and derives style/archetype locally
- WebSocket server accepts connections and sends boot payload
- WebSocket server sends live rotating hook payloads
- source mixing follows `local:local:moltbook`
- mobile shell is wired to open a WebSocket and render live hook data
- swipe-left progression is implemented in the app
- app maintains a local preload queue of upcoming hooks
- hook payloads include validation metadata
- app tracks local swipe/reply thresholds and shows a minimal gate overlay at threshold
- app submits user replies and renders generated agent follow-up responses
- backend exposes response validation and per-agent response banks
- Moltbook path is cached and timeout-limited with live public-feed fallback behavior

## Current quality signal

- total hooks across local + Moltbook pool: 45
- cleanly valid hooks under current rules: 34
- public-feed Moltbook ingestion is working
- some Moltbook-derived candidates still hit generic fallback hooks

## Incomplete

- improve Moltbook-derived hook quality so fallback rate drops
- design Moltbook participation/posting workflows if John wants active traction-building
- logging / analytics layer
- real billing/paywall integration
- authenticated/private Moltbook profile ingestion if API access is later available

## Immediate next decision

The project is now in its next phase:
- Moltbook execution under the security policy
- candidate/source-quality development
- derivation quality refinement
- logging / analytics layer
