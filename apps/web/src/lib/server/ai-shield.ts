import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { AiAssistInput, AiAssistMode } from "@codeorbit/schema";

// ============================================================================
// 1. GLOBAL 15 RPM RATE LIMITER & QUOTA SHIELD
// ============================================================================

/**
 * Gemini Free Tier allows 15 Requests Per Minute (RPM) per project.
 * To provide safety buffer against burst concurrency and network jitter,
 * we enforce a sliding-window ceiling of 12 RPM globally on this server instance.
 */
const MAX_GEMINI_RPM = 12;
const RPM_WINDOW_MS = 60_000;

const geminiCallTimestamps: number[] = [];

const cleanExpiredTimestamps = (now = Date.now()): void => {
  const cutoff = now - RPM_WINDOW_MS;
  while (geminiCallTimestamps.length > 0 && geminiCallTimestamps[0] < cutoff) {
    geminiCallTimestamps.shift();
  }
};

/**
 * Checks whether an outbound Gemini call is permitted under the 15 RPM ceiling.
 */
export const canExecuteGeminiCall = (): boolean => {
  cleanExpiredTimestamps();
  return geminiCallTimestamps.length < MAX_GEMINI_RPM;
};

/**
 * Attempts to acquire a slot for an outbound Gemini call.
 * Returns true if acquired, or false if the quota is currently saturated.
 */
export const acquireGeminiQuota = (): boolean => {
  const now = Date.now();
  cleanExpiredTimestamps(now);

  if (geminiCallTimestamps.length >= MAX_GEMINI_RPM) {
    return false;
  }

  geminiCallTimestamps.push(now);
  return true;
};

/**
 * Returns current Gemini quota status and time until slot resets.
 */
export const getGeminiQuotaInfo = () => {
  const now = Date.now();
  cleanExpiredTimestamps(now);

  const used = geminiCallTimestamps.length;
  const remaining = Math.max(0, MAX_GEMINI_RPM - used);
  const oldestCall = geminiCallTimestamps[0];
  const resetInMs = oldestCall ? Math.max(0, oldestCall + RPM_WINDOW_MS - now) : 0;

  return {
    available: remaining > 0,
    used,
    remaining,
    maxLimit: MAX_GEMINI_RPM,
    resetInMs,
  };
};

// ============================================================================
// 2. TIMEOUT & ABORT CONTROLLER WRAPPER
// ============================================================================

