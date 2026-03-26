# Phase 10 Production Notes

## Added
- Vercel config
- password-gate middleware
- login page
- env example
- deploy instructions

## Important limitation
Current app still uses local SQLite.
That is not durable for real production on Vercel.
The next required production-hardening step is moving persistence to a hosted database.
