-- supabase/migrations/00023_metricool_posts.sql

create table metricool_posts (
  id uuid primary key default gen_random_uuid(),
  content_piece_id uuid not null references content_pieces(id) on delete cascade,
  metricool_post_id text,
  platform text not null,
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text not null default 'pending',

  impressions integer not null default 0,
  reach integer not null default 0,
  engagement integer not null default 0,
  clicks integer not null default 0,
  shares integer not null default 0,

  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_metricool_posts_content_piece on metricool_posts(content_piece_id);
create index idx_metricool_posts_status on metricool_posts(status);

alter table metricool_posts enable row level security;

create policy "Admin read metricool_posts"
  on metricool_posts for select
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin insert metricool_posts"
  on metricool_posts for insert
  with check (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin update metricool_posts"
  on metricool_posts for update
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));