/**
 * Wraps outbound fetches with a hard timeout using AbortController.
 * Prevents worker starvation and gateway timeouts on cold or slow endpoints.
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 7_500
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      throw new Error(`Gemini outbound request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ============================================================================
// 3. SEMANTIC AI CACHE (IN-MEMORY + DISK PERSISTENCE)
// ============================================================================

interface CacheEntry {
  title: string;
  content: string;
  provider: string;
  createdAt: number;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
let cacheInitialized = false;
let pendingSaveTimeout: NodeJS.Timeout | null = null;

const resolveCacheFilePath = (): string => {
  const candidates = [
    path.resolve(process.cwd(), ".codeorbit-cache", "ai-cache.json"),
    path.resolve(process.cwd(), "..", "..", ".codeorbit-cache", "ai-cache.json"),
    path.resolve(process.cwd(), "..", ".codeorbit-cache", "ai-cache.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    const parent = path.dirname(candidate);
    if (fs.existsSync(parent)) {
      return candidate;
    }
  }

  return candidates[0];
};

const loadCacheFromDisk = (): void => {
  if (cacheInitialized) return;
  cacheInitialized = true;

  try {
    const filePath = resolveCacheFilePath();
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { entries?: Record<string, CacheEntry> };
    if (!parsed?.entries) return;

    const now = Date.now();
    for (const [key, entry] of Object.entries(parsed.entries)) {
      if (entry && entry.expiresAt > now) {
        memoryCache.set(key, entry);
      }
    }
  } catch (error) {
    console.warn("Failed to load AI cache from disk:", error);
  }
};

const scheduleCacheSave = (): void => {
  if (pendingSaveTimeout) return;

  pendingSaveTimeout = setTimeout(() => {
    pendingSaveTimeout = null;
    try {
      const filePath = resolveCacheFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const now = Date.now();
      const entries: Record<string, CacheEntry> = {};
      for (const [key, entry] of memoryCache.entries()) {
        if (entry.expiresAt > now) {
          entries[key] = entry;
        }
      }

      fs.writeFileSync(filePath, JSON.stringify({ version: 1, entries }, null, 2), "utf-8");
    } catch (error) {
      console.warn("Failed to persist AI cache to disk:", error);
    }
  }, 2_000);
};

export const createAiCacheKey = (category: string, parts: Record<string, unknown>): string => {
  const sortedKeys = Object.keys(parts).sort();
  const serialized = sortedKeys
    .filter((k) => parts[k] !== undefined && parts[k] !== null && parts[k] !== "")
    .map((k) => `${k}:${String(parts[k])}`)
    .join("|");

  const hash = crypto.createHash("sha256").update(`${category}::${serialized}`).digest("hex").slice(0, 32);
  return `${category}:${hash}`;
};

export const getCachedAiResponse = (
  cacheKey: string
): { title: string; content: string; provider: string } | null => {
  loadCacheFromDisk();

  const entry = memoryCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(cacheKey);
    return null;
  }

  return {
    title: entry.title,
    content: entry.content,
    provider: entry.provider,
  };
};

export const setCachedAiResponse = (
  cacheKey: string,
  data: { title: string; content: string; provider: string },
  ttlMs = 86_400_000 // 24 hours default
): void => {
  loadCacheFromDisk();

  const now = Date.now();
  memoryCache.set(cacheKey, {
    ...data,
    createdAt: now,
    expiresAt: now + ttlMs,
  });

  scheduleCacheSave();
};

// ============================================================================
// 4. DETERMINISTIC PROBLEM ASSIST FALLBACK ENGINE
// ============================================================================

const modeTitle: Record<AiAssistMode, string> = {
  hint: "Smart Hint",
  eli5: "Explain Like I'm 5",
  solver: "AI Auto-Solver",
  review: "Submission Review + Complexity",
};

interface CuratedProblemAssist {
  hints: [string, string, string];
  targetComplexity: string;
  eli5Analogy: string;
  eli5Steps: [string, string, string];
  eli5Example: string;
  solverStrategy: string;
  solverAlgorithm: string[];
  solverComplexity: { time: string; space: string; notes: string };
  solverEdgeCases: string[];
  referenceCode: Record<string, string>;
}

const CURATED_PROBLEMS: Record<string, CuratedProblemAssist> = {
  "two-sum": {
    hints: [
      "Instead of scanning the entire remaining array for each element (which takes O(N^2) time), think about trading space for time. Can you remember numbers you've already seen in O(1) time?",
      "For each number 'x' at index 'i', compute its required complement: complement = target - x. Check if 'complement' already exists in your hash map.",
      "If the complement exists in your map, return [map[complement], i]. Otherwise, record map[x] = i. A single pass avoids using the same element twice.",
    ],
    targetComplexity: "Time: O(N) single pass | Auxiliary Space: O(N) hash map",
    eli5Analogy:
      "Imagine you are at a shoe shop looking for a pair of shoes that costs exactly ₹10 total. You hold a notebook. You see a shoe priced at ₹4. You write down: 'Need a ₹6 shoe to match with Shoe #0'. Later, you spot a ₹6 shoe. You check your notebook, see the note from earlier, and immediately have your pair!",
    eli5Steps: [
      "Pick up each number one by one.",
      "Calculate what partner number is missing (target - current).",
      "If the partner is already in your notebook, return both; otherwise, write this number down.",
    ],
    eli5Example:
      "Array: [2, 7, 11, 15], Target: 9\n• Step 1: See 2. Need 7. Notebook: {2: index 0}.\n• Step 2: See 7. Need 2. Notebook has 2 at index 0! Return [0, 1]. Done in 2 steps!",
    solverStrategy:
      "Use a single-pass Hash Map (lookup table). By storing each visited value alongside its index, we can test for the existence of the mathematical complement in O(1) average time.",
    solverAlgorithm: [
      "Initialize an empty hash map (e.g., seen = {}).",
      "Iterate through the array with index i and value num.",
      "Calculate complement = target - num.",
      "If complement is in seen, return [seen[complement], i].",
      "Otherwise, insert seen[num] = i.",
      "If the loop finishes without finding a match, return an empty array.",
    ],
    solverComplexity: {
      time: "O(N) - We traverse the array containing N elements exactly once. Hash table lookups and insertions take O(1) average time.",
      space: "O(N) - In the worst case, the hash map stores up to N elements before finding a match.",
      notes: "Optimal for unsorted arrays. If the array were already sorted, Two Pointers would achieve O(1) auxiliary space.",
    },
    solverEdgeCases: [
      "Negative numbers and zero: Handled seamlessly by hash map subtraction.",
      "Duplicate values: Handled correctly because the complement is checked before the current index is written.",
      "No valid pair: Returns an empty collection according to contract.",
    ],
    referenceCode: {
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
      cpp: `#include <vector>
#include <unordered_map>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int complement = target - nums[i];
        auto it = seen.find(complement);
        if (it != seen.end()) {
            return {it->second, i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`,
      java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      go: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, ok := seen[complement]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}`,
    },
  },
  "reverse-string": {
    hints: [
      "You must modify the array in-place with O(1) extra memory. Notice the symmetry between the first and last elements.",
      "Initialize two pointers: 'left' at index 0 and 'right' at index n - 1.",
      "While left < right, swap s[left] with s[right], increment left, and decrement right. Stop when they meet in the middle.",
    ],
    targetComplexity: "Time: O(N) | Auxiliary Space: O(1) in-place",
    eli5Analogy:
      "Imagine kids standing in a line holding hands. To reverse the order, the first kid swaps spots with the last kid. Then the second kid swaps with the second-to-last kid. You keep moving inward until everyone has traded places!",
    eli5Steps: [
      "Place your left hand on the first letter and right hand on the last letter.",
      "Swap the two letters.",
      "Move your hands one step inward and repeat until your hands meet in the middle.",
    ],
    eli5Example:
      "['h', 'e', 'l', 'l', 'o']\n• Swap 'h' and 'o' -> ['o', 'e', 'l', 'l', 'h']\n• Swap 'e' and 'l' -> ['o', 'l', 'l', 'e', 'h']\n• Middle 'l' stays put. Done!",
    solverStrategy:
      "Classic Two Pointers technique. Inverting elements symmetrically across the center axis satisfies the O(1) auxiliary space constraint.",
    solverAlgorithm: [
      "Set left = 0 and right = length - 1.",
      "Execute loop while left < right.",
      "Swap the characters at left and right.",
      "Increment left by 1; decrement right by 1.",
    ],
    solverComplexity: {
      time: "O(N) - Exactly N/2 swaps are performed, which is linear O(N).",
      space: "O(1) - Constant auxiliary space, modifying the array strictly in-place.",
      notes: "Meets strict interview memory limits.",
    },
    solverEdgeCases: [
      "Single character or empty string: Loop condition left < right immediately terminates.",
      "Even vs Odd length: Works symmetrically for both.",
    ],
    referenceCode: {
      python: `def reverseString(s: list[str]) -> None:
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1`,
      javascript: `function reverseString(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;
    left++;
    right--;
  }
}`,
      typescript: `function reverseString(s: string[]): void {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;
    left++;
    right--;
  }
}`,
      cpp: `#include <vector>
#include <utility>

void reverseString(std::vector<char>& s) {
    int left = 0;
    int right = static_cast<int>(s.size()) - 1;
    while (left < right) {
        std::swap(s[left++], s[right--]);
    }
}`,
      java: `class Solution {
    public void reverseString(char[] s) {
        int left = 0;
        int right = s.length - 1;
        while (left < right) {
            char temp = s[left];
            s[left] = s[right];
            s[right] = temp;
            left++;
            right--;
        }
    }
}`,
      go: `func reverseString(s []byte) {
    left, right := 0, len(s)-1
    for left < right {
        s[left], s[right] = s[right], s[left]
        left++
        right--
    }
}`,
    },
  },
  "valid-parentheses": {
    hints: [
      "Notice that the most recently opened bracket must be the first one to be closed. What data structure naturally matches Last-In, First-Out (LIFO)?",
      "Use a Stack. Push opening brackets '(', '{', '['. When you see a closing bracket, verify that the stack is non-empty and the top matches the corresponding open bracket.",
      "At the end of the string, remember to verify that the stack is completely empty. If opening brackets remain without partners, the string is invalid.",
    ],
    targetComplexity: "Time: O(N) | Auxiliary Space: O(N) stack",
    eli5Analogy:
      "Think of open brackets like putting toy boxes inside each other. The last box you opened must be the first one you put the lid on! If you try to put a round lid on a square box, or try to close a box when none are open, it doesn't fit!",
    eli5Steps: [
      "When you see an open bracket, put it on top of your stack.",
      "When you see a closing bracket, check if it matches the top box on your stack and remove it.",
      "When finished, all boxes must be neatly closed (stack must be empty).",
    ],
    eli5Example:
      "String: '{[()]}'\n• Push '{', push '[', push '('\n• See ')' -> matches '(' on top -> pop\n• See ']' -> matches '[' on top -> pop\n• See '}' -> matches '{' on top -> pop\n• Stack empty -> True!",
    solverStrategy:
      "Use a Stack with a hash map of closing-to-opening bracket pairs. Every opening bracket is pushed; every closing bracket verifies the top element and pops it.",
    solverAlgorithm: [
      "Create a mapping: {')': '(', '}': '{', ']': '['}.",
      "Initialize an empty stack.",
      "For each character in the string:",
      "  If it is a closing bracket: check if stack is empty or top != mapping[char]. If so, return false. Otherwise, pop.",
      "  If it is an opening bracket: push onto stack.",
      "Return true if stack is empty, false otherwise.",
    ],
    solverComplexity: {
      time: "O(N) - Single pass through the string of length N.",
      space: "O(N) - In the worst case (e.g., '(((((('), the stack holds N characters.",
      notes: "Optimal interview solution.",
    },
    solverEdgeCases: [
      "Odd length strings: Immediately return false.",
      "Closing bracket with empty stack (e.g., ')('): Caught by stack emptiness check.",
      "Unclosed brackets (e.g., '(()'): Caught by final stack empty check.",
    ],
    referenceCode: {
      python: `def isValid(s: str) -> bool:
    if len(s) % 2 != 0:
        return False
    mapping = {')': '(', '}': '{', ']': '['}
    stack = []
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return len(stack) == 0`,
      javascript: `function isValid(s) {
  if (s.length % 2 !== 0) return false;
  const mapping = { ')': '(', '}': '{', ']': '[' };
  const stack = [];
  for (const char of s) {
    if (mapping[char]) {
      const top = stack.pop() || '#';
      if (mapping[char] !== top) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      typescript: `function isValid(s: string): boolean {
  if (s.length % 2 !== 0) return false;
  const mapping: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  const stack: string[] = [];
  for (const char of s) {
    if (mapping[char]) {
      const top = stack.pop() || '#';
      if (mapping[char] !== top) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      cpp: `#include <string>
#include <stack>
#include <unordered_map>

bool isValid(const std::string& s) {
    if (s.length() % 2 != 0) return false;
    std::unordered_map<char, char> mapping = {{')', '('}, {'}', '{'}, {']', '['}};
    std::stack<char> st;
    for (char c : s) {
        if (mapping.count(c)) {
            if (st.empty() || st.top() != mapping[c]) return false;
            st.pop();
        } else {
            st.push(c);
        }
    }
    return st.empty();
}`,
      java: `import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;

class Solution {
    public boolean isValid(String s) {
        if (s.length() % 2 != 0) return false;
        Map<Character, Character> mapping = Map.of(')', '(', '}', '{', ']', '[');
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (mapping.containsKey(c)) {
                if (stack.isEmpty() || stack.pop() != mapping.get(c)) return false;
            } else {
                stack.push(c);
            }
        }
        return stack.isEmpty();
    }
}`,
      go: `func isValid(s string) bool {
    if len(s)%2 != 0 {
        return false
    }
    mapping := map[byte]byte{')': '(', '}': '{', ']': '['}
    stack := make([]byte, 0, len(s))
    for i := 0; i < len(s); i++ {
        char := s[i]
        if match, ok := mapping[char]; ok {
            if len(stack) == 0 || stack[len(stack)-1] != match {
                return false
            }
            stack = stack[:len(stack)-1]
        } else {
            stack = append(stack, char)
        }
    }
    return len(stack) == 0
}`,
    },
  },
  "binary-search": {
    hints: [
      "The input array is guaranteed to be sorted in ascending order. This monotonic property allows you to discard half the search space with every comparison.",
      "Set low = 0 and high = len - 1. Calculate mid = low + (high - low) // 2. (Using this formula instead of (low + high) // 2 prevents 32-bit integer overflow).",
      "If nums[mid] == target, return mid. If nums[mid] < target, target must be in the right half (low = mid + 1). Otherwise, search the left half (high = mid - 1).",
    ],
    targetComplexity: "Time: O(log N) | Auxiliary Space: O(1)",
    eli5Analogy:
      "Think of looking up a word in a thick dictionary. You open it right in the middle. If your word starts with 'S' and the page is on 'M', you know for sure your word is in the second half. You rip the first half away and repeat in the middle of the remaining pages. You find any word in seconds!",
    eli5Steps: [
      "Open to the middle element.",
      "If it's the target, you're done!",
      "If the target is bigger, throw away the left half; if smaller, throw away the right half. Repeat.",
    ],
    eli5Example:
      "nums = [-1, 0, 3, 5, 9, 12], target = 9\n• low=0, high=5, mid=2 (val=3). 9 > 3, so search right (low=3).\n• low=3, high=5, mid=4 (val=9). 9 == 9 -> Found at index 4!",
    solverStrategy:
      "Iterative Binary Search. Halving the search interval on each iteration yields logarithmic time complexity.",
    solverAlgorithm: [
      "Set low = 0, high = nums.length - 1.",
      "While low <= high:",
      "  Compute mid = low + Math.floor((high - low) / 2).",
      "  If nums[mid] === target, return mid.",
      "  If nums[mid] < target, set low = mid + 1.",
      "  If nums[mid] > target, set high = mid - 1.",
      "If not found, return -1.",
    ],
    solverComplexity: {
      time: "O(log N) - The search space is halved at each step.",
      space: "O(1) - Iterative approach requires only constant additional variables.",
      notes: "Far superior to O(N) linear scan.",
    },
    solverEdgeCases: [
      "Target smaller than all elements or larger than all: Terminates safely and returns -1.",
      "Single-element array: Correctly checks mid = 0.",
      "Integer overflow: Prevented by using low + (high - low) / 2.",
    ],
    referenceCode: {
      python: `def search(nums: list[int], target: int) -> int:
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
      javascript: `function search(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
      typescript: `function search(nums: number[], target: number): number {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
      cpp: `#include <vector>

int search(const std::vector<int>& nums, int target) {
    int low = 0;
    int high = static_cast<int>(nums.size()) - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        int low = 0;
        int high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }
}`,
      go: `func search(nums []int, target int) int {
    low, high := 0, len(nums)-1
    for low <= high {
        mid := low + (high-low)/2
        if nums[mid] == target {
            return mid
        } else if nums[mid] < target {
            low = mid + 1
        } else {
            high = mid - 1
        }
    }
    return -1
}`,
    },
  },
  "maximum-subarray": {
    hints: [
      "A brute force approach considers all O(N^2) subarrays. Can you solve this in a single linear pass using Kadane's Algorithm?",
      "At any element nums[i], you have two choices: either extend the previous subarray sum (current_max + nums[i]) or start a fresh subarray at nums[i].",
      "Keep track of the global maximum seen so far across all steps. Invariant: current_max = max(nums[i], current_max + nums[i]).",
    ],
    targetComplexity: "Time: O(N) | Auxiliary Space: O(1)",
    eli5Analogy:
      "Imagine you are running a marathon collecting points. Each kilometer gives you positive or negative points. If your running total drops below zero, it's dragging you down! You drop that baggage and start counting fresh from your current kilometer, while keeping a notebook record of the highest score you ever reached.",
    eli5Steps: [
      "Add the current number to your running streak.",
      "If the current number alone is better than your streak plus the number, reset your streak to start here.",
      "Remember the highest streak record you've ever achieved.",
    ],
    eli5Example:
      "[-2, 1, -3, 4, -1, 2, 1, -5, 4]\n• Streak drops negative at -2 -> reset at 1\n• Subarray [4, -1, 2, 1] sums to 6\n• Global max is 6!",
    solverStrategy:
      "Kadane's Algorithm (Dynamic Programming with O(1) state). We determine whether the prefix sum contributes positively to the current subarray.",
    solverAlgorithm: [
      "Initialize current_max = nums[0] and max_sum = nums[0].",
      "Iterate through the array starting from index 1 to N - 1.",
      "Update current_max = Math.max(nums[i], current_max + nums[i]).",
      "Update max_sum = Math.max(max_sum, current_max).",
      "Return max_sum.",
    ],
    solverComplexity: {
      time: "O(N) - Single linear pass through the array.",
      space: "O(1) - Only two integer variables required.",
      notes: "Guaranteed optimal for finding maximum contiguous subarray.",
    },
    solverEdgeCases: [
      "All negative numbers: Correctly returns the single least-negative element.",
      "Single element: Correctly returns nums[0].",
    ],
    referenceCode: {
      python: `def maxSubArray(nums: list[int]) -> int:
    current_max = max_sum = nums[0]
    for x in nums[1:]:
        current_max = max(x, current_max + x)
        max_sum = max(max_sum, current_max)
    return max_sum`,
      javascript: `function maxSubArray(nums) {
  let currentMax = nums[0];
  let maxSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSum = Math.max(maxSum, currentMax);
  }
  return maxSum;
}`,
      typescript: `function maxSubArray(nums: number[]): number {
  let currentMax = nums[0];
  let maxSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSum = Math.max(maxSum, currentMax);
  }
  return maxSum;
}`,
      cpp: `#include <vector>
#include <algorithm>

int maxSubArray(const std::vector<int>& nums) {
    int current_max = nums[0];
    int max_sum = nums[0];
    for (size_t i = 1; i < nums.size(); ++i) {
        current_max = std::max(nums[i], current_max + nums[i]);
        max_sum = std::max(max_sum, current_max);
    }
    return max_sum;
}`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        int currentMax = nums[0];
        int maxSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currentMax = Math.max(nums[i], currentMax + nums[i]);
            maxSum = Math.max(maxSum, currentMax);
        }
        return maxSum;
    }
}`,
      go: `func maxSubArray(nums []int) int {
    currentMax, maxSum := nums[0], nums[0]
    for i := 1; i < len(nums); i++ {
        if nums[i] > currentMax+nums[i] {
            currentMax = nums[i]
        } else {
            currentMax += nums[i]
        }
        if currentMax > maxSum {
            maxSum = currentMax
        }
    }
    return maxSum
}`,
    },
  },
};

const resolveLanguageKey = (lang?: string): string => {
  const normalized = (lang || "").toLowerCase().trim();
  if (normalized.includes("python") || normalized.includes("py")) return "python";
  if (normalized.includes("typescript") || normalized.includes("ts")) return "typescript";
  if (normalized.includes("javascript") || normalized.includes("js")) return "javascript";
  if (normalized.includes("cpp") || normalized.includes("c++")) return "cpp";
  if (normalized.includes("java")) return "java";
  if (normalized.includes("go") || normalized.includes("golang")) return "go";
  return "python";
};

/**
 * Heuristic code reviewer that evaluates student code syntax, complexity traps, and boundary cases.
 */
