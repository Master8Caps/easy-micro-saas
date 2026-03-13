-- 00020: Add digest_unsubscribed flag to profiles
ALTER TABLE profiles
  ADD COLUMN digest_unsubscribed boolean NOT NULL DEFAULT false;
