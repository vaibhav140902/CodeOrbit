create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text unique not null,
  display_name text not null,
  locale text not null default 'en' check (locale in ('en', 'hi')),
  role text not null default 'user',
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  country_code text not null default 'IN',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  description_md text not null,
  starter_code jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '[]'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_by uuid references public.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.problem_tags (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  tag text not null,
  unique (problem_id, tag)
);

create table if not exists public.problem_companies (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  priority integer not null default 0,
  unique (problem_id, company_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  language text not null,
  status text not null,
  runtime_ms integer,
  memory_kb integer,
  source_code text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  solved boolean not null default false,
  best_status text,
  attempts integer not null default 0,
  last_submission_at timestamptz,
  unique (user_id, problem_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_code text not null,
  status text not null,
  provider text not null default 'razorpay',
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider_order_id text unique not null,
  provider_payment_id text unique,
  amount_paise integer not null,
  currency text not null default 'INR',
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid references public.users(id) on delete set null,
  referral_code text unique not null,
  status text not null default 'pending',
  reward_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_slug text not null,
  role_slug text not null,
  score numeric(5,2),
  transcript jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  target_role text not null,
  pdf_storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  event_source text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.waitlist_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  role text not null,
  target text not null,
  team_size text,
  message text,
  created_at timestamptz not null default timezone('utc', now())
);

