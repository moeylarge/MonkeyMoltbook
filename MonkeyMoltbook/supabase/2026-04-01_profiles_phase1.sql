-- Phase 1 member profile/settings foundation for Molt Live

begin;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  email text,
  username text not null unique,
  display_name text,
  bio text,
  website_url text,
  location_text text,
  tagline text,
  pronouns text,
  avatar_url text,
  banner_url text,
  is_public boolean not null default true,
  message_permission text not null default 'everyone',
  mention_permission text not null default 'everyone',
  discoverable_by_email boolean not null default true,
  discoverable_by_phone boolean not null default false,
  allow_search_indexing boolean not null default true,
  notification_email_enabled boolean not null default true,
  notification_push_enabled boolean not null default true,
  notification_messages_enabled boolean not null default true,
  notification_mentions_enabled boolean not null default true,
  notification_follows_enabled boolean not null default true,
  notification_marketing_enabled boolean not null default false,
  theme_preference text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_is_public on public.profiles(is_public);

alter table public.profiles enable row level security;

commit;
