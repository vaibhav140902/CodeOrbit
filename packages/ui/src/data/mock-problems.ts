export type Difficulty = "Easy" | "Medium" | "Hard";

export interface MockProblem {
  id: string;
  problemName: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starterCode: string;
}

export const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

export const difficultyBadgeClass: Record<Difficulty, string> = {
  Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Hard: "border-rose-500/30 bg-rose-500/10 text-rose-500",
};

export const mockProblems: MockProblem[] = [
  {
    id: "two-sum",
    problemName: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Map"],
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "nums[0] + nums[1] == 9, so return [0, 1].",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "Exactly one valid answer exists.",
    ],
    starterCode: `function twoSum(nums: number[], target: number): number[] {\n  const seen = new Map<number, number>();\n\n  for (let index = 0; index < nums.length; index += 1) {\n    const complement = target - nums[index];\n    if (seen.has(complement)) {\n      return [seen.get(complement)!, index];\n    }\n    seen.set(nums[index], index);\n  }\n\n  return [];\n}`,
  },
  {
    id: "reverse-string",
    problemName: "Reverse String",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"],
    description:
      "Write a function that reverses a string. The input string is given as an array of characters s.",
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
      },
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character.",
    ],
    starterCode: `function reverseString(s: string[]): void {\n  let left = 0;\n  let right = s.length - 1;\n\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left += 1;\n    right -= 1;\n  }\n}`,
  },
  {
    id: "valid-parentheses",
    problemName: "Valid Parentheses",
    difficulty: "Easy",
    tags: ["Stack", "String"],
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      {
        input: 's = "()[]{}"',
        output: "true",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only.",
    ],
    starterCode: `function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs = new Map<string, string>([\n    [")", "("],\n    ["]", "["],\n    ["}", "{"],\n  ]);\n\n  for (const char of s) {\n    if (!pairs.has(char)) {\n      stack.push(char);\n      continue;\n    }\n\n    if (stack.pop() !== pairs.get(char)) {\n      return false;\n    }\n  }\n\n  return stack.length === 0;\n}`,
  },
  {
    id: "binary-search",
    problemName: "Binary Search",
    difficulty: "Easy",
    tags: ["Array", "Binary Search"],
    description:
      "Given an array of integers nums sorted in ascending order and an integer target, return the index of target if it exists.",
    examples: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        output: "4",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^4",
      "nums is sorted in ascending order.",
    ],
    starterCode: `function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (nums[middle] === target) return middle;\n    if (nums[middle] < target) {\n      left = middle + 1;\n    } else {\n      right = middle - 1;\n    }\n  }\n\n  return -1;\n}`,
  },
  {
    id: "valid-anagram",
    problemName: "Valid Anagram",
    difficulty: "Easy",
    tags: ["String", "Hash Map"],
    description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    examples: [
      {
        input: 's = "anagram", t = "nagaram"',
        output: "true",
      },
    ],
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters.",
    ],
    starterCode: `function isAnagram(s: string, t: string): boolean {\n  if (s.length !== t.length) return false;\n\n  const counts = new Map<string, number>();\n  for (const char of s) {\n    counts.set(char, (counts.get(char) ?? 0) + 1);\n  }\n\n  for (const char of t) {\n    const next = (counts.get(char) ?? 0) - 1;\n    if (next < 0) return false;\n    counts.set(char, next);\n  }\n\n  return Array.from(counts.values()).every((value) => value === 0);\n}`,
  },
  {
    id: "maximum-subarray",
    problemName: "Maximum Subarray",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "Kadane"],
    description:
      "Given an integer array nums, find the contiguous subarray with the largest sum and return its sum.",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "[4,-1,2,1] has the largest sum = 6.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
    starterCode: `function maxSubArray(nums: number[]): number {\n  let best = nums[0];\n  let current = nums[0];\n\n  for (let index = 1; index < nums.length; index += 1) {\n    current = Math.max(nums[index], current + nums[index]);\n    best = Math.max(best, current);\n  }\n\n  return best;\n}`,
  },
  {
    id: "longest-substring-without-repeating-characters",
    problemName: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    tags: ["String", "Sliding Window", "Hash Map"],
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.',
      },
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    starterCode: `function lengthOfLongestSubstring(s: string): number {\n  const lastSeen = new Map<string, number>();\n  let left = 0;\n  let best = 0;\n\n  for (let right = 0; right < s.length; right += 1) {\n    const previous = lastSeen.get(s[right]);\n    if (previous !== undefined && previous >= left) {\n      left = previous + 1;\n    }\n    lastSeen.set(s[right], right);\n    best = Math.max(best, right - left + 1);\n  }\n\n  return best;\n}`,
  },
  {
    id: "product-of-array-except-self",
    problemName: "Product of Array Except Self",
    difficulty: "Medium",
    tags: ["Array", "Prefix Sum"],
    description:
      "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
    examples: [
      {
        input: "nums = [1,2,3,4]",
        output: "[24,12,8,6]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^5",
      "-30 <= nums[i] <= 30",
      "The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.",
    ],
    starterCode: `function productExceptSelf(nums: number[]): number[] {\n  const answer = new Array<number>(nums.length).fill(1);\n  let prefix = 1;\n\n  for (let index = 0; index < nums.length; index += 1) {\n    answer[index] = prefix;\n    prefix *= nums[index];\n  }\n\n  let suffix = 1;\n  for (let index = nums.length - 1; index >= 0; index -= 1) {\n    answer[index] *= suffix;\n    suffix *= nums[index];\n  }\n\n  return answer;\n}`,
  },
  {
    id: "merge-intervals",
    problemName: "Merge Intervals",
    difficulty: "Medium",
    tags: ["Array", "Sorting"],
    description:
      "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
    ],
    starterCode: `function merge(intervals: number[][]): number[][] {\n  if (intervals.length <= 1) return intervals;\n\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged: number[][] = [intervals[0]];\n\n  for (const interval of intervals.slice(1)) {\n    const last = merged[merged.length - 1];\n    if (interval[0] <= last[1]) {\n      last[1] = Math.max(last[1], interval[1]);\n      continue;\n    }\n    merged.push(interval);\n  }\n\n  return merged;\n}`,
  },
  {
    id: "search-in-rotated-sorted-array",
    problemName: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    tags: ["Array", "Binary Search"],
    description:
      "There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is rotated. Return the index of target if it is in nums, or -1 otherwise.",
    examples: [
      {
        input: "nums = [4,5,6,7,0,1,2], target = 0",
        output: "4",
      },
    ],
    constraints: [
      "1 <= nums.length <= 5000",
      "-10^4 <= nums[i], target <= 10^4",
      "All values of nums are unique.",
    ],
    starterCode: `function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (nums[middle] === target) return middle;\n\n    if (nums[left] <= nums[middle]) {\n      if (nums[left] <= target && target < nums[middle]) {\n        right = middle - 1;\n      } else {\n        left = middle + 1;\n      }\n    } else if (nums[middle] < target && target <= nums[right]) {\n      left = middle + 1;\n    } else {\n      right = middle - 1;\n    }\n  }\n\n  return -1;\n}`,
  },
  {
    id: "top-k-frequent-elements",
    problemName: "Top K Frequent Elements",
    difficulty: "Medium",
    tags: ["Array", "Hash Map", "Heap"],
    description:
      "Given an integer array nums and an integer k, return the k most frequent elements.",
    examples: [
      {
        input: "nums = [1,1,1,2,2,3], k = 2",
        output: "[1,2]",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "k is in the range [1, number of unique elements in the array].",
      "It is guaranteed that the answer is unique.",
    ],
    starterCode: `function topKFrequent(nums: number[], k: number): number[] {\n  const counts = new Map<number, number>();\n  for (const num of nums) {\n    counts.set(num, (counts.get(num) ?? 0) + 1);\n  }\n\n  return [...counts.entries()]\n    .sort((left, right) => right[1] - left[1])\n    .slice(0, k)\n    .map(([value]) => value);\n}`,
  },
  {
    id: "number-of-islands",
    problemName: "Number of Islands",
    difficulty: "Medium",
    tags: ["Graph", "DFS", "Matrix"],
    description:
      "Given an m x n 2D binary grid grid which represents a map of '1's and '0's, return the number of islands.",
    examples: [
      {
        input: 'grid = [["1","1","0"],["0","1","0"],["1","0","1"]]',
        output: "3",
      },
    ],
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
    ],
    starterCode: `function numIslands(grid: string[][]): number {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  let islands = 0;\n\n  const dfs = (row: number, col: number) => {\n    if (row < 0 || col < 0 || row >= rows || col >= cols || grid[row][col] !== "1") {\n      return;\n    }\n\n    grid[row][col] = "0";\n    dfs(row + 1, col);\n    dfs(row - 1, col);\n    dfs(row, col + 1);\n    dfs(row, col - 1);\n  };\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === "1") {\n        islands += 1;\n        dfs(row, col);\n      }\n    }\n  }\n\n  return islands;\n}`,
  },
  {
    id: "rotting-oranges",
    problemName: "Rotting Oranges",
    difficulty: "Medium",
    tags: ["Graph", "BFS", "Matrix", "Queue"],
    description:
      "You are given an m x n grid where each cell can have one of three values: 0 for empty, 1 for a fresh orange, or 2 for a rotten orange. Return the minimum number of minutes until no cell has a fresh orange.",
    examples: [
      {
        input: "grid = [[2,1,1],[1,1,0],[0,1,1]]",
        output: "4",
      },
    ],
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 10",
    ],
    starterCode: `function orangesRotting(grid: number[][]): number {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  const queue: Array<[number, number, number]> = [];\n  let fresh = 0;\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === 2) queue.push([row, col, 0]);\n      if (grid[row][col] === 1) fresh += 1;\n    }\n  }\n\n  let minutes = 0;\n  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n\n  while (queue.length > 0) {\n    const [row, col, time] = queue.shift()!;\n    minutes = Math.max(minutes, time);\n\n    for (const [rowOffset, colOffset] of directions) {\n      const nextRow = row + rowOffset;\n      const nextCol = col + colOffset;\n      if (nextRow < 0 || nextCol < 0 || nextRow >= rows || nextCol >= cols || grid[nextRow][nextCol] !== 1) {\n        continue;\n      }\n\n      grid[nextRow][nextCol] = 2;\n      fresh -= 1;\n      queue.push([nextRow, nextCol, time + 1]);\n    }\n  }\n\n  return fresh === 0 ? minutes : -1;\n}`,
  },
  {
    id: "median-of-two-sorted-arrays",
    problemName: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    tags: ["Array", "Binary Search"],
    description:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
      },
    ],
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "The overall run time complexity should be O(log (m+n)).",
    ],
    starterCode: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n  const merged = [...nums1, ...nums2].sort((a, b) => a - b);\n  const middle = Math.floor(merged.length / 2);\n\n  if (merged.length % 2 === 0) {\n    return (merged[middle - 1] + merged[middle]) / 2;\n  }\n\n  return merged[middle];\n}`,
  },
];

export const getProblemById = (problemId: string) =>
  mockProblems.find((problem) => problem.id === problemId) ?? null;
