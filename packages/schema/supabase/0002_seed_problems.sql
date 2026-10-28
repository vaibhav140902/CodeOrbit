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

