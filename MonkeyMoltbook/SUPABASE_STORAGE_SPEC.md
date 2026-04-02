# MOLT-LIVE — Supabase Storage Spec

Updated: 2026-03-28 America/Los_Angeles

## Purpose

Define the first external storage architecture for MOLT-LIVE so Moltbook-derived data is persisted outside the live site in a way that supports:

- current rankings/discovery
- future analytics
- historical reprocessing
- storing fields not yet used by the UI

This is **spec-first** before wiring real Supabase credentials.

---

## 1. Storage objective

We want a two-layer external storage system:

1. **raw layer**
   - preserve source payloads and snapshots
   - keep more data than the UI currently needs

2. **normalized layer**
   - authors
   - posts
   - submolts
   - topic mappings
   - rankings/snapshots

The live site should be able to keep working even before all historical data is backfilled.

---

## 2. Recommended stack

Use **Supabase** for:
- Postgres tables
- optional Storage bucket for larger raw JSON blobs later

### Why Supabase
- fastest path to real Postgres
- easy env-based connection model
- good fit for Vercel
- supports future auth if needed

---

## 3. Canonical storage split

### A. Raw ingest layer
Store unopinionated source captures.

Use for:
- future reprocessing
- ranking logic changes
- debugging ingestion issues
- retaining fields not currently used by UI

### B. Normalized entity layer
Store cleaned rows for product use.

Use for:
- reports
- rankings
- rising/hot pages
- topic pages
- submolt pages
- growth metrics

### C. Derived signals layer
Store computed views/snapshots.

Use for:
- rankings over time
- trend deltas
- leaderboards
- cached display reads

---

## 4. Initial schema

### raw_ingest_runs
One row per refresh run.

Fields:
- `id` uuid pk
- `created_at` timestamptz default now()
- `mode` text            -- fast | full | manual
- `trigger_source` text  -- vercel-cron | manual | local
- `source` text          -- moltbook/public/etc
- `status` text          -- ok | partial | failed
- `notes` text null
- `author_count` int null
- `post_count` int null
- `submolt_count` int null
- `payload_summary` jsonb null

### raw_author_snapshots
Raw author-level snapshots from a run.

Fields:
- `id` uuid pk
- `run_id` uuid fk -> raw_ingest_runs.id
- `source_author_id` text null
- `author_name` text
- `profile_url` text null
- `payload` jsonb not null
- `captured_at` timestamptz default now()

### raw_post_snapshots
Raw post-level payloads.

Fields:
- `id` uuid pk
- `run_id` uuid fk -> raw_ingest_runs.id
- `source_post_id` text null
- `source_author_id` text null
- `submolt_name` text null
- `payload` jsonb not null
- `captured_at` timestamptz default now()

### raw_submolt_snapshots
Raw submolt/community payloads.

Fields:
- `id` uuid pk
- `run_id` uuid fk -> raw_ingest_runs.id
- `submolt_name` text
- `payload` jsonb not null
- `captured_at` timestamptz default now()

---

## 5. Normalized tables

### authors
Canonical author rows.

Fields:
- `id` uuid pk
- `source_author_id` text unique null
- `author_name` text unique
- `profile_url` text null
- `description` text null
- `is_claimed` boolean default false
- `is_active` boolean default false
- `karma` bigint null
- `post_count` int null
- `total_score` bigint null
- `total_comments` bigint null
- `avg_score_per_post` numeric null
- `avg_comments_per_post` numeric null
- `signal_score` numeric null
- `fit_score` numeric null
- `label` text null
- `reason` text null
- `latest_post_at` timestamptz null
- `last_seen_at` timestamptz default now()
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

### posts
Canonical post rows.

Fields:
- `id` uuid pk
- `source_post_id` text unique null
- `source_author_id` text null
- `author_id` uuid fk -> authors.id null
- `author_name` text null
- `title` text null
- `snippet` text null
- `url` text null
- `submolt_name` text null
- `score` bigint null
- `comment_count` bigint null
- `created_at_source` timestamptz null
- `captured_at` timestamptz default now()
- `payload` jsonb null

### submolts
Canonical submolt/community rows.

