#!/usr/bin/env node
/**
 * CodeOrbit Phase 3: Automated Problem Suite & Reference Runner
 * Verifies all 14 Monaco IDE problems against server-side canonical test suites.
 */

import { spawnSync } from "child_process";
import { CANONICAL_TEST_SUITES } from "../apps/web/src/lib/server/problem-test-suites.ts";

const REFERENCE_SOLUTIONS = {
  "two-sum": `
import sys

def solve(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        comp = target - x
        if comp in seen:
            return [seen[comp], i]
        seen[x] = i
    return []

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    target = int(lines[1]) if len(lines) > 1 else 0
    ans = solve(nums, target)
    print(" ".join(map(str, ans)))
`,

  "reverse-string": `
import sys

def solve(text):
    return text[::-1]

if __name__ == "__main__":
    text = sys.stdin.read().strip()
    print(solve(text))
`,

  "valid-parentheses": `
import sys

def solve(text):
    pairs = {')': '(', '}': '{', ']': '['}
    stack = []
    for c in text:
        if c in "({[":
            stack.append(c)
        elif c in pairs:
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
    return len(stack) == 0

if __name__ == "__main__":
    text = sys.stdin.read().strip()
    print(str(solve(text)).lower())
`,

  "merge-intervals": `
import sys

def solve(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for cur in intervals[1:]:
        prev = merged[-1]
        if cur[0] <= prev[1]:
            merged[-1] = (prev[0], max(prev[1], cur[1]))
        else:
            merged.append(cur)
    return merged

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    n = int(lines[0]) if lines else 0
    intervals = []
    for i in range(1, n + 1):
        s, e = map(int, lines[i].split())
        intervals.append((s, e))
    ans = solve(intervals)
    print("\\n".join(f"{s} {e}" for s, e in ans))
`,

  "binary-search": `
import sys

def solve(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    target = int(lines[1]) if len(lines) > 1 else 0
    print(solve(nums, target))
`,

  "number-of-islands": `
import sys

def solve(grid):
    if not grid or not grid[0]:
        return 0
    R, C = len(grid), len(grid[0])
    g = [list(row) for row in grid]
    ans = 0
    for r in range(R):
        for c in range(C):
            if g[r][c] == '1':
                ans += 1
                q = [(r, c)]
                g[r][c] = '0'
                while q:
                    cr, cc = q.pop()
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < R and 0 <= nc < C and g[nr][nc] == '1':
                            g[nr][nc] = '0'
                            q.append((nr, nc))
    return ans

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    first = list(map(int, lines[0].split())) if lines else [0, 0]
    rows = first[0] if first else 0
    grid = [lines[i].strip() for i in range(1, rows + 1)]
    print(solve(grid))
`,

  "valid-anagram": `
import sys

def solve(s, t):
    return sorted(s) == sorted(t)

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    s = lines[0] if lines else ""
    t = lines[1] if len(lines) > 1 else ""
    print(str(solve(s, t)).lower())
`,

  "maximum-subarray": `
import sys

def solve(nums):
    if not nums:
        return 0
    max_so_far = curr = nums[0]
    for x in nums[1:]:
        curr = max(x, curr + x)
        max_so_far = max(max_so_far, curr)
    return max_so_far

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    nums = list(map(int, raw.split())) if raw else []
    print(solve(nums))
`,

  "longest-substring-without-repeating-characters": `
import sys

def solve(text):
    seen = {}
    start = max_len = 0
    for i, c in enumerate(text):
        if c in seen and seen[c] >= start:
            start = seen[c] + 1
        seen[c] = i
        max_len = max(max_len, i - start + 1)
    return max_len

if __name__ == "__main__":
    text = sys.stdin.read().strip()
    print(solve(text))
`,

  "product-of-array-except-self": `
import sys

def solve(nums):
    n = len(nums)
    res = [1] * n
    prefix = 1
    for i in range(n):
        res[i] = prefix
        prefix *= nums[i]
    postfix = 1
    for i in range(n - 1, -1, -1):
        res[i] *= postfix
        postfix *= nums[i]
    return res

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    nums = list(map(int, raw.split())) if raw else []
    print(" ".join(map(str, solve(nums))))
`,

  "search-in-rotated-sorted-array": `
import sys

def solve(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    target = int(lines[1]) if len(lines) > 1 else 0
    print(solve(nums, target))
`,

  "top-k-frequent-elements": `
import sys
from collections import Counter

def solve(nums, k):
    counts = Counter(nums)
    most_common = counts.most_common(k)
    return [num for num, _ in most_common]

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    k = int(lines[1]) if len(lines) > 1 else 0
    print(" ".join(map(str, solve(nums, k))))
`,

  "rotting-oranges": `
import sys
from collections import deque

def solve(grid):
    if not grid or not grid[0]:
        return 0
    R, C = len(grid), len(grid[0])
    q = deque()
    fresh = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == 2:
                q.append((r, c, 0))
            elif grid[r][c] == 1:
                fresh += 1
    if fresh == 0:
        return 0
    minutes = 0
    while q:
        r, c, m = q.popleft()
        minutes = m
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 1:
                grid[nr][nc] = 2
                fresh -= 1
                q.append((nr, nc, m + 1))
    return minutes if fresh == 0 else -1

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    first = list(map(int, lines[0].split())) if lines else [0, 0]
    rows = first[0] if first else 0
    grid = [list(map(int, lines[index].split())) for index in range(1, rows + 1)]
    print(solve(grid))
`,

  "median-of-two-sorted-arrays": `
import sys

def solve(nums1, nums2):
    merged = sorted(nums1 + nums2)
    n = len(merged)
    if n == 0:
        return 0
    if n % 2 == 1:
        return merged[n // 2]
    mid = (merged[n // 2 - 1] + merged[n // 2]) / 2.0
    return int(mid) if mid.is_integer() else mid

if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums1 = list(map(int, lines[0].split())) if lines and lines[0].strip() else []
    nums2 = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []
    print(solve(nums1, nums2))
`,
};

