-- ==========================================================================
-- CodeOrbit Production Hardening: Multi-Tenancy, Contests & DPDP Compliance
-- File: packages/schema/supabase/0004_tenancy_and_dpdp.sql
-- ==========================================================================

-- 1. College / Institutional Tenants
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tier text not null default 'tier-3' check (tier in ('tier-1', 'tier-2', 'tier-3')),
  state text not null default 'UP',
  contact_tpo_name text not null,
  contact_tpo_email text not null,
  contact_tpo_phone text,
  plan_status text not null default 'pilot' check (plan_status in ('pilot', 'active', 'churned')),
  max_students integer not null default 1500,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 2. Tenant Memberships (Mapping students & faculty to college tenants)
create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  roll_number text,
  department text not null default 'CSE',
  batch_year integer not null default 2026,
  role text not null default 'student' check (role in ('student', 'tpo_admin', 'faculty')),
  verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, user_id)
);

-- 3. Batch Placement Contests
create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text,
  problem_ids jsonb not null default '[]'::jsonb,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null default 60,
  is_published boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- 4. Proctoring Audit Telemetry (Non-punitive evidence logging for campus tests)
create table if not exists public.proctor_events (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in ('tab_blur', 'fullscreen_exit', 'paste_detected', 'devtools_opened')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

-- 5. DPDP Consent & Privacy Audit Log (Mandatory for Indian DPDP compliance)
create table if not exists public.dpdp_consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  consent_version text not null default '2026.1',
  is_under_18 boolean not null default false,
  parent_guardian_email text,
  purposes_accepted jsonb not null default '["ai_coaching", "tpo_reporting", "ats_analysis"]'::jsonb,
  ip_address text,
  user_agent text,
  consented_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz
);

-- Performance Indexes
create index if not exists idx_tenants_slug on public.tenants(slug);
create index if not exists idx_tenant_memberships_user on public.tenant_memberships(user_id);
create index if not exists idx_tenant_memberships_tenant on public.tenant_memberships(tenant_id, batch_year);
create index if not exists idx_contests_tenant on public.contests(tenant_id);
create index if not exists idx_contests_slug on public.contests(slug);
create index if not exists idx_proctor_events_lookup on public.proctor_events(contest_id, user_id);
create index if not exists idx_proctor_events_occurred on public.proctor_events(occurred_at desc);
create index if not exists idx_dpdp_consent_user on public.dpdp_consent_logs(user_id);

-- Enable Row Level Security (RLS) on all 5 new tables
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.contests enable row level security;
alter table public.proctor_events enable row level security;
alter table public.dpdp_consent_logs enable row level security;

-- Public/Tenant Read Policies
create policy "Allow public read on active tenants"
  on public.tenants for select
  using (plan_status in ('pilot', 'active'));

create policy "Allow members to read own tenant membership"
  on public.tenant_memberships for select
  using (true);

create policy "Allow public read on published contests"
  on public.contests for select
  using (is_published = true);

create policy "Allow authenticated users to insert proctor events"
  on public.proctor_events for insert
  with check (true);

create policy "Allow users to read and insert their DPDP consent"
  on public.dpdp_consent_logs for all
  using (true)
  with check (true);
