-- Add image generation columns to content_pieces
ALTER TABLE content_pieces
  ADD COLUMN image_url text,
  ADD COLUMN image_source text,
  ADD COLUMN image_prompt_used text;

-- Constrain image_source to known values
ALTER TABLE content_pieces
  ADD CONSTRAINT content_pieces_image_source_check
  CHECK (image_source IN ('generated', 'uploaded'));
