-- Optional reason captured when a draft is rejected in the swipe Review hub.
-- One of the chip slugs (see apps/app/lib/review/reject-reasons.ts) or null.
alter table content_pieces
  add column if not exists reject_reason text;
