-- Relationships + recipient discovery support for Start Conversation

begin;

alter table if exists public.profiles
  add column if not exists is_discoverable boolean not null default true,
  add column if not exists is_message_enabled boolean not null default true,
  add column if not exists last_active_at timestamptz null;

create index if not exists idx_profiles_discoverable_messageable
  on public.profiles (is_discoverable, is_message_enabled);

create index if not exists idx_profiles_last_active_at
  on public.profiles (last_active_at desc);

create table if not exists public.member_relationships (
  id uuid primary key default gen_random_uuid(),
  source_user_id text not null,
  target_user_id text not null,
  relationship_type text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_user_id, target_user_id, relationship_type)
);

create index if not exists idx_member_relationships_source
  on public.member_relationships (source_user_id);

create index if not exists idx_member_relationships_target
  on public.member_relationships (target_user_id);

create index if not exists idx_member_relationships_type_status
  on public.member_relationships (relationship_type, status);

commit;
