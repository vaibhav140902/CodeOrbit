-- ==========================================================================
-- CodeOrbit Production Hardening: Indexes & Row-Level Security (RLS)
-- File: packages/schema/supabase/0003_rls_and_indexes.sql
-- ==========================================================================

-- Performance Indexes
create index if not exists idx_users_firebase_uid on public.users(firebase_uid);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_problems_slug on public.problems(slug);
create index if not exists idx_problems_status on public.problems(status);
create index if not exists idx_submissions_user_id on public.submissions(user_id);
create index if not exists idx_submissions_problem_id on public.submissions(problem_id);
create index if not exists idx_submissions_created_at on public.submissions(created_at desc);
create index if not exists idx_user_progress_user on public.user_progress(user_id);
create index if not exists idx_user_progress_solved on public.user_progress(user_id, solved);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id, status);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_interview_sessions_user on public.interview_sessions(user_id);
create index if not exists idx_resume_versions_user on public.resume_versions(user_id);

-- Enable Row Level Security (RLS) on all public tables
alter table public.users enable row level security;
alter table public.problems enable row level security;
alter table public.problem_tags enable row level security;
alter table public.problem_companies enable row level security;
alter table public.submissions enable row level security;
alter table public.user_progress enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.resume_versions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.waitlist_submissions enable row level security;

-- Public Read Policies for Catalog
create policy "Allow public read on published problems"
  on public.problems for select
  using (status = 'published');

create policy "Allow public read on problem tags"
  on public.problem_tags for select
  using (true);

create policy "Allow public read on problem companies"
  on public.problem_companies for select
  using (true);

-- Public Insert Policy for Waitlist
create policy "Allow public insert on waitlist"
  on public.waitlist_submissions for insert
  with check (true);

-- Service Role Full Access (Service Role bypasses RLS by default, but explicit for clarity)
-- Note: Supabase Service Role Key bypasses RLS automatically when executed via Next.js backend API.
