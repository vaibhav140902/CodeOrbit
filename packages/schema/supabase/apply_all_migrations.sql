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

-- ==========================================================================
-- CodeOrbit Curated Placement & SDE Problem Catalog Seed Migration
-- File: packages/schema/supabase/0002_seed_problems.sql
-- ==========================================================================

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('two-sum', 'Two Sum', 'Easy', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', '{"javascript":"function twoSum(nums: number[], target: number): number[] {\n  const seen = new Map<number, number>();\n\n  for (let index = 0; index < nums.length; index += 1) {\n    const complement = target - nums[index];\n    if (seen.has(complement)) {\n      return [seen.get(complement)!, index];\n    }\n    seen.set(nums[index], index);\n  }\n\n  return [];\n}","typescript":"function twoSum(nums: number[], target: number): number[] {\n  const seen = new Map<number, number>();\n\n  for (let index = 0; index < nums.length; index += 1) {\n    const complement = target - nums[index];\n    if (seen.has(complement)) {\n      return [seen.get(complement)!, index];\n    }\n    seen.set(nums[index], index);\n  }\n\n  return [];\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["2 <= nums.length <= 10^4","-10^9 <= nums[i] <= 10^9","Exactly one valid answer exists."]'::jsonb, '[{"input":"nums = [2,7,11,15], target = 9","output":"[0,1]","explanation":"nums[0] + nums[1] == 9, so return [0, 1]."}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'two-sum'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Hash Map' FROM public.problems WHERE slug = 'two-sum'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('reverse-string', 'Reverse String', 'Easy', 'Write a function that reverses a string. The input string is given as an array of characters s.', '{"javascript":"function reverseString(s: string[]): void {\n  let left = 0;\n  let right = s.length - 1;\n\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left += 1;\n    right -= 1;\n  }\n}","typescript":"function reverseString(s: string[]): void {\n  let left = 0;\n  let right = s.length - 1;\n\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left += 1;\n    right -= 1;\n  }\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= s.length <= 10^5","s[i] is a printable ascii character."]'::jsonb, '[{"input":"s = [\"h\",\"e\",\"l\",\"l\",\"o\"]","output":"[\"o\",\"l\",\"l\",\"e\",\"h\"]"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Two Pointers' FROM public.problems WHERE slug = 'reverse-string'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'String' FROM public.problems WHERE slug = 'reverse-string'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('valid-parentheses', 'Valid Parentheses', 'Easy', 'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.', '{"javascript":"function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs = new Map<string, string>([\n    [\")\", \"(\"],\n    [\"]\", \"[\"],\n    [\"}\", \"{\"],\n  ]);\n\n  for (const char of s) {\n    if (!pairs.has(char)) {\n      stack.push(char);\n      continue;\n    }\n\n    if (stack.pop() !== pairs.get(char)) {\n      return false;\n    }\n  }\n\n  return stack.length === 0;\n}","typescript":"function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs = new Map<string, string>([\n    [\")\", \"(\"],\n    [\"]\", \"[\"],\n    [\"}\", \"{\"],\n  ]);\n\n  for (const char of s) {\n    if (!pairs.has(char)) {\n      stack.push(char);\n      continue;\n    }\n\n    if (stack.pop() !== pairs.get(char)) {\n      return false;\n    }\n  }\n\n  return stack.length === 0;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= s.length <= 10^4","s consists of parentheses only."]'::jsonb, '[{"input":"s = \"()[]{}\"","output":"true"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Stack' FROM public.problems WHERE slug = 'valid-parentheses'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'String' FROM public.problems WHERE slug = 'valid-parentheses'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('binary-search', 'Binary Search', 'Easy', 'Given an array of integers nums sorted in ascending order and an integer target, return the index of target if it exists.', '{"javascript":"function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (nums[middle] === target) return middle;\n    if (nums[middle] < target) {\n      left = middle + 1;\n    } else {\n      right = middle - 1;\n    }\n  }\n\n  return -1;\n}","typescript":"function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (nums[middle] === target) return middle;\n    if (nums[middle] < target) {\n      left = middle + 1;\n    } else {\n      right = middle - 1;\n    }\n  }\n\n  return -1;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= nums.length <= 10^4","nums is sorted in ascending order."]'::jsonb, '[{"input":"nums = [-1,0,3,5,9,12], target = 9","output":"4"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'binary-search'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Binary Search' FROM public.problems WHERE slug = 'binary-search'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('valid-anagram', 'Valid Anagram', 'Easy', 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.', '{"javascript":"function isAnagram(s: string, t: string): boolean {\n  if (s.length !== t.length) return false;\n\n  const counts = new Map<string, number>();\n  for (const char of s) {\n    counts.set(char, (counts.get(char) ?? 0) + 1);\n  }\n\n  for (const char of t) {\n    const next = (counts.get(char) ?? 0) - 1;\n    if (next < 0) return false;\n    counts.set(char, next);\n  }\n\n  return Array.from(counts.values()).every((value) => value === 0);\n}","typescript":"function isAnagram(s: string, t: string): boolean {\n  if (s.length !== t.length) return false;\n\n  const counts = new Map<string, number>();\n  for (const char of s) {\n    counts.set(char, (counts.get(char) ?? 0) + 1);\n  }\n\n  for (const char of t) {\n    const next = (counts.get(char) ?? 0) - 1;\n    if (next < 0) return false;\n    counts.set(char, next);\n  }\n\n  return Array.from(counts.values()).every((value) => value === 0);\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= s.length, t.length <= 5 * 10^4","s and t consist of lowercase English letters."]'::jsonb, '[{"input":"s = \"anagram\", t = \"nagaram\"","output":"true"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'String' FROM public.problems WHERE slug = 'valid-anagram'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Hash Map' FROM public.problems WHERE slug = 'valid-anagram'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('maximum-subarray', 'Maximum Subarray', 'Medium', 'Given an integer array nums, find the contiguous subarray with the largest sum and return its sum.', '{"javascript":"function maxSubArray(nums: number[]): number {\n  let best = nums[0];\n  let current = nums[0];\n\n  for (let index = 1; index < nums.length; index += 1) {\n    current = Math.max(nums[index], current + nums[index]);\n    best = Math.max(best, current);\n  }\n\n  return best;\n}","typescript":"function maxSubArray(nums: number[]): number {\n  let best = nums[0];\n  let current = nums[0];\n\n  for (let index = 1; index < nums.length; index += 1) {\n    current = Math.max(nums[index], current + nums[index]);\n    best = Math.max(best, current);\n  }\n\n  return best;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= nums.length <= 10^5","-10^4 <= nums[i] <= 10^4"]'::jsonb, '[{"input":"nums = [-2,1,-3,4,-1,2,1,-5,4]","output":"6","explanation":"[4,-1,2,1] has the largest sum = 6."}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'maximum-subarray'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Dynamic Programming' FROM public.problems WHERE slug = 'maximum-subarray'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Kadane' FROM public.problems WHERE slug = 'maximum-subarray'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'Medium', 'Given a string s, find the length of the longest substring without repeating characters.', '{"javascript":"function lengthOfLongestSubstring(s: string): number {\n  const lastSeen = new Map<string, number>();\n  let left = 0;\n  let best = 0;\n\n  for (let right = 0; right < s.length; right += 1) {\n    const previous = lastSeen.get(s[right]);\n    if (previous !== undefined && previous >= left) {\n      left = previous + 1;\n    }\n    lastSeen.set(s[right], right);\n    best = Math.max(best, right - left + 1);\n  }\n\n  return best;\n}","typescript":"function lengthOfLongestSubstring(s: string): number {\n  const lastSeen = new Map<string, number>();\n  let left = 0;\n  let best = 0;\n\n  for (let right = 0; right < s.length; right += 1) {\n    const previous = lastSeen.get(s[right]);\n    if (previous !== undefined && previous >= left) {\n      left = previous + 1;\n    }\n    lastSeen.set(s[right], right);\n    best = Math.max(best, right - left + 1);\n  }\n\n  return best;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["0 <= s.length <= 5 * 10^4","s consists of English letters, digits, symbols and spaces."]'::jsonb, '[{"input":"s = \"abcabcbb\"","output":"3","explanation":"The answer is \"abc\", with the length of 3."}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'String' FROM public.problems WHERE slug = 'longest-substring-without-repeating-characters'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Sliding Window' FROM public.problems WHERE slug = 'longest-substring-without-repeating-characters'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Hash Map' FROM public.problems WHERE slug = 'longest-substring-without-repeating-characters'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('product-of-array-except-self', 'Product of Array Except Self', 'Medium', 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].', '{"javascript":"function productExceptSelf(nums: number[]): number[] {\n  const answer = new Array<number>(nums.length).fill(1);\n  let prefix = 1;\n\n  for (let index = 0; index < nums.length; index += 1) {\n    answer[index] = prefix;\n    prefix *= nums[index];\n  }\n\n  let suffix = 1;\n  for (let index = nums.length - 1; index >= 0; index -= 1) {\n    answer[index] *= suffix;\n    suffix *= nums[index];\n  }\n\n  return answer;\n}","typescript":"function productExceptSelf(nums: number[]): number[] {\n  const answer = new Array<number>(nums.length).fill(1);\n  let prefix = 1;\n\n  for (let index = 0; index < nums.length; index += 1) {\n    answer[index] = prefix;\n    prefix *= nums[index];\n  }\n\n  let suffix = 1;\n  for (let index = nums.length - 1; index >= 0; index -= 1) {\n    answer[index] *= suffix;\n    suffix *= nums[index];\n  }\n\n  return answer;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["2 <= nums.length <= 10^5","-30 <= nums[i] <= 30","The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer."]'::jsonb, '[{"input":"nums = [1,2,3,4]","output":"[24,12,8,6]"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'product-of-array-except-self'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Prefix Sum' FROM public.problems WHERE slug = 'product-of-array-except-self'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('merge-intervals', 'Merge Intervals', 'Medium', 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.', '{"javascript":"function merge(intervals: number[][]): number[][] {\n  if (intervals.length <= 1) return intervals;\n\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged: number[][] = [intervals[0]];\n\n  for (const interval of intervals.slice(1)) {\n    const last = merged[merged.length - 1];\n    if (interval[0] <= last[1]) {\n      last[1] = Math.max(last[1], interval[1]);\n      continue;\n    }\n    merged.push(interval);\n  }\n\n  return merged;\n}","typescript":"function merge(intervals: number[][]): number[][] {\n  if (intervals.length <= 1) return intervals;\n\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged: number[][] = [intervals[0]];\n\n  for (const interval of intervals.slice(1)) {\n    const last = merged[merged.length - 1];\n    if (interval[0] <= last[1]) {\n      last[1] = Math.max(last[1], interval[1]);\n      continue;\n    }\n    merged.push(interval);\n  }\n\n  return merged;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= intervals.length <= 10^4","intervals[i].length == 2"]'::jsonb, '[{"input":"intervals = [[1,3],[2,6],[8,10],[15,18]]","output":"[[1,6],[8,10],[15,18]]"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'merge-intervals'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Sorting' FROM public.problems WHERE slug = 'merge-intervals'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('search-in-rotated-sorted-array', 'Search in Rotated Sorted Array', 'Medium', 'There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is rotated. Return the index of target if it is in nums, or -1 otherwise.', '{"javascript":"function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (nums[middle] === target) return middle;\n\n    if (nums[left] <= nums[middle]) {\n      if (nums[left] <= target && target < nums[middle]) {\n        right = middle - 1;\n      } else {\n        left = middle + 1;\n      }\n    } else if (nums[middle] < target && target <= nums[right]) {\n      left = middle + 1;\n    } else {\n      right = middle - 1;\n    }\n  }\n\n  return -1;\n}","typescript":"function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (nums[middle] === target) return middle;\n\n    if (nums[left] <= nums[middle]) {\n      if (nums[left] <= target && target < nums[middle]) {\n        right = middle - 1;\n      } else {\n        left = middle + 1;\n      }\n    } else if (nums[middle] < target && target <= nums[right]) {\n      left = middle + 1;\n    } else {\n      right = middle - 1;\n    }\n  }\n\n  return -1;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= nums.length <= 5000","-10^4 <= nums[i], target <= 10^4","All values of nums are unique."]'::jsonb, '[{"input":"nums = [4,5,6,7,0,1,2], target = 0","output":"4"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'search-in-rotated-sorted-array'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Binary Search' FROM public.problems WHERE slug = 'search-in-rotated-sorted-array'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('top-k-frequent-elements', 'Top K Frequent Elements', 'Medium', 'Given an integer array nums and an integer k, return the k most frequent elements.', '{"javascript":"function topKFrequent(nums: number[], k: number): number[] {\n  const counts = new Map<number, number>();\n  for (const num of nums) {\n    counts.set(num, (counts.get(num) ?? 0) + 1);\n  }\n\n  return [...counts.entries()]\n    .sort((left, right) => right[1] - left[1])\n    .slice(0, k)\n    .map(([value]) => value);\n}","typescript":"function topKFrequent(nums: number[], k: number): number[] {\n  const counts = new Map<number, number>();\n  for (const num of nums) {\n    counts.set(num, (counts.get(num) ?? 0) + 1);\n  }\n\n  return [...counts.entries()]\n    .sort((left, right) => right[1] - left[1])\n    .slice(0, k)\n    .map(([value]) => value);\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["1 <= nums.length <= 10^5","k is in the range [1, number of unique elements in the array].","It is guaranteed that the answer is unique."]'::jsonb, '[{"input":"nums = [1,1,1,2,2,3], k = 2","output":"[1,2]"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'top-k-frequent-elements'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Hash Map' FROM public.problems WHERE slug = 'top-k-frequent-elements'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Heap' FROM public.problems WHERE slug = 'top-k-frequent-elements'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('number-of-islands', 'Number of Islands', 'Medium', 'Given an m x n 2D binary grid grid which represents a map of ''1''s and ''0''s, return the number of islands.', '{"javascript":"function numIslands(grid: string[][]): number {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  let islands = 0;\n\n  const dfs = (row: number, col: number) => {\n    if (row < 0 || col < 0 || row >= rows || col >= cols || grid[row][col] !== \"1\") {\n      return;\n    }\n\n    grid[row][col] = \"0\";\n    dfs(row + 1, col);\n    dfs(row - 1, col);\n    dfs(row, col + 1);\n    dfs(row, col - 1);\n  };\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === \"1\") {\n        islands += 1;\n        dfs(row, col);\n      }\n    }\n  }\n\n  return islands;\n}","typescript":"function numIslands(grid: string[][]): number {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  let islands = 0;\n\n  const dfs = (row: number, col: number) => {\n    if (row < 0 || col < 0 || row >= rows || col >= cols || grid[row][col] !== \"1\") {\n      return;\n    }\n\n    grid[row][col] = \"0\";\n    dfs(row + 1, col);\n    dfs(row - 1, col);\n    dfs(row, col + 1);\n    dfs(row, col - 1);\n  };\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === \"1\") {\n        islands += 1;\n        dfs(row, col);\n      }\n    }\n  }\n\n  return islands;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["m == grid.length","n == grid[i].length","1 <= m, n <= 300"]'::jsonb, '[{"input":"grid = [[\"1\",\"1\",\"0\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]","output":"3"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Graph' FROM public.problems WHERE slug = 'number-of-islands'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'DFS' FROM public.problems WHERE slug = 'number-of-islands'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Matrix' FROM public.problems WHERE slug = 'number-of-islands'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('rotting-oranges', 'Rotting Oranges', 'Medium', 'You are given an m x n grid where each cell can have one of three values: 0 for empty, 1 for a fresh orange, or 2 for a rotten orange. Return the minimum number of minutes until no cell has a fresh orange.', '{"javascript":"function orangesRotting(grid: number[][]): number {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  const queue: Array<[number, number, number]> = [];\n  let fresh = 0;\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === 2) queue.push([row, col, 0]);\n      if (grid[row][col] === 1) fresh += 1;\n    }\n  }\n\n  let minutes = 0;\n  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n\n  while (queue.length > 0) {\n    const [row, col, time] = queue.shift()!;\n    minutes = Math.max(minutes, time);\n\n    for (const [rowOffset, colOffset] of directions) {\n      const nextRow = row + rowOffset;\n      const nextCol = col + colOffset;\n      if (nextRow < 0 || nextCol < 0 || nextRow >= rows || nextCol >= cols || grid[nextRow][nextCol] !== 1) {\n        continue;\n      }\n\n      grid[nextRow][nextCol] = 2;\n      fresh -= 1;\n      queue.push([nextRow, nextCol, time + 1]);\n    }\n  }\n\n  return fresh === 0 ? minutes : -1;\n}","typescript":"function orangesRotting(grid: number[][]): number {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  const queue: Array<[number, number, number]> = [];\n  let fresh = 0;\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === 2) queue.push([row, col, 0]);\n      if (grid[row][col] === 1) fresh += 1;\n    }\n  }\n\n  let minutes = 0;\n  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n\n  while (queue.length > 0) {\n    const [row, col, time] = queue.shift()!;\n    minutes = Math.max(minutes, time);\n\n    for (const [rowOffset, colOffset] of directions) {\n      const nextRow = row + rowOffset;\n      const nextCol = col + colOffset;\n      if (nextRow < 0 || nextCol < 0 || nextRow >= rows || nextCol >= cols || grid[nextRow][nextCol] !== 1) {\n        continue;\n      }\n\n      grid[nextRow][nextCol] = 2;\n      fresh -= 1;\n      queue.push([nextRow, nextCol, time + 1]);\n    }\n  }\n\n  return fresh === 0 ? minutes : -1;\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["m == grid.length","n == grid[i].length","1 <= m, n <= 10"]'::jsonb, '[{"input":"grid = [[2,1,1],[1,1,0],[0,1,1]]","output":"4"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Graph' FROM public.problems WHERE slug = 'rotting-oranges'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'BFS' FROM public.problems WHERE slug = 'rotting-oranges'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Matrix' FROM public.problems WHERE slug = 'rotting-oranges'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Queue' FROM public.problems WHERE slug = 'rotting-oranges'
ON CONFLICT (problem_id, tag) DO NOTHING;

INSERT INTO public.problems (slug, title, difficulty, description_md, starter_code, constraints, examples, status)
VALUES ('median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'Hard', 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.', '{"javascript":"function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n  const merged = [...nums1, ...nums2].sort((a, b) => a - b);\n  const middle = Math.floor(merged.length / 2);\n\n  if (merged.length % 2 === 0) {\n    return (merged[middle - 1] + merged[middle]) / 2;\n  }\n\n  return merged[middle];\n}","typescript":"function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n  const merged = [...nums1, ...nums2].sort((a, b) => a - b);\n  const middle = Math.floor(merged.length / 2);\n\n  if (merged.length % 2 === 0) {\n    return (merged[middle - 1] + merged[middle]) / 2;\n  }\n\n  return merged[middle];\n}","python":"# Write your solution here\n","cpp":"// Write your solution here\n","java":"// Write your solution here\n"}'::jsonb, '["nums1.length == m","nums2.length == n","The overall run time complexity should be O(log (m+n))."]'::jsonb, '[{"input":"nums1 = [1,3], nums2 = [2]","output":"2.00000"}]'::jsonb, 'published')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  description_md = EXCLUDED.description_md,
  starter_code = EXCLUDED.starter_code,
  constraints = EXCLUDED.constraints,
  examples = EXCLUDED.examples,
  status = 'published',
  updated_at = timezone('utc', now());

INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Array' FROM public.problems WHERE slug = 'median-of-two-sorted-arrays'
ON CONFLICT (problem_id, tag) DO NOTHING;
INSERT INTO public.problem_tags (problem_id, tag)
SELECT id, 'Binary Search' FROM public.problems WHERE slug = 'median-of-two-sorted-arrays'
ON CONFLICT (problem_id, tag) DO NOTHING;

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

-- ==========================================================================
-- 0004_tenancy_and_dpdp.sql: Multi-Tenancy, Contests & DPDP Compliance
-- ==========================================================================

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

create table if not exists public.proctor_events (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in ('tab_blur', 'fullscreen_exit', 'paste_detected', 'devtools_opened')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

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

create index if not exists idx_tenants_slug on public.tenants(slug);
create index if not exists idx_tenant_memberships_user on public.tenant_memberships(user_id);
create index if not exists idx_tenant_memberships_tenant on public.tenant_memberships(tenant_id, batch_year);
create index if not exists idx_contests_tenant on public.contests(tenant_id);
create index if not exists idx_contests_slug on public.contests(slug);
create index if not exists idx_proctor_events_lookup on public.proctor_events(contest_id, user_id);
create index if not exists idx_proctor_events_occurred on public.proctor_events(occurred_at desc);
create index if not exists idx_dpdp_consent_user on public.dpdp_consent_logs(user_id);

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.contests enable row level security;
alter table public.proctor_events enable row level security;
alter table public.dpdp_consent_logs enable row level security;

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

