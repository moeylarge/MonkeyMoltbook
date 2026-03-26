# Neon Migration

## Env
Set:
- `DATABASE_URL`

## Current status
- Neon helper added
- Postgres schema/init helper added
- app still has SQLite-based runtime paths in place

## Next production-hardening step
Switch runtime reads/writes from SQLite to Neon-backed functions.

## Important note
You pasted a live DB connection string into chat. Rotate it after setup if this conversation is not treated as secret.
