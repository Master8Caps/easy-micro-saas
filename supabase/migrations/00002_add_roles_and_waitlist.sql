-- ============================================
-- Migration 002: User roles + Waitlist table
-- ============================================
-- Run this in the Supabase SQL Editor after 00001.
-- ============================================


-- ============================================
-- 1. Add role column to profiles
-- ============================================

alter table public.profiles
  add column role text not null default 'free'
  check (role in ('free', 'paid', 'admin'));

-- Update the profile creation function to set default role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'free'
  );
  return new;
end;
$$ language plpgsql security definer;


-- ============================================
-- 2. Waitlist table
-- ============================================

create table public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text,
  source      text not null default 'marketing-site',
  created_at  timestamptz not null default now(),
  unique(email)
);

-- Waitlist does NOT have RLS — inserts come from the marketing site
-- API route using the service role key. No user auth required.
alter table public.waitlist enable row level security;

-- Only admins can read the waitlist (via service role key in practice)
-- No public select/insert policies — all access goes through the server.


-- ============================================
-- Done.
-- ============================================
