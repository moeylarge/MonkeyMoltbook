# HANDOFF.md

## Project
UFC betting engine / website

## Current state
This project exists in the active workspace, but current continuity notes say the visible snapshot may be incomplete and somewhat log-heavy.

What is known:
- visible project path: `/Users/moey/.openclaw/workspace/ufc-operator-web`
- related workspace folder also exists: `/Users/moey/.openclaw/workspace/ufc-analytics`
- the local refresh cadence was intentionally slowed down
- a stale fast refresh job was disabled

Operational notes already recovered:
- `com.moey.ufc-operator-live-odds` now runs every **12 hours** (`43200`)
- `com.moey.ufc-operator-live-odds-fast` is **disabled**
- the main UFC refresh job still references `ufc-operator-web/.env.local`

## Runtime / refresh notes
- refresh cadence: 12 hours
- important LaunchAgent: `com.moey.ufc-operator-live-odds`
- disabled LaunchAgent: `com.moey.ufc-operator-live-odds-fast`
- environment dependency: `.env.local`
- important caveat: cadence was fixed, but refresh may still fail if env or app state is incomplete

## How to run / verify
When resuming this project, first verify reality before coding:
1. inspect project files and confirm the app state is actually present
2. inspect `.env.local` and any refresh-related config/scripts
3. verify the refresh path still works end-to-end
4. only then make product/code changes

## Important files
- `HANDOFF.md`
- `.env.local`
- app entrypoints / package manifest
- refresh scripts
- any scheduler / LaunchAgent definitions tied to UFC refresh

## Current next steps
1. Verify the visible codebase is complete enough to work on
2. Verify `.env.local` and refresh dependencies are intact
3. Validate the refresh pipeline before changing logic or cadence again

## Known issues / risks
- visible workspace snapshot may not represent the full intended app state
- important deployment state may currently live in Vercel rather than in the visible local files
- John specifically recalls `ufcpickspro.com` plus password protection, but that state is not currently recoverable from the visible workspace snapshot alone
- logs may be present without a clean restorable runtime state
- refresh scheduling may be fixed while the underlying job still fails

## Recovery order
1. Read this file
2. Inspect `.env.local` and runtime config
3. Inspect refresh scripts/jobs
4. Run validation checks before changing anything
jobs
4. Run validation checks before changing anything
