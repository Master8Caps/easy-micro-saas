-- ============================================
-- Migration 00006: Content Format Preferences + Remove Video Hook
-- ============================================
-- Adds content_formats column to products so users can choose
-- which content types (text, images, video) they want generated.
-- Also removes video-hook from constraints (redundant with video-script).
-- ============================================

-- Add content_formats to products (default all selected)
ALTER TABLE public.products ADD COLUMN content_formats TEXT[] NOT NULL DEFAULT '{text,images,video}';

-- Migrate existing video-hook data to video-script before updating constraints
UPDATE public.campaigns SET content_type = 'video-script' WHERE content_type = 'video-hook';
UPDATE public.content_pieces SET type = 'video-script' WHERE type = 'video-hook';

-- Remove video-hook from campaigns content_type constraint
ALTER TABLE public.campaigns DROP CONSTRAINT campaigns_content_type_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_content_type_check
  CHECK (content_type IN (
    'text-post', 'thread', 'video-script',
    'image-prompt', 'landing-page', 'email', 'ad-copy'
  ));

-- Remove video-hook from content_pieces type constraint
ALTER TABLE public.content_pieces DROP CONSTRAINT content_pieces_type_check;
ALTER TABLE public.content_pieces ADD CONSTRAINT content_pieces_type_check
  CHECK (type IN (
    'linkedin-post', 'twitter-post', 'twitter-thread',
    'video-script', 'image-prompt',
    'landing-page-copy', 'email', 'ad-copy',
    'email-sequence', 'meta-description', 'tagline'
  ));
