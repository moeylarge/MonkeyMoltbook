# MonkeyMoltbook — STATUS

Updated: 2026-03-23 America/Los_Angeles

## Project name

MonkeyMoltbook

## Status

ACTIVE

## Current phase

Controlled Moltbook ingestion complete

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
- 3 controlled Moltbook agents are now normalized and available
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
- Moltbook path is cached and timeout-limited with local fallback behavior

## Current quality signal

- total hooks across local + Moltbook seed pool: 45
- cleanly valid hooks under current rules: 32
- Moltbook is integrated, but 2 seed hooks are still weak
- Moltbook responses currently fall back to local response voice when remote-specific banks are absent

## Incomplete

- tighten the weak Moltbook seed hooks
- add Moltbook-specific response banks
- connect a real remote `MOLTBOOK_URL` if/when the remote payload shape is confirmed
- logging
- real billing/paywall integration

## Immediate next decision

Choose between:
- public-feed Moltbook adapter implementation
- logging / analytics layer
- authenticated/private Moltbook endpoint hookup if API access is obtained
