-- Supabase hardening pass for MonkeyMoltbook / MOLT-LIVE
-- Generated 2026-04-01
-- Goal: eliminate exposed-public-schema warnings by enabling RLS on all app tables
-- Strategy:
--   1) Enable RLS on every table in public used by this schema
--   2) Do NOT create public/browser policies by default
--   3) Keep access server-side via service role or trusted backend only
--   4) Add narrow views/policies later only if explicitly needed

begin;

alter table public.raw_ingest_runs enable row level security;
alter table public.raw_author_snapshots enable row level security;
alter table public.raw_post_snapshots enable row level security;
alter table public.raw_submolt_snapshots enable row level security;

alter table public.authors enable row level security;
alter table public.posts enable row level security;
alter table public.submolts enable row level security;
alter table public.author_topics enable row level security;

alter table public.ranking_snapshots enable row level security;
alter table public.topic_clusters enable row level security;
alter table public.submolt_snapshots enable row level security;

alter table public.sessions enable row level security;
alter table public.session_messages enable row level security;
alter table public.session_presence enable row level security;

alter table public.wallets enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.credit_products enable row level security;

alter table public.risky_domains enable row level security;
alter table public.entity_risk_scores enable row level security;
alter table public.entity_risk_events enable row level security;

-- Optional defense-in-depth: ensure no leftover broad policies survive.
-- Safe even if policies do not exist.
drop policy if exists "public read authors" on public.authors;
drop policy if exists "public read posts" on public.posts;
drop policy if exists "public read submolts" on public.submolts;
drop policy if exists "public read author_topics" on public.author_topics;
drop policy if exists "public read credit_products" on public.credit_products;
drop policy if exists "public read entity_risk_scores" on public.entity_risk_scores;
drop policy if exists "anon read authors" on public.authors;
drop policy if exists "anon read posts" on public.posts;
drop policy if exists "anon read submolts" on public.submolts;
drop policy if exists "anon read author_topics" on public.author_topics;
drop policy if exists "anon read credit_products" on public.credit_products;
drop policy if exists "anon read entity_risk_scores" on public.entity_risk_scores;
drop policy if exists "authenticated read authors" on public.authors;
drop policy if exists "authenticated read posts" on public.posts;
drop policy if exists "authenticated read submolts" on public.submolts;
drop policy if exists "authenticated read author_topics" on public.author_topics;
drop policy if exists "authenticated read credit_products" on public.credit_products;
drop policy if exists "authenticated read entity_risk_scores" on public.entity_risk_scores;

commit;

-- Notes
-- With RLS enabled and no policies present, anon/authenticated client roles cannot read/write these tables.
-- Your trusted backend can still access them with the service role key or another bypass-RLS privileged path.
-- If you later want browser-direct reads, prefer creating narrow public views first, then policies on those views/tables.