console.log("=".repeat(70));
console.log("  CODEORBIT PHASE 3: ALL 14 PROBLEMS AUTOMATED SUITE VERIFICATION");
console.log("=".repeat(70));

let passCount = 0;
let failCount = 0;

for (const [problemId, testCases] of Object.entries(CANONICAL_TEST_SUITES)) {
  const code = REFERENCE_SOLUTIONS[problemId];
  if (!code) {
    console.error(`❌ [FAIL] Missing reference solution for ${problemId}`);
    failCount++;
    continue;
  }

  let problemPassed = true;
  for (const tc of testCases) {
    const result = spawnSync("python3", ["-c", code], {
      input: tc.stdin,
      encoding: "utf-8",
      timeout: 3000,
    });

    if (result.error || result.status !== 0) {
      console.error(`❌ [FAIL] ${problemId} [${tc.name}]: Execution error ->`, result.stderr || result.error);
      problemPassed = false;
      break;
    }

    const actual = (result.stdout || "").trim();
    const expected = tc.expectedOutput.trim();

    if (actual !== expected) {
      console.error(`❌ [FAIL] ${problemId} [${tc.name}]: expected "${expected}", got "${actual}"`);
      problemPassed = false;
      break;
    }
  }

  if (problemPassed) {
    console.log(`  ✅ [PASS] ${problemId.padEnd(46)} (${testCases.length} test cases passed)`);
    passCount++;
  } else {
    failCount++;
  }
}

console.log("=".repeat(70));
if (failCount === 0) {
  console.log(`🎉 100% PASS: All ${passCount} problem test suites passed reference execution!`);
  console.log("=".repeat(70));
  process.exit(0);
} else {
  console.error(`❌ FAILED: ${failCount} problems failed test suite verification.`);
  console.log("=".repeat(70));
  process.exit(1);
}
