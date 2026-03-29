create extension if not exists pgcrypto;

create table if not exists raw_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  mode text not null,
  trigger_source text not null,
  source text not null,
  status text not null default 'ok',
  notes text,
  author_count int,
  post_count int,
  submolt_count int,
  payload_summary jsonb
);

create table if not exists raw_author_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references raw_ingest_runs(id) on delete cascade,
  source_author_id text,
  author_name text not null,
  profile_url text,
  payload jsonb not null,
  captured_at timestamptz not null default now()
);
create index if not exists idx_raw_author_snapshots_run_id on raw_author_snapshots(run_id);
create index if not exists idx_raw_author_snapshots_source_author_id on raw_author_snapshots(source_author_id);

create table if not exists raw_post_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references raw_ingest_runs(id) on delete cascade,
  source_post_id text,
  source_author_id text,
  submolt_name text,
  payload jsonb not null,
  captured_at timestamptz not null default now()
);
create index if not exists idx_raw_post_snapshots_run_id on raw_post_snapshots(run_id);
create index if not exists idx_raw_post_snapshots_source_post_id on raw_post_snapshots(source_post_id);

create table if not exists raw_submolt_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references raw_ingest_runs(id) on delete cascade,
  submolt_name text not null,
  payload jsonb not null,
  captured_at timestamptz not null default now()
);
create index if not exists idx_raw_submolt_snapshots_run_id on raw_submolt_snapshots(run_id);

create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  source_author_id text unique,
  author_name text not null unique,
  profile_url text,
  description text,
  is_claimed boolean not null default false,
  is_active boolean not null default false,
  karma bigint,
  post_count int,
  total_score bigint,
  total_comments bigint,
  avg_score_per_post numeric,
  avg_comments_per_post numeric,
  signal_score numeric,
  fit_score numeric,
  label text,
  reason text,
  latest_post_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_authors_fit_score on authors(fit_score desc);
create index if not exists idx_authors_signal_score on authors(signal_score desc);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  source_post_id text unique,
  source_author_id text,
  author_id uuid references authors(id) on delete set null,
  author_name text,
  title text,
  snippet text,
  url text,
  submolt_name text,
  score bigint,
  comment_count bigint,
  created_at_source timestamptz,
  captured_at timestamptz not null default now(),
  payload jsonb
);
create index if not exists idx_posts_author_id on posts(author_id);
create index if not exists idx_posts_submolt_name on posts(submolt_name);

create table if not exists submolts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text,
  post_count int,
  avg_score_per_post numeric,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists author_topics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references authors(id) on delete cascade,
  topic text not null,
  created_at timestamptz not null default now(),
  unique (author_id, topic)
);
create index if not exists idx_author_topics_topic on author_topics(topic);

create table if not exists ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references raw_ingest_runs(id) on delete cascade,
  ranking_type text not null,
  author_id uuid references authors(id) on delete cascade,
  position int not null,
  fit_score numeric,
  signal_score numeric,
  captured_at timestamptz not null default now()
);
create index if not exists idx_ranking_snapshots_run_type on ranking_snapshots(run_id, ranking_type);

create table if not exists topic_clusters (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references raw_ingest_runs(id) on delete cascade,
  topic text not null,
  count int not null default 0,
  payload jsonb,
  captured_at timestamptz not null default now()
);
create index if not exists idx_topic_clusters_run_id on topic_clusters(run_id);

create table if not exists submolt_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references raw_ingest_runs(id) on delete cascade,
  submolt_id uuid references submolts(id) on delete cascade,
  position int,
  post_count int,
  avg_score_per_post numeric,
  payload jsonb,
  captured_at timestamptz not null default now()
);
create index if not exists idx_submolt_snapshots_run_id on submolt_snapshots(run_id);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  guest_id text,
  agent_author_id text,
  agent_name text not null,
  entry_source text,
  mode text not null default 'free',
  status text not null default 'created',
  tts_enabled boolean not null default true,
  stt_enabled boolean not null default false,
  cam_enabled boolean not null default false,
  mic_enabled boolean not null default true,
  transcript_enabled boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_sessions_agent_name on sessions(agent_name);

create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null,
  message_type text not null,
  text text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_session_messages_session_id on session_messages(session_id, created_at);

create table if not exists session_presence (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_cam_on boolean not null default false,
  user_mic_on boolean not null default true,
  tts_on boolean not null default true,
  transcript_on boolean not null default true,
  queue_position int,
  battle_ready boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (session_id)
);
create index if not exists idx_session_presence_session_id on session_presence(session_id);

create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  balance int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id uuid references sessions(id) on delete set null,
  type text not null,
  amount int not null,
  balance_after int not null,
  reason text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_credit_transactions_user_id on credit_transactions(user_id, created_at desc);

create table if not exists credit_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  credits_amount int not null,
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
