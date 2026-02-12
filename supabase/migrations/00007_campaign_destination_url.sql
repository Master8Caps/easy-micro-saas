-- ============================================
-- Migration 00007: Campaign Destination URL
-- ============================================
-- Adds destination_url to campaigns so each campaign can have
-- a specific landing page for tracked links. Falls back to
-- products.website_url in application logic when null.
-- ============================================

ALTER TABLE public.campaigns ADD COLUMN destination_url TEXT;
