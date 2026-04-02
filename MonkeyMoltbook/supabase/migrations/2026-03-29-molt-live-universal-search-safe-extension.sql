-- SAFE EXTENSION for existing MonkeyMoltbook Supabase schema
-- Add only missing search + full-universe ingestion layers

create extension if not exists pg_trgm;

-- =========================
-- COMMUNITIES
-- =========================

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  source_community_id text unique,
  slug text unique,
  name text not null unique,
  title text,
  description text,
  member_count int,
  post_count int,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payload jsonb
);

create index if not exists idx_communities_slug on communities(slug);
create index if not exists idx_communities_member_count on communities(member_count desc);
create index if not exists idx_communities_post_count on communities(post_count desc);

-- =========================
-- MEMBERSHIPS
-- =========================

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  source_membership_id text unique,
  author_id uuid not null references authors(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  role text,
  created_at_source timestamptz,
  captured_at timestamptz not null default now(),
  payload jsonb,
  unique (author_id, community_id)
);

create index if not exists idx_memberships_author_id on memberships(author_id);
create index if not exists idx_memberships_community_id on memberships(community_id);

-- =========================
-- COMMUNITY METRICS
-- =========================

create table if not exists community_metrics (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null unique references communities(id) on delete cascade,
  active_authors int default 0,
  freshness_score numeric default 0,
  hot_score numeric default 0,
  topic_density_score numeric default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_community_metrics_hot_score on community_metrics(hot_score desc);

-- =========================
-- LIVE CANDIDATE SCORES
-- =========================

create table if not exists live_candidate_scores (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null unique references authors(id) on delete cascade,
  overall_score numeric default 0,
  momentum_score numeric default 0,
  hot_score numeric default 0,
  live_readiness_score numeric default 0,
  rank_top int,
  rank_rising int,
  rank_hot int,
  rank_live int,
  updated_at timestamptz not null default now()
);

create index if not exists idx_live_candidate_scores_rank_top on live_candidate_scores(rank_top);
create index if not exists idx_live_candidate_scores_rank_rising on live_candidate_scores(rank_rising);
create index if not exists idx_live_candidate_scores_rank_hot on live_candidate_scores(rank_hot);
create index if not exists idx_live_candidate_scores_rank_live on live_candidate_scores(rank_live);

-- =========================
-- SEARCH DOCUMENTS
-- =========================

create table if not exists search_documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('author', 'community', 'post', 'topic', 'submolt')),
  entity_id uuid not null,
  title text not null,
  subtitle text,
  body text,
  keywords text,
  popularity_score numeric default 0,
  freshness_score numeric default 0,
  live_score numeric default 0,
  search_tsv tsvector,
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create index if not exists idx_search_documents_tsv
  on search_documents using gin (search_tsv);

create index if not exists idx_search_documents_entity_type
  on search_documents(entity_type);

create index if not exists idx_search_documents_popularity
  on search_documents(entity_type, popularity_score desc);

create index if not exists idx_search_documents_title_trgm
  on search_documents using gin (title gin_trgm_ops);

create index if not exists idx_search_documents_keywords_trgm
  on search_documents using gin (keywords gin_trgm_ops);

-- =========================
-- INGESTION JOB STATE
-- =========================

create table if not exists ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null unique,
  status text not null default 'idle',
  cursor_json jsonb default '{}'::jsonb,
  stats_json jsonb default '{}'::jsonb,
  error_text text,
  last_run_at timestamptz,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_processed bigint default 0,
  stats_json jsonb default '{}'::jsonb,
  error_text text
);

-- =========================
-- UPDATED_AT TRIGGER
-- =========================

create or replace function set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_communities_updated_at on communities;
create trigger trg_communities_updated_at
before update on communities
for each row execute function set_row_updated_at();

drop trigger if exists trg_community_metrics_updated_at on community_metrics;
create trigger trg_community_metrics_updated_at
before update on community_metrics
for each row execute function set_row_updated_at();

drop trigger if exists trg_live_candidate_scores_updated_at on live_candidate_scores;
create trigger trg_live_candidate_scores_updated_at
before update on live_candidate_scores
for each row execute function set_row_updated_at();

drop trigger if exists trg_search_documents_updated_at on search_documents;
create trigger trg_search_documents_updated_at
before update on search_documents
for each row execute function set_row_updated_at();

drop trigger if exists trg_ingestion_jobs_updated_at on ingestion_jobs;
create trigger trg_ingestion_jobs_updated_at
before update on ingestion_jobs
for each row execute function set_row_updated_at();

-- =========================
-- SEARCH TSV REFRESH
-- =========================

create or replace function refresh_search_documents_tsv()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.subtitle, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.keywords, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.body, '')), 'C');
  return new;
end;
$$;

drop trigger if exists trg_search_documents_tsv on search_documents;
create trigger trg_search_documents_tsv
before insert or update on search_documents
for each row execute function refresh_search_documents_tsv();
