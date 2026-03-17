-- Ad Campaigns
create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google', 'linkedin', 'tiktok')),
  platform_campaign_id text,
  name text not null,
  objective text not null check (objective in ('awareness', 'traffic', 'conversions', 'engagement', 'leads')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  daily_budget numeric not null default 0,
  total_budget numeric not null default 0,
  currency text not null default 'USD',
  audience_targeting jsonb not null default '{}',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ad_campaigns enable row level security;

create policy "Users can view own ad campaigns"
  on public.ad_campaigns for select using (user_id = auth.uid());
create policy "Users can create own ad campaigns"
  on public.ad_campaigns for insert with check (user_id = auth.uid());
create policy "Users can update own ad campaigns"
  on public.ad_campaigns for update using (user_id = auth.uid());
create policy "Users can delete own ad campaigns"
  on public.ad_campaigns for delete using (user_id = auth.uid());

create trigger handle_ad_campaigns_updated_at
  before update on public.ad_campaigns
  for each row execute procedure extensions.moddatetime(updated_at);

create index idx_ad_campaigns_user_status on public.ad_campaigns(user_id, status);

-- Ad Sets
create table public.ad_sets (
  id uuid primary key default gen_random_uuid(),
  ad_campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  targeting_override jsonb,
  daily_budget numeric,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ad_sets enable row level security;

create policy "Users can view own ad sets"
  on public.ad_sets for select using (user_id = auth.uid());
create policy "Users can create own ad sets"
  on public.ad_sets for insert with check (user_id = auth.uid());
create policy "Users can update own ad sets"
  on public.ad_sets for update using (user_id = auth.uid());
create policy "Users can delete own ad sets"
  on public.ad_sets for delete using (user_id = auth.uid());

create trigger handle_ad_sets_updated_at
  before update on public.ad_sets
  for each row execute procedure extensions.moddatetime(updated_at);

create index idx_ad_sets_campaign on public.ad_sets(ad_campaign_id);

-- Ads
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  ad_set_id uuid not null references public.ad_sets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_piece_id uuid references public.content_pieces(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  platform_ad_id text,
  headline text not null,
  body text not null,
  cta text not null default 'Learn More',
  image_url text,
  video_url text,
  destination_url text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ads enable row level security;

create policy "Users can view own ads"
  on public.ads for select using (user_id = auth.uid());
create policy "Users can create own ads"
  on public.ads for insert with check (user_id = auth.uid());
create policy "Users can update own ads"
  on public.ads for update using (user_id = auth.uid());
create policy "Users can delete own ads"
  on public.ads for delete using (user_id = auth.uid());

create trigger handle_ads_updated_at
  before update on public.ads
  for each row execute procedure extensions.moddatetime(updated_at);

create index idx_ads_ad_set on public.ads(ad_set_id);
