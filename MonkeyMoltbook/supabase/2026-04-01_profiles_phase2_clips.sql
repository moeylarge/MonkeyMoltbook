begin;

alter table public.profiles
  add column if not exists about text,
  add column if not exists category text,
  add column if not exists featured_links jsonb not null default '[]'::jsonb,
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0,
  add column if not exists like_count integer not null default 0,
  add column if not exists activity_item_count integer not null default 0,
  add column if not exists pinned_clip_ids jsonb not null default '[]'::jsonb;

update public.profiles
set
  about = coalesce(about, ''),
  category = coalesce(category, ''),
  featured_links = coalesce(featured_links, '[]'::jsonb),
  highlights = coalesce(highlights, '[]'::jsonb),
  topics = coalesce(topics, '[]'::jsonb),
  follower_count = coalesce(follower_count, 0),
  following_count = coalesce(following_count, 0),
  like_count = coalesce(like_count, 0),
  activity_item_count = coalesce(activity_item_count, 0),
  pinned_clip_ids = coalesce(pinned_clip_ids, '[]'::jsonb);

create table if not exists public.profile_clips (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  thumbnail_url text,
  video_url text,
  title text,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_clips_user_created on public.profile_clips(user_id, created_at desc);

alter table public.profile_clips enable row level security;

commit;