const reviewStudentCodeHeuristic = (
  code: string,
  judgeStatus?: string,
  stderr?: string
): { verdict: string; complexity: string; whatWorks: string; risks: string; nextStep: string } => {
  const hasNestedLoops = /(for|while)[\s\S]*?(for|while)/.test(code);
  const hasRecursion = /function\s+(\w+)[\s\S]*?\1\(|def\s+(\w+)[\s\S]*?\2\(/.test(code);
  const hasEmptyCheck = /(length|len|empty|size|null|None|nullptr)\s*(===|==|<=|<|\.empty\(\))/.test(code);
  const hasMapOrSet = /(Map|Set|dict|unordered_map|HashMap|HashSet|set\()/.test(code);

  let verdict = "Code structure shows correct conceptual intent.";
  if (judgeStatus && judgeStatus.toLowerCase().includes("accepted")) {
    verdict = "Submission Verified & Accepted. Implementation is recruiter-ready.";
  } else if (judgeStatus && (judgeStatus.includes("Time Limit") || judgeStatus.includes("TLE"))) {
    verdict = "Time Limit Exceeded (TLE). Algorithm suffers from quadratic or exponential complexity on large inputs.";
  } else if (judgeStatus && judgeStatus.includes("Wrong Answer")) {
    verdict = "Wrong Answer on testcase. Code logic fails on specific boundary conditions.";
  }

  const timeComplexity = hasNestedLoops ? "O(N^2) or higher (nested iteration detected)" : "O(N) linear scan";
  const spaceComplexity = hasMapOrSet ? "O(N) auxiliary space (hash table / set used)" : "O(1) constant auxiliary space";

  const whatWorks = [
    hasMapOrSet ? "Uses lookup structures for faster access." : "Iterates through problem space systematically.",
    hasEmptyCheck ? "Includes boundary guards for edge conditions." : "Clear variable naming and control flow.",
    hasRecursion ? "Deconstructs recursive subproblems." : "Follows iterative execution pattern.",
  ].join(" ");

  const risks: string[] = [];
  if (hasNestedLoops) {
    risks.push("Nested loops will trigger Time Limit Exceeded (TLE) when input constraint N >= 10^4.");
  }
  if (!hasEmptyCheck) {
    risks.push("Missing explicit empty array or null pointer check before accessing index 0.");
  }
  if (stderr?.trim()) {
    risks.push(`Runtime error encountered: ${stderr.slice(0, 150)}`);
  }
  if (risks.length === 0) {
    risks.push("Watch for 32-bit integer overflow when summing large elements near 10^9.");
  }

  const nextStep = hasNestedLoops
    ? "Refactor nested loop into a single pass using a Hash Map or Two Pointers to drop time complexity from O(N^2) to O(N)."
    : "Harden boundary checks (empty inputs, single elements) and test with extreme constraints.";

  return {
    verdict,
    complexity: `Time Complexity: ${timeComplexity} | Space Complexity: ${spaceComplexity}`,
    whatWorks,
    risks: risks.join(" "),
    nextStep,
  };
};

/**
 * Generates deterministic, high-polish problem assistance when Gemini is unavailable,
 * rate-limited, or when serving static deterministic DSA queries.
 */
export const generateDeterministicProblemAssist = (
  input: AiAssistInput
): { title: string; content: string; provider: "codeorbit-fallback" } => {
  const mode = input.mode;
  const problemSlug = (input.problemId || "").toLowerCase().trim();
  const curated = CURATED_PROBLEMS[problemSlug];
  const langKey = resolveLanguageKey(input.language);
  const problemName = input.problemName || (curated ? problemSlug.replace(/-/g, " ") : "Algorithmic Problem");

  if (mode === "hint") {
    if (curated) {
      const content = [
        `### Progressive Hints for ${problemName}\n`,
        `**Hint 1 (Mental Model):** ${curated.hints[0]}\n`,
        `**Hint 2 (Optimization Path):** ${curated.hints[1]}\n`,
        `**Hint 3 (Edge Cases & Traps):** ${curated.hints[2]}\n`,
        `---\n**Target Efficiency:** ${curated.targetComplexity}`,
      ].join("\n");

      return {
        title: modeTitle.hint,
        content,
        provider: "codeorbit-fallback",
      };
    }

    // Generic heuristic hints based on tags and constraints
    const tags = input.problemTags || [];
    const isArrayOrHash = tags.some((t) => /array|hash|string/i.test(t));
    const isSearchOrPointer = tags.some((t) => /binary search|two pointer|sliding window/i.test(t));
    const isTreeOrGraph = tags.some((t) => /tree|graph|bfs|dfs/i.test(t));

    let hint1 = "Identify what repeated work the brute-force approach performs. Can intermediate values be stored in a lookup table?";
    let hint2 = "Examine whether sorting the collection first or using two pointers would eliminate an entire dimension of search.";
    let hint3 = "Always verify boundary cases: empty input, single element, negative numbers, and extreme constraints.";

    if (isArrayOrHash) {
      hint1 = "Think about trading space for time. Can a Hash Map remember previously computed elements in O(1) time?";
      hint2 = "Keep track of running invariants (e.g. running sum, frequency count, or complement) in a single pass.";
    } else if (isSearchOrPointer) {
      hint1 = "If the data is sorted, binary search or two converging pointers can cut the search space in half or in linear time.";
      hint2 = "Carefully formulate the pointer update conditions: ensure pointers always make progress to prevent infinite loops.";
    } else if (isTreeOrGraph) {
      hint1 = "Determine whether level-order traversal (Queue/BFS) or branch-depth exploration (Stack/DFS) is optimal.";
      hint2 = "Track visited nodes or mark grid cells in-place to prevent cyclic infinite loops.";
    }

    const content = [
      `### Hints for ${problemName}\n`,
      `**Hint 1 (Mental Model):** ${hint1}\n`,
      `**Hint 2 (Optimization Path):** ${hint2}\n`,
      `**Hint 3 (Edge Cases & Invariants):** ${hint3}\n`,
      `---\n**Target Complexity:** Aim for O(N) or O(N log N) time; avoid nested O(N^2) scans.`,
    ].join("\n");

    return {
      title: modeTitle.hint,
      content,
      provider: "codeorbit-fallback",
    };
  }

  if (mode === "eli5") {
    if (curated) {
      const content = [
        `### Explain Like I'm 5: ${problemName}\n`,
        `**The Toy Analogy:**\n${curated.eli5Analogy}\n`,
        `**3 Simple Steps:**\n1. ${curated.eli5Steps[0]}\n2. ${curated.eli5Steps[1]}\n3. ${curated.eli5Steps[2]}\n`,
        `**Quick Walkthrough:**\n${curated.eli5Example}`,
      ].join("\n");

      return {
        title: modeTitle.eli5,
        content,
        provider: "codeorbit-fallback",
      };
    }

    const content = [
      `### Explain Like I'm 5: ${problemName}\n`,
      `**The Real-World Analogy:**\nThink of this problem like organizing books on a shelf. Instead of searching through every single book one by one from scratch every time (which takes all day), we write down a quick index card so we know exactly where each book is right away!\n`,
      `**3 Simple Steps:**\n1. Look at one item at a time.\n2. Check your quick notes to see if you already found the answer or partner item.\n3. If not, write down what you learned and move to the next item.\n`,
      `**Key takeaway:** Trade a little bit of notebook space (memory) so you never have to repeat slow searches (time)!`,
    ].join("\n");

    return {
      title: modeTitle.eli5,
      content,
      provider: "codeorbit-fallback",
    };
  }

  if (mode === "solver") {
    if (curated) {
      const codeSnippet = curated.referenceCode[langKey] || curated.referenceCode.python;
      const content = [
        `### Optimal Solution Blueprint: ${problemName}\n`,
        `#### 1. Strategic Intuition\n${curated.solverStrategy}\n`,
        `#### 2. Step-by-Step Algorithm\n${curated.solverAlgorithm.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n`,
        `#### 3. Complexity Analysis\n• **Time Complexity:** ${curated.solverComplexity.time}\n• **Space Complexity:** ${curated.solverComplexity.space}\n• **Recruiter Note:** ${curated.solverComplexity.notes}\n`,
        `#### 4. Critical Edge Cases Handled\n${curated.solverEdgeCases.map((e) => `• ${e}`).join("\n")}\n`,
        `#### 5. Clean Reference Implementation (${langKey})\n\`\`\`${langKey}\n${codeSnippet}\n\`\`\``,
      ].join("\n");

      return {
        title: modeTitle.solver,
        content,
        provider: "codeorbit-fallback",
      };
    }

    const content = [
      `### Algorithmic Solution Blueprint: ${problemName}\n`,
      `#### 1. Strategic Intuition\nOptimal solutions for this problem class replace brute-force nested iteration with an indexed lookup table or two pointers, guaranteeing linear or logarithmic complexity.\n`,
      `#### 2. Step-by-Step Algorithm\n1. Initialize required auxiliary state (e.g. hash map or two pointers).\n2. Iterate through input elements, computing necessary transitions.\n3. Validate intermediate conditions against problem constraints.\n4. Return computed result or fallback.\n`,
      `#### 3. Complexity Analysis\n• **Time Complexity:** O(N) or O(N log N) optimal.\n• **Space Complexity:** O(1) to O(N) auxiliary.\n`,
      `#### 4. Edge Cases Handled\n• Empty input arrays and single elements.\n• Negative values and duplicate entries.\n• Boundary index off-by-one errors.\n`,
      `#### 5. Implementation Guidance\nReview problem constraints and ensure you avoid O(N^2) nested loops to pass all online judge test cases within 1000ms.`,
    ].join("\n");

    return {
      title: modeTitle.solver,
      content,
      provider: "codeorbit-fallback",
    };
  }

  // mode === "review"
  const studentCode = input.code || "// No student code provided";
  const review = reviewStudentCodeHeuristic(studentCode, input.judgeStatus, input.stderr);

  const content = [
    `### Recruiter Code Review: ${problemName}\n`,
    `**Verdict:** ${review.verdict}\n`,
    `**Complexity Analysis:**\n${review.complexity}\n`,
    `**What Works Well:**\n${review.whatWorks}\n`,
    `**Potential Risks & Edge Cases:**\n${review.risks}\n`,
    `**Actionable Next Step:**\n${review.nextStep}`,
  ].join("\n");

  return {
    title: modeTitle.review,
    content,
    provider: "codeorbit-fallback",
  };
};
