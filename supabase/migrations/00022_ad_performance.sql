-- Ad Performance
create table public.ad_performance (
  id uuid primary key default gen_random_uuid(),
  ad_campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  ad_set_id uuid references public.ad_sets(id) on delete cascade,
  ad_id uuid references public.ads(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  date date not null,
  spend numeric not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  conversions integer not null default 0,
  conversion_value numeric not null default 0,
  cpc numeric generated always as (case when clicks > 0 then spend / clicks else 0 end) stored,
  cpm numeric generated always as (case when impressions > 0 then (spend / impressions) * 1000 else 0 end) stored,
  ctr numeric generated always as (case when impressions > 0 then clicks::numeric / impressions else 0 end) stored,
  roas numeric generated always as (case when spend > 0 then conversion_value / spend else 0 end) stored,
  source text not null default 'manual' check (source in ('manual', 'csv_import', 'api')),
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ad_performance enable row level security;

create policy "Users can view own ad performance"
  on public.ad_performance for select using (
    exists (
      select 1 from public.ad_campaigns
      where ad_campaigns.id = ad_performance.ad_campaign_id
        and ad_campaigns.user_id = auth.uid()
    )
  );
create policy "Users can insert own ad performance"
  on public.ad_performance for insert with check (
    exists (
      select 1 from public.ad_campaigns
      where ad_campaigns.id = ad_performance.ad_campaign_id
        and ad_campaigns.user_id = auth.uid()
    )
  );
create policy "Users can update own ad performance"
  on public.ad_performance for update using (
    exists (
      select 1 from public.ad_campaigns
      where ad_campaigns.id = ad_performance.ad_campaign_id
        and ad_campaigns.user_id = auth.uid()
    )
  );
create policy "Users can delete own ad performance"
  on public.ad_performance for delete using (
    exists (
      select 1 from public.ad_campaigns
      where ad_campaigns.id = ad_performance.ad_campaign_id
        and ad_campaigns.user_id = auth.uid()
    )
  );

create trigger handle_ad_performance_updated_at
  before update on public.ad_performance
  for each row execute procedure extensions.moddatetime(updated_at);

-- Unique constraint for upsert support
create unique index idx_ad_performance_upsert
  on public.ad_performance(ad_campaign_id, ad_set_id, ad_id, date)
  nulls not distinct;

create index idx_ad_performance_campaign_date on public.ad_performance(ad_campaign_id, date);
create index idx_ad_performance_ad_date on public.ad_performance(ad_id, date);
create index idx_ad_performance_product_date on public.ad_performance(product_id, date);
create index idx_ad_performance_date on public.ad_performance(date);

-- Optimization Recommendations
create table public.optimization_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('budget_shift', 'creative_refresh', 'audience_adjust', 'pause', 'scale')),
  summary text not null,
  details jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.optimization_recommendations enable row level security;

create policy "Users can view own recommendations"
  on public.optimization_recommendations for select using (user_id = auth.uid());
create policy "Users can create own recommendations"
  on public.optimization_recommendations for insert with check (user_id = auth.uid());
create policy "Users can update own recommendations"
  on public.optimization_recommendations for update using (user_id = auth.uid());

create index idx_recommendations_user_status
  on public.optimization_recommendations(user_id, status);
