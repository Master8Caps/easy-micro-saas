-- ============================================
-- Migration 00004: Content Workstream Separation
-- ============================================
-- Separates content into three workstreams:
--   1. Social campaigns (organic content)
--   2. Ad campaigns (paid advertising)
--   3. Website kit (one-time deliverables)
-- ============================================

-- New product fields for website and ads
ALTER TABLE public.products ADD COLUMN has_website BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN website_url TEXT;
ALTER TABLE public.products ADD COLUMN wants_ads BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN ad_platforms TEXT[] NOT NULL DEFAULT '{}';

-- Campaign category to distinguish social vs ad
ALTER TABLE public.campaigns ADD COLUMN category TEXT NOT NULL DEFAULT 'social'
  CHECK (category IN ('social', 'ad'));

-- Expand content_pieces type check to include website kit types
ALTER TABLE public.content_pieces DROP CONSTRAINT content_pieces_type_check;
ALTER TABLE public.content_pieces ADD CONSTRAINT content_pieces_type_check
  CHECK (type IN (
    'linkedin-post', 'twitter-post', 'twitter-thread',
    'video-hook', 'video-script', 'image-prompt',
    'landing-page-copy', 'email', 'ad-copy',
    'email-sequence', 'meta-description', 'tagline'
  ));

-- Index for filtering campaigns by category
CREATE INDEX idx_campaigns_category ON public.campaigns(category);
