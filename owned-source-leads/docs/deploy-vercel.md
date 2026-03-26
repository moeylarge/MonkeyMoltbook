# Vercel Deploy

## Required env vars
- `ADMIN_PASSWORD`
- `AUTH_SECRET`

## Vercel steps
1. Import the `owned-source-leads` project into Vercel.
2. Set the framework to Next.js if needed.
3. Add env vars:
   - `ADMIN_PASSWORD`
   - `AUTH_SECRET`
4. Deploy.

## Auth behavior
- all app routes are password-gated by middleware
- `/login` is public
- `/api/postback` is left open for buyer callbacks

## Notes
- current storage is local SQLite, which is fine for local/dev but not durable for production Vercel serverless usage
- for true production persistence, the next step is moving storage to Postgres/Supabase/Neon/Turso
