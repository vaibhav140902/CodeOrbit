export type CatalogDifficulty = "Easy" | "Medium" | "Hard";

export interface CatalogProblem {
  id: string;
  problemName: string;
  difficulty: CatalogDifficulty;
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

export const problemCatalog: CatalogProblem[] = [
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
    starterCode:
      "function twoSum(nums: number[], target: number): number[] {\n  const seen = new Map<number, number>();\n\n  for (let index = 0; index < nums.length; index += 1) {\n    const complement = target - nums[index];\n    if (seen.has(complement)) {\n      return [seen.get(complement)!, index];\n    }\n    seen.set(nums[index], index);\n  }\n\n  return [];\n}",
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
        input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]",
        output: "[\"o\",\"l\",\"l\",\"e\",\"h\"]",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ascii character.",
    ],
    starterCode:
      "function reverseString(s: string[]): void {\n  let left = 0;\n  let right = s.length - 1;\n\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left += 1;\n    right -= 1;\n  }\n}",
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
        input: "s = \"()[]{}\"",
        output: "true",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only.",
    ],
    starterCode:
      "function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs = new Map<string, string>([[\")\", \"(\"], [\"]\", \"[\"], [\"}\", \"{\"]]);\n\n  for (const char of s) {\n    if (!pairs.has(char)) {\n      stack.push(char);\n      continue;\n    }\n\n    if (stack.pop() !== pairs.get(char)) {\n      return false;\n    }\n  }\n\n  return stack.length === 0;\n}",
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
    starterCode:
      "function merge(intervals: number[][]): number[][] {\n  if (intervals.length <= 1) return intervals;\n\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged: number[][] = [intervals[0]];\n\n  for (const interval of intervals.slice(1)) {\n    const last = merged[merged.length - 1];\n    if (interval[0] <= last[1]) {\n      last[1] = Math.max(last[1], interval[1]);\n      continue;\n    }\n    merged.push(interval);\n  }\n\n  return merged;\n}",
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
    starterCode:
      "function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (nums[middle] === target) return middle;\n    if (nums[middle] < target) {\n      left = middle + 1;\n    } else {\n      right = middle - 1;\n    }\n  }\n\n  return -1;\n}",
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
        input: "grid = [[\"1\",\"1\",\"0\"],[\"0\",\"1\",\"0\"],[\"1\",\"0\",\"1\"]]",
        output: "3",
      },
    ],
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
    ],
    starterCode:
      "function numIslands(grid: string[][]): number {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  let islands = 0;\n\n  const dfs = (row: number, col: number) => {\n    if (row < 0 || col < 0 || row >= rows || col >= cols || grid[row][col] !== \"1\") {\n      return;\n    }\n\n    grid[row][col] = \"0\";\n    dfs(row + 1, col);\n    dfs(row - 1, col);\n    dfs(row, col + 1);\n    dfs(row, col - 1);\n  };\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === \"1\") {\n        islands += 1;\n        dfs(row, col);\n      }\n    }\n  }\n\n  return islands;\n}",
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
    starterCode:
      "function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n  const merged = [...nums1, ...nums2].sort((a, b) => a - b);\n  const middle = Math.floor(merged.length / 2);\n\n  if (merged.length % 2 === 0) {\n    return (merged[middle - 1] + merged[middle]) / 2;\n  }\n\n  return merged[middle];\n}",
  },
];

export const getCatalogProblem = (problemId: string) =>
  problemCatalog.find((problem) => problem.id === problemId) ?? null;
