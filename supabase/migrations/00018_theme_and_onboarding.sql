-- Add theme preference to profiles
alter table public.profiles
  add column theme_preference text not null default 'dark';

alter table public.profiles
  add constraint profiles_theme_preference_check check (
    theme_preference in ('dark', 'light', 'system')
  );

-- Add onboarding completion timestamp to profiles
alter table public.profiles
  add column onboarding_completed_at timestamptz;

-- Create onboarding steps tracking table
create table public.user_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  step_key text not null,
  completed_at timestamptz not null default now(),
  constraint user_onboarding_steps_unique unique (user_id, step_key),
  constraint user_onboarding_steps_valid_key check (
    step_key in ('account', 'profile', 'product', 'brain', 'campaigns', 'schedule')
  )
);

-- Enable RLS
alter table public.user_onboarding_steps enable row level security;

-- Users can read/write their own onboarding steps
create policy "Users can view own onboarding steps"
  on public.user_onboarding_steps for select
  using (auth.uid() = user_id);

create policy "Users can insert own onboarding steps"
  on public.user_onboarding_steps for insert
  with check (auth.uid() = user_id);

create policy "Users can update own onboarding steps"
  on public.user_onboarding_steps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-complete 'account' step for all existing active users
insert into public.user_onboarding_steps (user_id, step_key)
select id, 'account' from public.profiles where status = 'active'
on conflict do nothing;

-- Also mark onboarding as complete for existing users (they don't need the checklist)
update public.profiles
set onboarding_completed_at = now()
where status = 'active';
