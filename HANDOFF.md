Updated: 2026-03-29 America/Los_Angeles

## Recovery order

1. Read `PROJECTS.md`
2. Read `NOW.md`
3. Read `HANDOFF.md`
4. Open `MonkeyMoltbook/HANDOFF.md`
5. Open `MonkeyMoltbook/STATUS.md`

## Active project

- **MonkeyMoltbook / MOLT-LIVE**
- path: `/Users/moey/.openclaw/workspace/MonkeyMoltbook`
- live site: `https://molt-live.com`
- deployment target: **Vercel for both frontend and backend**
- Railway is legacy noise unless John explicitly reopens it

## Resume state

- suspicious ingest reliability is fixed
- `mode=suspicious-candidates` exists
- second-stage candidate scoring exists
- repeated live tuning showed threshold-only iteration was looping
- live `mode=action-chain-probe` was added as the new grounded starting point
- suspicious scheduler should remain off until stage 1 is trustworthy

## Open first inside the project

- `MonkeyMoltbook/HANDOFF.md`
- `MonkeyMoltbook/STATUS.md`
- `MonkeyMoltbook/apps/server/src/lib/moltbook-discovery.js`
- `MonkeyMoltbook/apps/server/src/app.js`

## Stop conditions

Stop once one of these is true:
- the action-chain probe window was widened and inspected
- a grounded stage-1 rebuild plan is clear from real matches
- the handoff files were updated
- the task was committed