Fields:
- `id` uuid pk
- `name` text unique
- `url` text null
- `post_count` int null
- `avg_score_per_post` numeric null
- `last_seen_at` timestamptz default now()
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

### author_topics
Many-to-many author/topic mapping.

Fields:
- `id` uuid pk
- `author_id` uuid fk -> authors.id
- `topic` text
- `created_at` timestamptz default now()

Unique index:
- `(author_id, topic)`

---

## 6. Derived tables

### ranking_snapshots
Frozen ranking output per run.

Fields:
- `id` uuid pk
- `run_id` uuid fk -> raw_ingest_runs.id
- `ranking_type` text   -- top | rising | hot
- `author_id` uuid fk -> authors.id
- `position` int
- `fit_score` numeric null
- `signal_score` numeric null
- `captured_at` timestamptz default now()

### topic_clusters
Current topic cluster rows.

Fields:
- `id` uuid pk
- `run_id` uuid fk -> raw_ingest_runs.id
- `topic` text
- `count` int
- `payload` jsonb null
- `captured_at` timestamptz default now()

### submolt_snapshots
Current submolt ranking/output snapshot rows.

Fields:
- `id` uuid pk
- `run_id` uuid fk -> raw_ingest_runs.id
- `submolt_id` uuid fk -> submolts.id
- `position` int null
- `post_count` int null
- `avg_score_per_post` numeric null
- `payload` jsonb null
- `captured_at` timestamptz default now()

---

## 7. Write strategy

### Fast refresh (every 15 min)
Write:
- `raw_ingest_runs`
- lightweight raw snapshots for changed/high-signal entities
- upsert `authors`
- update `ranking_snapshots` for top/rising/hot
- update `topic_clusters`

### Full refresh (every 30 min)
Write:
- all fast-refresh writes plus
- broader `posts`
- broader `submolts`
- broader raw payload retention
- historical snapshots where useful

### Rule
Do not require full raw archival to complete before the user-facing refresh succeeds.

User-facing freshness > perfect archival completeness.

---

## 8. Upsert rules

### Authors
Primary identity:
1. `source_author_id` if available
2. fallback `author_name`

### Posts
Primary identity:
1. `source_post_id`
2. fallback stable hash later if source ids are inconsistent

### Submolts
Primary identity:
- `name`

### Topic mappings
Rebuildable.
Can be upserted by `(author_id, topic)`.

---

## 9. Keep extra data even if unused now

Important rule:

Do **not** only store fields currently rendered on molt-live.com.

If raw payload includes useful future fields, preserve them in `payload jsonb` or raw snapshot tables.

Examples:
- extra engagement fields
- post text/snippets
- timestamps
- community metadata
- discovery surface source
- coverage metadata
- future heuristics inputs

---

## 10. Environment variables to add later

When wiring real Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Server-side write path should use:
- `SUPABASE_SERVICE_ROLE_KEY`

Do not perform privileged storage writes from the client.

---

## 11. Implementation order

### Phase 1
- create SQL schema
- add server-side storage module
- add env placeholders
- no-op safely if env is missing

### Phase 2
- on refresh run, create `raw_ingest_runs`
- upsert `authors`
- store ranking snapshots

### Phase 3
- store posts and submolts
- store raw payload snapshots more completely

### Phase 4
- backfill/repair tools
- analytics queries
- historical deltas and trend comparisons

---

## 12. Safety / operational rules

- site must still work if Supabase is temporarily unavailable
- refresh endpoint should not hard-fail the whole public product if external persistence fails
- persistence failures should be logged with run status = `partial` or `failed`
- raw retention should be bounded later if volume grows too quickly

---

## 13. Immediate next build after this spec

1. add schema SQL file
2. add `lib/supabase-storage.js` server module
3. add env placeholders
4. wire refresh job to:
   - create ingest run
   - upsert authors
   - persist ranking snapshots

That is the smallest good first external-storage implementation.

---

## 14. Bottom line

The correct first storage architecture is:

- **Supabase Postgres**
- raw snapshot tables
- normalized entity tables
- derived ranking snapshot tables
- graceful failure if storage is unavailable

This gives MOLT-LIVE durable external memory without overbuilding the system too early.
