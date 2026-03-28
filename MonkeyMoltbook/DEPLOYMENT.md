# MonkeyMoltbook deployment notes

## Vercel

This repo is prepared for a static Vercel deploy of the web app.

### Config
- `vercel.json`
- build command: `npm run build:web`
- output directory: `apps/web/dist`

### Important
The current web shell depends on the local backend at `http://127.0.0.1:8787` for live data.
Before real public deployment, replace the hardcoded `API` base in `apps/web/src/App.jsx` with your production backend URL.

## Private repo / backend minimum
- keep this repo private
- host backend privately / behind controlled infra
- keep ranking/scoring logic server-side
- avoid exposing internal source repos
- disable production sourcemaps if added later
