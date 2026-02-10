-- ============================================
-- Migration 00005: Separate Archived from Status
-- ============================================
-- Archived is now a boolean flag, not a status value.
-- This preserves workflow status (draft/ready/published)
-- when archiving content. e.g. "Published, Archived"
-- ============================================

-- Add archived boolean to campaigns and content_pieces
ALTER TABLE public.campaigns ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.content_pieces ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- Migrate any existing content_pieces with status='archived' →
-- set archived=true and revert status to 'draft'
UPDATE public.content_pieces
SET archived = true, status = 'draft'
WHERE status = 'archived';

-- Remove 'archived' from the content_pieces status constraint
ALTER TABLE public.content_pieces DROP CONSTRAINT content_pieces_status_check;
ALTER TABLE public.content_pieces ADD CONSTRAINT content_pieces_status_check
  CHECK (status IN ('draft', 'ready', 'published'));

-- Index for filtering by archived
CREATE INDEX idx_campaigns_archived ON public.campaigns(archived);
CREATE INDEX idx_content_pieces_archived ON public.content_pieces(archived);
