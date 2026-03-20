-- supabase/migrations/00024_metricool_analytics.sql

create table metricool_analytics (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  date date not null,
  followers integer not null default 0,
  reach integer not null default 0,
  impressions integer not null default 0,
  engagement integer not null default 0,
  profile_views integer not null default 0,
  created_at timestamptz not null default now(),
  unique(platform, date)
);

create index idx_metricool_analytics_platform_date on metricool_analytics(platform, date);

alter table metricool_analytics enable row level security;

create policy "Admin read metricool_analytics"
  on metricool_analytics for select
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin insert metricool_analytics"
  on metricool_analytics for insert
  with check (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin update metricool_analytics"
  on metricool_analytics for update
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));
