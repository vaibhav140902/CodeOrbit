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
  {
    id: "best-time-to-buy-and-sell-stock",
    problemName: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    tags: ["Array","Dynamic Programming","amazon","google","microsoft"],
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    examples: [
      {
            "input": "7 1 5 3 6 4",
            "output": "5",
            "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
      }
],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
],
    starterCode: "function maxProfit(prices: number[]): number {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else if (price - minPrice > maxProfit) maxProfit = price - minPrice;\n  }\n  return maxProfit;\n}",
  },
  {
    id: "contains-duplicate",
    problemName: "Contains Duplicate",
    difficulty: "Easy",
    tags: ["Array","Hash Map","amazon","google","microsoft"],
    description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    examples: [
      {
            "input": "1 2 3 1",
            "output": "true"
      }
],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9"
],
    starterCode: "function containsDuplicate(nums: number[]): boolean {\n  return new Set(nums).size < nums.length;\n}",
  },
  {
    id: "group-anagrams",
    problemName: "Group Anagrams",
    difficulty: "Medium",
    tags: ["Array","Hash Map","String","amazon","google","microsoft"],
    description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    examples: [
      {
            "input": "eat tea tan ate nat bat",
            "output": "ate eat tea\nbat\nnat tan"
      }
],
    constraints: [
      "1 <= strs.length <= 10^4",
      "0 <= strs[i].length <= 100",
      "strs[i] consists of lowercase English letters."
],
    starterCode: "function groupAnagrams(strs: string[]): string[][] {\n  const map = new Map<string, string[]>();\n  for (const s of strs) {\n    const key = s.split('').sort().join('');\n    if (!map.has(key)) map.set(key, []);\n    map.get(key)!.push(s);\n  }\n  return Array.from(map.values());\n}",
  },
  {
    id: "encode-and-decode-strings",
    problemName: "Encode and Decode Strings",
    difficulty: "Medium",
    tags: ["Array","String","Design","amazon","google","microsoft"],
    description: "Design an algorithm to encode a list of strings to a string. The encoded string is then sent over the network and is decoded back to the original list of strings.",
    examples: [
      {
            "input": "lint code love you",
            "output": "lint code love you"
      }
],
    constraints: [
      "0 <= strs.length <= 200",
      "0 <= strs[i].length <= 200"
],
    starterCode: "function encode(strs: string[]): string {\n  return strs.map(s => s.length + '#' + s).join('');\n}\n\nfunction decode(s: string): string[] {\n  const res: string[] = [];\n  let i = 0;\n  while (i < s.length) {\n    const hash = s.indexOf('#', i);\n    const len = parseInt(s.slice(i, hash), 10);\n    res.push(s.slice(hash + 1, hash + 1 + len));\n    i = hash + 1 + len;\n  }\n  return res;\n}",
  },
  {
    id: "majority-element",
    problemName: "Majority Element",
    difficulty: "Easy",
    tags: ["Array","Hash Map","Divide and Conquer","amazon","google","microsoft"],
    description: "Given an array nums of size n, return the majority element. The majority element is the element that appears more than ⌊n / 2⌋ times.",
    examples: [
      {
            "input": "3 2 3",
            "output": "3"
      }
],
    constraints: [
      "n == nums.length",
      "1 <= n <= 5 * 10^4",
      "-10^9 <= nums[i] <= 10^9"
],
    starterCode: "function majorityElement(nums: number[]): number {\n  let count = 0;\n  let candidate = 0;\n  for (const num of nums) {\n    if (count === 0) candidate = num;\n    count += (num === candidate) ? 1 : -1;\n  }\n  return candidate;\n}",
  },
  {
    id: "3sum",
    problemName: "3Sum",
    difficulty: "Medium",
    tags: ["Array","Two Pointers","Sorting","amazon","google","meta"],
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
    examples: [
      {
            "input": "-1 0 1 2 -1 -4",
            "output": "-1 -1 2\n-1 0 1"
      }
],
    constraints: [
      "3 <= nums.length <= 3000",
      "-10^5 <= nums[i] <= 10^5"
],
    starterCode: "function threeSum(nums: number[]): number[][] {\n  nums.sort((a, b) => a - b);\n  const res: number[][] = [];\n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    let l = i + 1, r = nums.length - 1;\n    while (l < r) {\n      const s = nums[i] + nums[l] + nums[r];\n      if (s === 0) {\n        res.push([nums[i], nums[l], nums[r]]);\n        while (l < r && nums[l] === nums[l + 1]) l++;\n        while (l < r && nums[r] === nums[r - 1]) r--;\n        l++; r--;\n      } else if (s < 0) l++;\n      else r--;\n    }\n  }\n  return res;\n}",
  },
  {
    id: "container-with-most-water",
    problemName: "Container With Most Water",
    difficulty: "Medium",
    tags: ["Array","Two Pointers","Greedy","amazon","google","meta"],
    description: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
    examples: [
      {
            "input": "1 8 6 2 5 4 8 3 7",
            "output": "49"
      }
],
    constraints: [
      "n == height.length",
      "2 <= n <= 10^5",
      "0 <= height[i] <= 10^4"
],
    starterCode: "function maxArea(height: number[]): number {\n  let left = 0, right = height.length - 1, max = 0;\n  while (left < right) {\n    const w = right - left;\n    const h = Math.min(height[left], height[right]);\n    max = Math.max(max, w * h);\n    if (height[left] < height[right]) left++;\n    else right--;\n  }\n  return max;\n}",
  },
  {
    id: "trapping-rain-water",
    problemName: "Trapping Rain Water",
    difficulty: "Hard",
    tags: ["Array","Two Pointers","Dynamic Programming","amazon","google","meta"],
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    examples: [
      {
            "input": "0 1 0 2 1 0 1 3 2 1 2 1",
            "output": "6"
      }
],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5"
],
    starterCode: "function trap(height: number[]): number {\n  let l = 0, r = height.length - 1;\n  let leftMax = 0, rightMax = 0, total = 0;\n  while (l < r) {\n    if (height[l] < height[r]) {\n      if (height[l] >= leftMax) leftMax = height[l];\n      else total += leftMax - height[l];\n      l++;\n    } else {\n      if (height[r] >= rightMax) rightMax = height[r];\n      else total += rightMax - height[r];\n      r--;\n    }\n  }\n  return total;\n}",
  },
  {
    id: "valid-palindrome",
    problemName: "Valid Palindrome",
    difficulty: "Easy",
    tags: ["Two Pointers","String","amazon","google","meta"],
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    examples: [
      {
            "input": "A man, a plan, a canal: Panama",
            "output": "true"
      }
],
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters."
],
    starterCode: "function isPalindrome(s: string): boolean {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  let l = 0, r = clean.length - 1;\n  while (l < r) {\n    if (clean[l] !== clean[r]) return false;\n    l++; r--;\n  }\n  return true;\n}",
  },
  {
    id: "minimum-window-substring",
    problemName: "Minimum Window Substring",
    difficulty: "Hard",
    tags: ["Hash Map","String","Sliding Window","google","microsoft"],
    description: "Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string \"\".",
    examples: [
      {
            "input": "ADOBECODEBANC\nABC",
            "output": "BANC"
      }
],
    constraints: [
      "m == s.length",
      "n == t.length",
      "1 <= m, n <= 10^5"
],
    starterCode: "function minWindow(s: string, t: string): string {\n  if (!s || !t) return \"\";\n  const tCount = new Map<string, number>();\n  for (const c of t) tCount.set(c, (tCount.get(c) || 0) + 1);\n  let left = 0, match = 0, minLen = Infinity, start = 0;\n  const window = new Map<string, number>();\n  for (let right = 0; right < s.length; right++) {\n    const c = s[right];\n    if (tCount.has(c)) {\n      window.set(c, (window.get(c) || 0) + 1);\n      if (window.get(c) === tCount.get(c)) match++;\n    }\n    while (match === tCount.size) {\n      if (right - left + 1 < minLen) {\n        minLen = right - left + 1;\n        start = left;\n      }\n      const lc = s[left];\n      if (tCount.has(lc)) {\n        if (window.get(lc) === tCount.get(lc)) match--;\n        window.set(lc, window.get(lc)! - 1);\n      }\n      left++;\n    }\n  }\n  return minLen === Infinity ? \"\" : s.substring(start, start + minLen);\n}",
  },
  {
    id: "longest-repeating-character-replacement",
    problemName: "Longest Repeating Character Replacement",
    difficulty: "Medium",
    tags: ["Hash Map","String","Sliding Window","google","microsoft"],
    description: "You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times. Return the length of the longest substring containing the same letter you can get after performing the operations.",
    examples: [
      {
            "input": "ABAB\n2",
            "output": "4"
      }
],
    constraints: [
      "1 <= s.length <= 10^5",
      "s consists of only uppercase English letters.",
      "0 <= k <= s.length"
],
    starterCode: "function characterReplacement(s: string, k: number): number {\n  const count = new Array(26).fill(0);\n  let left = 0, maxCount = 0, maxLen = 0;\n  for (let right = 0; right < s.length; right++) {\n    const idx = s.charCodeAt(right) - 65;\n    count[idx]++;\n    maxCount = Math.max(maxCount, count[idx]);\n    while (right - left + 1 - maxCount > k) {\n      count[s.charCodeAt(left) - 65]--;\n      left++;\n    }\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}",
  },
  {
    id: "permutation-in-string",
    problemName: "Permutation in String",
    difficulty: "Medium",
    tags: ["Hash Map","Two Pointers","String","Sliding Window","google","microsoft"],
    description: "Given two strings s1 and s2, return true if s2 contains a permutation of s1, or false otherwise.",
    examples: [
      {
            "input": "ab\neidbaooo",
            "output": "true"
      }
],
    constraints: [
      "1 <= s1.length, s2.length <= 10^4",
      "s1 and s2 consist of lowercase English letters."
],
    starterCode: "function checkInclusion(s1: string, s2: string): boolean {\n  if (s1.length > s2.length) return false;\n  const c1 = new Array(26).fill(0), c2 = new Array(26).fill(0);\n  for (let i = 0; i < s1.length; i++) {\n    c1[s1.charCodeAt(i) - 97]++;\n    c2[s2.charCodeAt(i) - 97]++;\n  }\n  const match = () => c1.every((v, i) => v === c2[i]);\n  if (match()) return true;\n  for (let i = s1.length; i < s2.length; i++) {\n    c2[s2.charCodeAt(i) - 97]++;\n    c2[s2.charCodeAt(i - s1.length) - 97]--;\n    if (match()) return true;\n  }\n  return false;\n}",
  },
  {
    id: "daily-temperatures",
    problemName: "Daily Temperatures",
    difficulty: "Medium",
    tags: ["Array","Stack","Monotonic Stack","amazon","tcs-digital"],
    description: "Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0 instead.",
    examples: [
      {
            "input": "73 74 75 71 69 72 76 73",
            "output": "1 1 4 2 1 1 0 0"
      }
],
    constraints: [
      "1 <= temperatures.length <= 10^5",
      "30 <= temperatures[i] <= 100"
],
    starterCode: "function dailyTemperatures(temperatures: number[]): number[] {\n  const n = temperatures.length;\n  const res = new Array(n).fill(0);\n  const stack: number[] = [];\n  for (let i = 0; i < n; i++) {\n    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {\n      const prev = stack.pop()!;\n      res[prev] = i - prev;\n    }\n    stack.push(i);\n  }\n  return res;\n}",
  },
  {
    id: "car-fleet",
    problemName: "Car Fleet",
    difficulty: "Medium",
    tags: ["Array","Stack","Sorting","amazon","tcs-digital"],
    description: "There are n cars at given miles away from the starting mile 0, traveling to target miles. You are given target, position, and speed. A car can never pass another car ahead of it, but it can catch up to it and drive bumper to bumper. A car fleet is some non-empty set of cars driving at the same speed. Return the number of car fleets that will arrive at the destination.",
    examples: [
      {
            "input": "12\n10 8 0 5 3\n2 4 1 1 3",
            "output": "3"
      }
],
    constraints: [
      "n == position.length == speed.length",
      "1 <= n <= 10^5",
      "0 < target <= 10^6",
      "0 <= position[i] < target"
],
    starterCode: "function carFleet(target: number, position: number[], speed: number[]): number {\n  const pair = position.map((p, i) => [p, speed[i]]).sort((a, b) => b[0] - a[0]);\n  const stack: number[] = [];\n  for (const [p, s] of pair) {\n    const time = (target - p) / s;\n    if (!stack.length || time > stack[stack.length - 1]) {\n      stack.push(time);\n    }\n  }\n  return stack.length;\n}",
  },
  {
    id: "largest-rectangle-in-histogram",
    problemName: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    tags: ["Array","Stack","Monotonic Stack","amazon","tcs-digital"],
    description: "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
    examples: [
      {
            "input": "2 1 5 6 2 3",
            "output": "10"
      }
],
    constraints: [
      "1 <= heights.length <= 10^5",
      "0 <= heights[i] <= 10^4"
],
    starterCode: "function largestRectangleArea(heights: number[]): number {\n  const stack: number[] = [];\n  let maxArea = 0;\n  const h = [...heights, 0];\n  for (let i = 0; i < h.length; i++) {\n    while (stack.length && h[i] < h[stack[stack.length - 1]]) {\n      const height = h[stack.pop()!];\n      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;\n      maxArea = Math.max(maxArea, height * width);\n    }\n    stack.push(i);\n  }\n  return maxArea;\n}",
  },
  {
    id: "koko-eating-bananas",
    problemName: "Koko Eating Bananas",
    difficulty: "Medium",
    tags: ["Array","Binary Search","amazon","google"],
    description: "Koko loves to eat bananas. There are n piles of bananas, the ith pile has piles[i] bananas. She can decide her bananas-per-hour eating speed of k. Each hour, she chooses some pile and eats k bananas from it. Return the minimum integer k such that she can eat all the bananas within h hours.",
    examples: [
      {
            "input": "3 6 7 11\n8",
            "output": "4"
      }
],
    constraints: [
      "1 <= piles.length <= 10^4",
      "piles.length <= h <= 10^9",
      "1 <= piles[i] <= 10^9"
],
    starterCode: "function minEatingSpeed(piles: number[], h: number): number {\n  let left = 1, right = Math.max(...piles);\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    const hours = piles.reduce((acc, p) => acc + Math.ceil(p / mid), 0);\n    if (hours <= h) right = mid;\n    else left = mid + 1;\n  }\n  return left;\n}",
  },
  {
    id: "search-a-2d-matrix",
    problemName: "Search a 2D Matrix",
    difficulty: "Medium",
    tags: ["Array","Binary Search","Matrix","amazon","google"],
    description: "You are given an m x n integer matrix with the following two properties: each row is sorted in non-decreasing order, and the first integer of each row is greater than the last integer of the previous row. Given an integer target, return true if target is in matrix or false otherwise.",
    examples: [
      {
            "input": "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3",
            "output": "true"
      }
],
    constraints: [
      "m == matrix.length",
      "n == matrix[i].length",
      "1 <= m, n <= 100",
      "-10^4 <= matrix[i][j], target <= 10^4"
],
    starterCode: "function searchMatrix(matrix: number[][], target: number): boolean {\n  const m = matrix.length, n = matrix[0].length;\n  let left = 0, right = m * n - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    const val = matrix[Math.floor(mid / n)][mid % n];\n    if (val === target) return true;\n    if (val < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return false;\n}",
  },
  {
    id: "find-minimum-in-rotated-sorted-array",
    problemName: "Find Minimum in Rotated Sorted Array",
    difficulty: "Medium",
    tags: ["Array","Binary Search","amazon","google"],
    description: "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums of unique elements, return the minimum element of this array. You must write an algorithm that runs in O(log n) time.",
    examples: [
      {
            "input": "3 4 5 1 2",
            "output": "1"
      }
],
    constraints: [
      "n == nums.length",
      "1 <= n <= 5000",
      "-5000 <= nums[i] <= 5000",
      "All elements of nums are unique."
],
    starterCode: "function findMin(nums: number[]): number {\n  let left = 0, right = nums.length - 1;\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] > nums[right]) left = mid + 1;\n    else right = mid;\n  }\n  return nums[left];\n}",
  },
  {
    id: "reverse-linked-list",
    problemName: "Reverse Linked List",
    difficulty: "Easy",
    tags: ["Linked List","Recursion","amazon","microsoft","meta"],
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      {
            "input": "1 2 3 4 5",
            "output": "5 4 3 2 1"
      }
],
    constraints: [
      "The number of nodes in the list is the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
],
    starterCode: "class ListNode {\n  val: number;\n  next: ListNode | null;\n  constructor(val?: number, next?: ListNode | null) {\n    this.val = (val===undefined ? 0 : val);\n    this.next = (next===undefined ? null : next);\n  }\n}\n\nfunction reverseList(head: ListNode | null): ListNode | null {\n  let prev: ListNode | null = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}",
  },
  {
    id: "merge-two-sorted-lists",
    problemName: "Merge Two Sorted Lists",
    difficulty: "Easy",
    tags: ["Linked List","Recursion","amazon","microsoft","meta"],
    description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
    examples: [
      {
            "input": "1 2 4\n1 3 4",
            "output": "1 1 2 3 4 4"
      }
],
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
      "Both list1 and list2 are sorted in non-decreasing order."
],
    starterCode: "function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n  const dummy = new ListNode(0);\n  let cur = dummy;\n  while (list1 && list2) {\n    if (list1.val <= list2.val) {\n      cur.next = list1;\n      list1 = list1.next;\n    } else {\n      cur.next = list2;\n      list2 = list2.next;\n    }\n    cur = cur.next;\n  }\n  cur.next = list1 || list2;\n  return dummy.next;\n}",
  },
  {
    id: "lru-cache",
    problemName: "LRU Cache",
    difficulty: "Medium",
    tags: ["Hash Map","Linked List","Design","amazon","microsoft","meta"],
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class with get(key) and put(key, value) in O(1) average time complexity.",
    examples: [
      {
            "input": "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4",
            "output": "1 -1 -1 3 4"
      }
],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5",
      "At most 2 * 10^5 calls will be made to get and put."
],
    starterCode: "class LRUCache {\n  private capacity: number;\n  private cache = new Map<number, number>();\n  constructor(capacity: number) {\n    this.capacity = capacity;\n  }\n  get(key: number): number {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key)!;\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key: number, value: number): void {\n    if (this.cache.has(key)) this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      const oldest = this.cache.keys().next().value;\n      if (oldest !== undefined) this.cache.delete(oldest);\n    }\n  }\n}",
  },
  {
    id: "invert-binary-tree",
    problemName: "Invert Binary Tree",
    difficulty: "Easy",
    tags: ["Tree","Depth-First Search","Breadth-First Search","google","amazon","microsoft"],
    description: "Given the root of a binary tree, invert the tree, and return its root.",
    examples: [
      {
            "input": "4 2 7 1 3 6 9",
            "output": "4 7 2 9 6 3 1"
      }
],
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
],
    starterCode: "class TreeNode {\n  val: number;\n  left: TreeNode | null;\n  right: TreeNode | null;\n  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {\n    this.val = (val===undefined ? 0 : val);\n    this.left = (left===undefined ? null : left);\n    this.right = (right===undefined ? null : right);\n  }\n}\n\nfunction invertTree(root: TreeNode | null): TreeNode | null {\n  if (!root) return null;\n  const tmp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(tmp);\n  return root;\n}",
  },
  {
    id: "binary-tree-level-order-traversal",
    problemName: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    tags: ["Tree","Breadth-First Search","google","amazon","microsoft"],
    description: "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
    examples: [
      {
            "input": "3 9 20 null null 15 7",
            "output": "3\n9 20\n15 7"
      }
],
    constraints: [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-1000 <= Node.val <= 1000"
],
    starterCode: "function levelOrder(root: TreeNode | null): number[][] {\n  if (!root) return [];\n  const res: number[][] = [];\n  const queue: TreeNode[] = [root];\n  while (queue.length) {\n    const len = queue.length;\n    const level: number[] = [];\n    for (let i = 0; i < len; i++) {\n      const node = queue.shift()!;\n      level.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    res.push(level);\n  }\n  return res;\n}",
  },
  {
    id: "validate-binary-search-tree",
    problemName: "Validate Binary Search Tree",
    difficulty: "Medium",
    tags: ["Tree","Depth-First Search","Binary Search Tree","google","amazon","microsoft"],
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
    examples: [
      {
            "input": "2 1 3",
            "output": "true"
      }
],
    constraints: [
      "The number of nodes in the tree is in the range [1, 10^4].",
      "-2^31 <= Node.val <= 2^31 - 1"
],
    starterCode: "function isValidBST(root: TreeNode | null): boolean {\n  function validate(node: TreeNode | null, min: number, max: number): boolean {\n    if (!node) return true;\n    if (node.val <= min || node.val >= max) return false;\n    return validate(node.left, min, node.val) && validate(node.right, node.val, max);\n  }\n  return validate(root, -Infinity, Infinity);\n}",
  },
  {
    id: "lowest-common-ancestor-of-a-binary-search-tree",
    problemName: "Lowest Common Ancestor of a Binary Search Tree",
    difficulty: "Medium",
    tags: ["Tree","Depth-First Search","Binary Search Tree","google","amazon","microsoft"],
    description: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
    examples: [
      {
            "input": "6 2 8 0 4 7 9 null null 3 5\n2 8",
            "output": "6"
      }
],
    constraints: [
      "The number of nodes in the tree is in the range [2, 10^5].",
      "-10^9 <= Node.val <= 10^9",
      "All Node.val are unique.",
      "p != q",
      "p and q will exist in the BST."
],
    starterCode: "function lowestCommonAncestor(root: TreeNode | null, p: TreeNode | null, q: TreeNode | null): TreeNode | null {\n  if (!root || !p || !q) return null;\n  if (p.val < root.val && q.val < root.val) return lowestCommonAncestor(root.left, p, q);\n  if (p.val > root.val && q.val > root.val) return lowestCommonAncestor(root.right, p, q);\n  return root;\n}",
  },
  {
    id: "climbing-stairs",
    problemName: "Climbing Stairs",
    difficulty: "Easy",
    tags: ["Math","Dynamic Programming","google","amazon","tcs-digital"],
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      {
            "input": "2",
            "output": "2"
      }
],
    constraints: [
      "1 <= n <= 45"
],
    starterCode: "function climbStairs(n: number): number {\n  if (n <= 2) return n;\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) {\n    const next = a + b;\n    a = b;\n    b = next;\n  }\n  return b;\n}",
  },
  {
    id: "house-robber",
    problemName: "House Robber",
    difficulty: "Medium",
    tags: ["Array","Dynamic Programming","google","amazon","tcs-digital"],
    description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected that automatically contact the police if two adjacent houses were broken into on the same night. Return the maximum amount of money you can rob tonight without alerting the police.",
    examples: [
      {
            "input": "1 2 3 1",
            "output": "4"
      }
],
    constraints: [
      "1 <= nums.length <= 100",
      "0 <= nums[i] <= 400"
],
    starterCode: "function rob(nums: number[]): number {\n  let rob1 = 0, rob2 = 0;\n  for (const n of nums) {\n    const temp = Math.max(n + rob1, rob2);\n    rob1 = rob2;\n    rob2 = temp;\n  }\n  return rob2;\n}",
  },
  {
    id: "longest-increasing-subsequence",
    problemName: "Longest Increasing Subsequence",
    difficulty: "Medium",
    tags: ["Array","Binary Search","Dynamic Programming","google","amazon","tcs-digital"],
    description: "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    examples: [
      {
            "input": "10 9 2 5 3 7 101 18",
            "output": "4"
      }
],
    constraints: [
      "1 <= nums.length <= 2500",
      "-10^4 <= nums[i] <= 10^4"
],
    starterCode: "function lengthOfLIS(nums: number[]): number {\n  const tails: number[] = [];\n  for (const x of nums) {\n    let l = 0, r = tails.length;\n    while (l < r) {\n      const m = Math.floor((l + r) / 2);\n      if (tails[m] < x) l = m + 1;\n      else r = m;\n    }\n    if (l === tails.length) tails.push(x);\n    else tails[l] = x;\n  }\n  return tails.length;\n}",
  },
  {
    id: "clone-graph",
    problemName: "Clone Graph",
    difficulty: "Medium",
    tags: ["Hash Map","Tree","Graph","DFS","google","amazon"],
    description: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node in the graph contains a value (int) and a list (List[Node]) of its neighbors.",
    examples: [
      {
            "input": "4\n2 4\n1 3\n2 4\n1 3",
            "output": "2 4\n1 3\n2 4\n1 3"
      }
],
    constraints: [
      "The number of nodes in the graph is in the range [0, 100].",
      "1 <= Node.val <= 100",
      "Node.val is unique for each node."
],
    starterCode: "class Node {\n  val: number;\n  neighbors: Node[];\n  constructor(val?: number, neighbors?: Node[]) {\n    this.val = (val===undefined ? 0 : val);\n    this.neighbors = (neighbors===undefined ? [] : neighbors);\n  }\n}\n\nfunction cloneGraph(node: Node | null): Node | null {\n  if (!node) return null;\n  const visited = new Map<Node, Node>();\n  function dfs(curr: Node): Node {\n    if (visited.has(curr)) return visited.get(curr)!;\n    const copy = new Node(curr.val);\n    visited.set(curr, copy);\n    for (const nei of curr.neighbors) {\n      copy.neighbors.push(dfs(nei));\n    }\n    return copy;\n  }\n  return dfs(node);\n}",
  },
  {
    id: "course-schedule",
    problemName: "Course Schedule",
    difficulty: "Medium",
    tags: ["Depth-First Search","Breadth-First Search","Graph","Topological Sort","google","amazon"],
    description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take bi first if you want to take ai. Return true if you can finish all courses. Otherwise, return false.",
    examples: [
      {
            "input": "2\n1\n1 0",
            "output": "true"
      }
],
    constraints: [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= 5000",
      "prerequisites[i].length == 2",
      "All prerequisites pairs are unique."
],
    starterCode: "function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n  const adj = Array.from({ length: numCourses }, () => [] as number[]);\n  const inDegree = new Array(numCourses).fill(0);\n  for (const [course, pre] of prerequisites) {\n    adj[pre].push(course);\n    inDegree[course]++;\n  }\n  const queue: number[] = [];\n  for (let i = 0; i < numCourses; i++) {\n    if (inDegree[i] === 0) queue.push(i);\n  }\n  let count = 0;\n  while (queue.length) {\n    const node = queue.shift()!;\n    count++;\n    for (const nei of adj[node]) {\n      inDegree[nei]--;\n      if (inDegree[nei] === 0) queue.push(nei);\n    }\n  }\n  return count === numCourses;\n}",
  },
];

export const getProblemById = (problemId: string) =>
  mockProblems.find((problem) => problem.id === problemId) ?? null;
