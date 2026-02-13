-- ============================================
-- Migration 009: Add status column to profiles
-- ============================================
-- Separates access gating (waitlist/active) from subscription tier (free/paid/admin).
-- New users default to 'waitlist'. Existing users are set to 'active'.
-- Run this in the Supabase SQL Editor.
-- ============================================

-- 1. Add status column (default 'waitlist' for new signups)
alter table public.profiles
  add column status text not null default 'waitlist'
  check (status in ('waitlist', 'active'));

-- 2. Set all existing users to 'active' (they already have access)
update public.profiles set status = 'active';

-- 3. Update the profile creation function to set status = 'waitlist' for new signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'free',
    'waitlist'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- Done.
-- ============================================
