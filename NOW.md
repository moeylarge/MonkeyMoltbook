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
- blind scorer/threshold tuning hit diminishing returns

## Resume point

Stop tuning by guesswork. Next session, inspect raw matched phrasing first, then rebuild stage 1 from observed live post language.

## Immediate next actions

1. Pull a raw sample of posts containing: `claim`, `reward`, `eligible`, `wallet connect`, `connect wallet`, `verify your wallet`.
2. Inspect the real phrasing that appears in those posts.
3. Rebuild stage 1 candidate collection from observed phrasing instead of more blind threshold tuning.

## Not now

Use `MonkeyMoltbook/BACKLOG.md` for deferred work. Do not expand the active list here.
