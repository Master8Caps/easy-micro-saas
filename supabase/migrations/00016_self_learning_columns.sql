-- Migration 00016: Self-Learning Columns
-- Adds rating and engagement columns to content_pieces for the
-- self-learning system (manual engagement tracking + thumbs up/down).

BEGIN;

-- Add rating and engagement columns
ALTER TABLE public.content_pieces
  ADD COLUMN rating SMALLINT DEFAULT NULL
    CHECK (rating IN (-1, 0, 1)),
  ADD COLUMN engagement_views INT DEFAULT NULL,
  ADD COLUMN engagement_likes INT DEFAULT NULL,
  ADD COLUMN engagement_comments INT DEFAULT NULL,
  ADD COLUMN engagement_shares INT DEFAULT NULL,
  ADD COLUMN engagement_logged_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index for efficient filtering of pieces with engagement data
CREATE INDEX idx_content_pieces_engagement
  ON public.content_pieces(engagement_logged_at)
  WHERE engagement_logged_at IS NOT NULL;

COMMIT;
