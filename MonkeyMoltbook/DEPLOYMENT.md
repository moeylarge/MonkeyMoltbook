# MonkeyMoltbook deployment notes

## Vercel

This repo is prepared for a static Vercel deploy of the web app.

### Config
- `vercel.json`
- build command: `npm run build:web`
- output directory: `apps/web/dist`

### Important
The web shell uses `VITE_API_BASE_URL` for live data.

Local example:
- `apps/web/.env.example`

Before real public deployment, set `VITE_API_BASE_URL` to your production backend URL in Vercel project environment variables.

## Private repo / backend minimum
- keep this repo private
- host backend privately / behind controlled infra
- keep ranking/scoring logic server-side
- avoid exposing internal source repos
- disable production sourcemaps if added later
