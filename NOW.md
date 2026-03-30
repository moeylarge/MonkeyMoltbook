Updated: 2026-03-29 America/Los_Angeles

## Primary active focus

**MONKEYMOLTBOOK / MOLT-LIVE**

## Current truth

- project path: `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- live site: `https://molt-live.com`
- deployment target: **Vercel for both frontend and backend**
- Railway is not part of the active path
- suspicious ingest reliability is fixed on live Vercel
- `mode=suspicious-candidates` exists
- second-stage candidate scoring exists
- live `mode=action-chain-probe` now exists
- suspicious scheduler should stay off for now

## Resume point

Start from `mode=action-chain-probe`, not from more threshold tuning.

## Immediate next actions

1. Run the live `action-chain-probe` path.
2. Widen the probe window and inspect more real matches for action-chain scam phrasing.
3. Only after that, rebuild stage 1 candidate collection from observed live phrasing.

## Not now

Use `MonkeyMoltbook/BACKLOG.md` for deferred work. Do not expand the active list here.
