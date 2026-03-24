# HANDOFF.md

## Project
UFC betting engine / website

## Current state
This project exists in the active workspace, but current continuity notes say the visible snapshot may be incomplete and somewhat log-heavy.

What is known:
- visible project path: `/Users/moey/.openclaw/workspace/ufc-operator-web`
- related workspace folder also exists: `/Users/moey/.openclaw/workspace/ufc-analytics`
- John recalls a UFC site at `https://www.ufcpickspro.com/`
- John recalls that this site was deployed on Vercel and had password protection added
- live-site verification now confirms the site is currently served by **Vercel** and protected by **HTTP Basic Auth**
- confirmed auth header: `www-authenticate: Basic realm="UFC Picks Pro", charset="UTF-8"`
- Vercel dashboard evidence now also confirms:
  - domain: `ufcpickspro.com`
  - status: **Active**
  - registrar: **Third Party**
  - nameservers: **Third Party**
  - Vercel CDN: **Active**
  - age shown in Vercel: **Mar 18**
  - visible DNS record in screenshot: root `A` record → `76.76.21.21` with `TTL 60`
  - Vercel DNS is **not** currently enabled for the domain from the shown screen
- the currently visible local workspace snapshot does **not** preserve obvious Vercel config, password-protection code, or deployment metadata for that site
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
- deployment caveat: important deploy/protection state may currently live in Vercel rather than in the visible local files

## How to run / verify
When resuming this project, first verify reality before coding:
1. inspect project files and confirm the app state is actually present
2. inspect `.env.local` and any refresh-related config/scripts
3. verify the refresh path still works end-to-end
4. if website/deploy behavior matters, verify Vercel-side project settings and protection state too
5. only then make product/code changes

## Important files
- `HANDOFF.md`
- `.env.local`
- app entrypoints / package manifest
- refresh scripts
- any scheduler / LaunchAgent definitions tied to UFC refresh

## Current next steps
1. Treat `ufc-operator-web-recovered` as the current working deploy folder unless disproven
2. Fix the recovered project's sync path so it writes into `ufc-operator-web-recovered/public/data/website_bundle.json` instead of the stale `ufc-operator-web` target
3. Keep resolved bets above pending bets in the default performance history sort so the site surfaces meaningful recent results first
4. Verify whether yesterday's fight-result update landed locally but did not deploy
5. Verify whether the deploy is correct on Vercel but the apex domain is serving stale or misrouted DNS
6. Compare `www.ufcpickspro.com` vs `ufcpickspro.com` vs `ufc-operator-web.vercel.app` to see where the updated state actually exists
7. Verify `.env.local` and refresh dependencies are intact
8. Validate the refresh/data pipeline before changing logic again
9. Recover the Vercel-side project state directly if website behavior still diverges from local truth

## Known issues / risks
- visible workspace snapshot may not represent the full intended app state
- important deployment state may currently live in Vercel rather than in the visible local files
- John specifically recalls `ufcpickspro.com` plus password protection, and live-site verification confirms Basic Auth, but the implementation details are not currently recoverable from the visible workspace snapshot alone
- there is now a known live-state mismatch: yesterday's updated fight results are not currently visible on the live site
- apex domain DNS is currently suspect because Vercel recommends changing root `A` to `216.150.1.1`
- `www.ufcpickspro.com` and `ufc-operator-web.vercel.app` may be healthier than apex `ufcpickspro.com`
- logs may be present without a clean restorable runtime state
- refresh scheduling may be fixed while the underlying job still fails

## Recovery order
1. Read this file
2. Inspect `.env.local` and runtime config
3. Inspect refresh scripts/jobs
4. If website state matters, inspect Vercel directly
5. Run validation checks before changing anything
order
1. Read this file
2. Inspect `.env.local` and runtime config
3. Inspect refresh scripts/jobs
4. If website state matters, inspect Vercel directly
5. Run validation checks before changing anything
