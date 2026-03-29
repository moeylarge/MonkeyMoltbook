# MonkeyMoltbook — HANDOFF

Updated: 2026-03-27 America/Los_Angeles

## Current phase

**MOLT-LIVE deployed prototype + launch-pass refinement**

## Objective

Build MonkeyMoltbook as a **website-first** Moltbook intelligence and live-AI discovery platform.

The active product direction is now:
- public Moltbook data ingestion
- ranking + signal analysis
- Top 100 / Rising 25 / Hot 25 / Topics / Top Submolts / Search
- direct navigation out to Moltbook accounts/submolts
- future live webcam AI session shell with transcript/export UX

It is **not** currently a mobile-app-first swipe product.

## What was done today

### Backend / data pipeline
The server on `http://127.0.0.1:8787` was expanded well beyond the earlier public-feed adapter.

Implemented in `apps/server`:
- persistent local public-data storage for Moltbook posts/authors
- ranking layer for public authors
- snapshot history retention
- per-author history retention
- MonkeyMoltbook fit scoring
- admit / watch / reject labels
- broader public discovery across multiple surfaces:
  - `new`
  - `top`
  - `hot`
- submolt discovery/indexing
- author coverage mapping
- growth metrics API
- CSV / JSON export endpoints
- scheduler endpoints for repeated crawls
- rising / hot / topic-cluster signal endpoints
- direct profile/submolt links in the data model

Important current server endpoints include:
- `GET /moltbook/report`
- `GET /moltbook/history`
- `GET /moltbook/discovery`
- `GET /moltbook/growth`
- `GET /moltbook/rising`
- `GET /moltbook/hot`
- `GET /moltbook/topics`
- `GET /moltbook/top-submolts`
- `GET /moltbook/export/authors.csv`
- `GET /moltbook/export/snapshots.csv`
- `GET /moltbook/export/report.json`
- `GET /moltbook/scheduler`
- `POST /moltbook/scheduler/start?everyMs=...`
- `POST /moltbook/scheduler/stop`
- `POST /moltbook/refresh`

### Website pivot
A new web app was created at:
- `MonkeyMoltbook/apps/web`

The product/frontend direction was explicitly reset and replaced with a new authoritative directive:
- the site must feel inspired by `monkey.app/home` energy
- but must remain original and **not** a clone
- webcam-first AI discovery must be obvious
- ranked discovery tabs must be core architecture
- the site must not look like a generic dashboard/admin tool

Implemented website/product shell routes:
- `/`
- `/top-100`
- `/rising-25`
- `/hot-25`
- `/topics`
- `/top-submolts`
- `/search`
- `/agent/:slug`
- `/live/:slug`
- `/safety`
- `/faq`

The rebuilt web shell now includes:
- branded landing page / hero
- discovery preview modules
- Top 100 / Rising 25 / Hot 25 / Topics / Top Submolts / Search structure
- agent profile page
- live session page shell
- transcript/export UI shell
- trust/safety page
- FAQ page
- mobile/desktop responsive navigation

## Verified proof

- server boots locally on `http://localhost:8787`
- current terminal confirmation after restart showed:
  - `MonkeyMoltbook server listening on http://localhost:8787`
- web app builds cleanly from `apps/web`
- latest verified web build command passed:
  - `npm run build:web`
- latest backend/product shell routes now compile successfully

## Important commits from today

Backend / data work:
- `200f61e` — `Add Moltbook public intel storage and rankings`
- `2f28d46` — `Add Moltbook snapshot history retention`
- `e8dd53e` — `Add Moltbook fit scoring and source report`
- `fe8bfb8` — `Expand Moltbook public discovery surfaces`
- `9345c71` — `Add Moltbook exports and growth endpoints`
- `d5b8505` — `Add Moltbook rising hot and topic signals`

Frontend / website pivot:
- `ee64f3f` — `Add MonkeyMoltbook web discovery app`
- `f8ae94a` — `Rebuild MonkeyMoltbook web product shell`

## Important current truth

- Moltbook posting/auth flow was checked and remained a separate blocker; this did **not** block the public-data intelligence buildout
- the strategic decision today was to **avoid** spending more time on Moltbook posting and instead build out the public-data/ranking/discovery system
- the product direction was explicitly upgraded from “Moltbook-like app” to a clearer wedge:
  - simplify Moltbook for confused users
  - surface the best accounts and submolts
  - show rising/hot signals
  - make navigation easy with direct links
- John explicitly decided this should probably be a **website**, not a native app, and that decision should be treated as active truth unless reopened

## Next step

Next major phase: **MOLT-LIVE LAUNCH PASS**

Priority order:
1. stronger camera-first landing section
2. stronger live session layout
3. more convincing human-to-agent webcam flow
4. cleaner mobile-first interaction feel
5. final production/backend pass

Important design reminder:
- `molt-live.com` should move much closer to the Monkey-style webcam energy on the interaction layer
- especially the camera-first / live-conversation feel
- but it must remain original and not become a direct clone

Current state before launch:
- deployed live at `https://molt-live.com`
- Vercel frontend + Vercel `/api` backend are both working
- Top 100 / Rising 25 / Hot 25 / Topics / Top Submolts all load
- agent pages and live pages load
- Open on Moltbook user links were corrected to `/u/<name>`
- Submolt links were validated
- waitlist / topic-interest / analytics hooks are live
- legal placeholders exist (`/privacy`, `/terms`)
- domain `molt-live.com` is connected and serving the project
- production hardening fallback exists so ranking surfaces do not go blank when live Moltbook intel is empty
- site was switched to a light theme and MM pink accents
- credits / wallet / premium battle mode UI shell exists
- camera-first homepage redesign and stronger live session redesign were started and deployed
- still not final launch-ready product yet
- real launch still requires the remaining launch-pass refinement and polish

## Immediate resume order for next session

Resume from this exact order:
1. review deployed `molt-live.com` on phone first
2. continue the **MOLT-LIVE LAUNCH PASS** only
3. priority sequence:
   - mobile-first homepage polish
   - stronger camera-first landing section
   - stronger live session realism / interaction tension
   - credits / battle flow refinement
   - final production hardening / launch polish
4. do not re-open deployment plumbing unless the live site breaks again

## Important recent commits / deployment checkpoint

Key deployment + launch-pass commits from this session:
- `f383398` — Adapt MonkeyMoltbook backend for Vercel api
- `8ead41d` — Split MonkeyMoltbook Vercel app from local server boot
- `6fced9b` — Use /tmp data path on Vercel
- `21d5bb1` — Fix Moltbook profile links and add Vercel refresh cron
- `c757672` — Fallback to seeded agents when Moltbook intel is empty
- `d7e302b` — Switch MonkeyMoltbook to light theme
- `163b8a1` — Use MM pink accent for nav tabs
- `aa258f2` — Add credits UI and premium battle mode shell
- `4fe050b` — Redesign camera-first homepage and live session mobile UX

## Stop conditions

- Do not drift back into the old generic dashboard design.
- Do not resume mobile-shell debugging unless John explicitly reopens that path.
- Do not mix posting/auth automation into the public-data intelligence system unless John explicitly requests that separate track again.
- Do not reintroduce Railway unless Vercel deployment is explicitly reopened; the live working stack is Vercel now.
