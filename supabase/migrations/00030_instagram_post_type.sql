-- ============================================
-- Migration 00030: Add instagram-post content type
-- ============================================
-- Instagram posts are now a first-class type that always carries an image,
-- instead of collapsing into image-prompt.
-- ============================================

ALTER TABLE public.content_pieces DROP CONSTRAINT content_pieces_type_check;
ALTER TABLE public.content_pieces ADD CONSTRAINT content_pieces_type_check
  CHECK (type IN (
    'linkedin-post', 'twitter-post', 'twitter-thread',
    'facebook-post', 'instagram-post',
    'video-script', 'image-prompt',
    'landing-page-copy', 'email', 'ad-copy',
    'email-sequence', 'meta-description', 'tagline'
  ));
