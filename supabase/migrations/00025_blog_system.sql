-- ============================================
-- Migration 00025: Blog system
-- ============================================
-- Tables for the public blog + external publishing API:
--   - blog_categories  (15 seeded)
--   - blog_tags        (50 seeded — vocabulary baseline)
--   - blog_articles    (tags stored as TEXT[])
-- Also creates the `blog-media` Storage bucket for image uploads.
-- All writes go through the service role key on the marketing site
-- API routes. RLS allows anonymous read of published articles as a
-- safety net in case anon-key reads ever happen.
-- ============================================

-- ============================================
-- 1. blog_categories
-- ============================================

create table public.blog_categories (
  slug        text primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

alter table public.blog_categories enable row level security;

create policy "Public read blog_categories"
  on public.blog_categories for select
  using (true);

insert into public.blog_categories (slug, name) values
  ('positioning',            'Positioning & Messaging'),
  ('launch-strategies',      'Launch Strategies'),
  ('pricing-monetization',   'Pricing & Monetization'),
  ('growth-experiments',     'Growth Experiments'),
  ('seo',                    'SEO'),
  ('content-marketing',      'Content Marketing'),
  ('email-marketing',        'Email Marketing'),
  ('social-media',           'Social Media'),
  ('paid-ads',               'Paid Ads'),
  ('customer-acquisition',   'Customer Acquisition'),
  ('retention-churn',        'Retention & Churn'),
  ('analytics-metrics',      'Analytics & Metrics'),
  ('founder-stories',        'Founder Stories'),
  ('tools-and-workflows',    'Tools & Workflows'),
  ('ai-for-marketers',       'AI for Marketers');


-- ============================================
-- 2. blog_tags  (vocabulary baseline)
-- ============================================

create table public.blog_tags (
  slug        text primary key,
  created_at  timestamptz not null default now()
);

alter table public.blog_tags enable row level security;

create policy "Public read blog_tags"
  on public.blog_tags for select
  using (true);

insert into public.blog_tags (slug) values
  -- Platforms (9)
  ('twitter-x'), ('linkedin'), ('reddit'), ('product-hunt'),
  ('hacker-news'), ('tiktok'), ('youtube'), ('indie-hackers'), ('github'),
  -- SEO (5)
  ('keyword-research'), ('backlinks'), ('technical-seo'),
  ('programmatic-seo'), ('copywriting'),
  -- Content Formats (5)
  ('case-study'), ('tutorial'), ('teardown'), ('listicle'), ('comparison-post'),
  -- Acquisition Tactics (10)
  ('cold-email'), ('cold-dm'), ('landing-page-optimization'),
  ('conversion-rate'), ('ab-testing'), ('lead-magnets'),
  ('referral-program'), ('affiliate-marketing'), ('partnerships'),
  ('viral-loops'),
  -- Email (3)
  ('newsletter'), ('drip-campaign'), ('onboarding-email'),
  -- Metrics (5)
  ('attribution'), ('funnel-analysis'), ('cac'), ('ltv'), ('tracked-links'),
  -- Stage/Persona (6)
  ('pre-launch'), ('first-100-users'), ('zero-to-one'),
  ('bootstrapping'), ('solo-founder'), ('side-project'),
  -- Monetization (3)
  ('freemium'), ('pricing-strategy'), ('upgrades'),
  -- Tools & Automation (4)
  ('no-code'), ('ai-tools'), ('automation'), ('crm');


-- ============================================
-- 3. blog_articles
-- ============================================

create table public.blog_articles (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          text not null,
  content        text not null,
  excerpt        text,
  category_slug  text references public.blog_categories(slug),
  author         text not null default 'Easy Micro SaaS Team',
  reading_time   integer,
  featured_image text,
  tags           text[] not null default '{}',
  published      boolean not null default true,
  published_at   timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_blog_articles_published
  on public.blog_articles(published, published_at desc);

create index idx_blog_articles_category
  on public.blog_articles(category_slug)
  where published = true;

create index idx_blog_articles_tags
  on public.blog_articles using gin (tags);

alter table public.blog_articles enable row level security;

-- Anonymous users can read published articles only.
-- Writes go through the service role key (bypasses RLS).
create policy "Public read published blog_articles"
  on public.blog_articles for select
  using (published = true);


-- ============================================
-- 4. Storage bucket for blog media
-- ============================================

insert into storage.buckets (id, name, public)
  values ('blog-media', 'blog-media', true)
  on conflict (id) do nothing;

-- Public read policy for the blog-media bucket
create policy "Public read blog-media"
  on storage.objects for select
  using (bucket_id = 'blog-media');


-- ============================================
-- Done.
-- ============================================
