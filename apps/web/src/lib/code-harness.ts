/**
 * CodeOrbit Invisible Driver Harness (Shared Client/Server)
 * Transforms clean, LeetCode-grade user solutions (e.g., `class Solution: def twoSum(...)`)
 * into fully executable programs behind the scenes.
 */

export interface LeetCodeMethodSpec {
  methodName: string;
  pythonSignature: string;
  jsSignature: string;
  tsSignature: string;
  javaSignature: string;
  cppSignature: string;
  pythonDriver: string;
  jsDriver: string;
  javaDriver: string;
  cppDriver: string;
}

export const LEETCODE_SPECS: Record<string, LeetCodeMethodSpec> = {
  "two-sum": {
    methodName: "twoSum",
    pythonSignature: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your logic here
        pass
`,
    jsSignature: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your logic here
  return [];
}
`,
    tsSignature: `function twoSum(nums: number[], target: number): number[] {
  // Write your logic here
  return [];
}
`,
    javaSignature: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your logic here
        return new int[0];
    }
}
`,
    cppSignature: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your logic here
        return {};
    }
};
`,
    pythonDriver: `
if __name__ == "__main__":
    import sys
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    target = int(lines[1]) if len(lines) > 1 else 0
    sol = Solution() if 'Solution' in globals() else None
    if sol and hasattr(sol, 'twoSum'):
        ans = sol.twoSum(nums, target)
    elif 'twoSum' in globals():
        ans = twoSum(nums, target)
    elif 'solve' in globals():
        ans = solve(nums, target)
    else:
        raise Exception("Function twoSum not found")
    print(" ".join(map(str, ans)))
`,
    jsDriver: `
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\\r?\\n/) : [];
const nums = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [];
const target = lines[1] ? Number(lines[1]) : 0;
let ans;
if (typeof Solution !== "undefined" && new Solution().twoSum) {
  ans = new Solution().twoSum(nums, target);
} else if (typeof twoSum === "function") {
  ans = twoSum(nums, target);
} else if (typeof solve === "function") {
  ans = solve(nums, target);
}
if (Array.isArray(ans)) {
  console.log(ans.join(" "));
}
`,
    javaDriver: `
public class Main {
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String first = reader.readLine();
        String second = reader.readLine();
        int[] nums = first == null || first.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(first.trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();
        int target = second == null || second.trim().isEmpty() ? 0 : Integer.parseInt(second.trim());
        Solution sol = new Solution();
        int[] ans = sol.twoSum(nums, target);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < ans.length; i++) {
            if (i > 0) out.append(' ');
            out.append(ans[i]);
        }
        System.out.print(out.toString());
    }
}
`,
    cppDriver: `
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string numsLine, targetLine;
    std::getline(std::cin, numsLine);
    std::getline(std::cin, targetLine);
    std::stringstream numsStream(numsLine);
    std::vector<int> nums;
    int value;
    while (numsStream >> value) nums.push_back(value);
    int target = targetLine.empty() ? 0 : std::stoi(targetLine);
    Solution sol;
    auto ans = sol.twoSum(nums, target);
    for (size_t i = 0; i < ans.size(); ++i) {
        if (i) std::cout << ' ';
        std::cout << ans[i];
    }
    return 0;
}
`,
  },

  "reverse-string": {
    methodName: "reverseString",
    pythonSignature: `class Solution:
    def reverseString(self, s: str) -> str:
        # Write your logic here
        pass
`,
    jsSignature: `function reverseString(s) {
  // Write your logic here
  return "";
}
`,
    tsSignature: `function reverseString(s: string): string {
  // Write your logic here
  return "";
}
`,
    javaSignature: `class Solution {
    public String reverseString(String s) {
        // Write your logic here
        return "";
    }
}
`,
    cppSignature: `class Solution {
public:
    string reverseString(string s) {
        // Write your logic here
        return "";
    }
};
`,
    pythonDriver: `
if __name__ == "__main__":
    import sys
    text = sys.stdin.read().strip()
    sol = Solution() if 'Solution' in globals() else None
    if sol and hasattr(sol, 'reverseString'):
        ans = sol.reverseString(text)
    elif 'reverseString' in globals():
        ans = reverseString(text)
    elif 'solve' in globals():
        ans = solve(text)
    else:
        raise Exception("Function reverseString not found")
    print(ans)
`,
    jsDriver: `
const fs = require("fs");
const text = fs.readFileSync(0, "utf8").trim();
let ans = "";
if (typeof Solution !== "undefined" && new Solution().reverseString) {
  ans = new Solution().reverseString(text);
} else if (typeof reverseString === "function") {
  ans = reverseString(text);
} else if (typeof solve === "function") {
  ans = solve(text);
}
console.log(ans);
`,
    javaDriver: `
public class Main {
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String text = reader.readLine();
        Solution sol = new Solution();
        System.out.print(sol.reverseString(text == null ? "" : text.trim()));
    }
}
`,
    cppDriver: `
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string text;
    std::getline(std::cin, text);
    Solution sol;
    std::cout << sol.reverseString(text);
    return 0;
}
`,
  },

  "valid-parentheses": {
    methodName: "isValid",
    pythonSignature: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your logic here
        pass
`,
    jsSignature: `function isValid(s) {
  // Write your logic here
  return false;
}
`,
    tsSignature: `function isValid(s: string): boolean {
  // Write your logic here
  return false;
}
`,
    javaSignature: `class Solution {
    public boolean isValid(String s) {
        // Write your logic here
        return false;
    }
}
`,
    cppSignature: `class Solution {
public:
    bool isValid(string s) {
        // Write your logic here
        return false;
    }
};
`,
    pythonDriver: `
if __name__ == "__main__":
    import sys
    text = sys.stdin.read().strip()
    sol = Solution() if 'Solution' in globals() else None
    if sol and hasattr(sol, 'isValid'):
        ans = sol.isValid(text)
    elif 'isValid' in globals():
        ans = isValid(text)
    elif 'solve' in globals():
        ans = solve(text)
    else:
        raise Exception("Function isValid not found")
    print(str(ans).lower())
`,
    jsDriver: `
const fs = require("fs");
const text = fs.readFileSync(0, "utf8").trim();
let ans = false;
if (typeof Solution !== "undefined" && new Solution().isValid) {
  ans = new Solution().isValid(text);
} else if (typeof isValid === "function") {
  ans = isValid(text);
} else if (typeof solve === "function") {
  ans = solve(text);
}
console.log(String(ans));
`,
    javaDriver: `
public class Main {
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String text = reader.readLine();
        Solution sol = new Solution();
        System.out.print(Boolean.toString(sol.isValid(text == null ? "" : text.trim())));
    }
}
`,
    cppDriver: `
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string text;
    std::getline(std::cin, text);
    Solution sol;
    std::cout << (sol.isValid(text) ? "true" : "false");
    return 0;
}
`,
  },

  "binary-search": {
    methodName: "search",
    pythonSignature: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        # Write your logic here
        return -1
`,
    jsSignature: `function search(nums, target) {
  // Write your logic here
  return -1;
}
`,
    tsSignature: `function search(nums: number[], target: number): number {
  // Write your logic here
  return -1;
}
`,
    javaSignature: `class Solution {
    public int search(int[] nums, int target) {
        // Write your logic here
        return -1;
    }
}
`,
    cppSignature: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Write your logic here
        return -1;
    }
};
`,
    pythonDriver: `
if __name__ == "__main__":
    import sys
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    target = int(lines[1]) if len(lines) > 1 else 0
    sol = Solution() if 'Solution' in globals() else None
    if sol and hasattr(sol, 'search'):
        ans = sol.search(nums, target)
    elif 'search' in globals():
        ans = search(nums, target)
    elif 'solve' in globals():
        ans = solve(nums, target)
    else:
        raise Exception("Function search not found")
    print(ans)
`,
    jsDriver: `
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\\r?\\n/) : [];
const nums = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [];
const target = lines[1] ? Number(lines[1]) : 0;
let ans = -1;
if (typeof Solution !== "undefined" && new Solution().search) {
  ans = new Solution().search(nums, target);
} else if (typeof search === "function") {
  ans = search(nums, target);
} else if (typeof solve === "function") {
  ans = solve(nums, target);
}
console.log(String(ans));
`,
    javaDriver: `
public class Main {
    public static void main(String[] args) throws Exception {
        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String first = reader.readLine();
        String second = reader.readLine();
        int[] nums = first == null || first.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(first.trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();
        int target = second == null || second.trim().isEmpty() ? 0 : Integer.parseInt(second.trim());
        Solution sol = new Solution();
        System.out.print(sol.search(nums, target));
    }
}
`,
    cppDriver: `
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string numsLine, targetLine;
    std::getline(std::cin, numsLine);
    std::getline(std::cin, targetLine);
    std::stringstream numsStream(numsLine);
    std::vector<int> nums;
    int value;
    while (numsStream >> value) nums.push_back(value);
    int target = targetLine.empty() ? 0 : std::stoi(targetLine);
    Solution sol;
    std::cout << sol.search(nums, target);
    return 0;
}
`,
  },
};

/**
 * Prepares user code for execution by injecting headers and drivers
 * if the candidate submitted a LeetCode-style function or class.
 */
export function wrapCodeForExecution(
  problemId: string,
  language: string,
  userCode: string
): string {
  const trimmed = userCode.trim();

  // If user code already has standalone main/stdin logic, do not inject driver
  if (
    trimmed.includes('if __name__ == "__main__":') ||
    trimmed.includes("if __name__ == '__main__':") ||
    trimmed.includes("public static void main") ||
    trimmed.includes("int main(") ||
    trimmed.includes("fs.readFileSync(0")
  ) {
    return userCode;
  }

  const spec = LEETCODE_SPECS[problemId];

  if (language === "python") {
    const header = `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n`;
    if (spec?.pythonDriver) {
      return `${header}${userCode}\n${spec.pythonDriver}`;
    }
    return `${header}${userCode}`;
  }

  if (language === "javascript") {
    if (spec?.jsDriver) {
      return `${userCode}\n${spec.jsDriver}`;
    }
    return userCode;
  }

  if (language === "typescript") {
    const header = `declare const require: any;\n`;
    if (spec?.jsDriver) {
      return `${header}${userCode}\n${spec.jsDriver}`;
    }
    return `${header}${userCode}`;
  }

  if (language === "java") {
    const header = `import java.util.*;\nimport java.io.*;\n\n`;
    if (spec?.javaDriver) {
      return `${header}${userCode}\n${spec.javaDriver}`;
    }
    return `${header}${userCode}`;
  }

  if (language === "cpp") {
    const header = `#include <iostream>\n#include <sstream>\n#include <string>\n#include <vector>\n#include <algorithm>\n#include <unordered_map>\n#include <map>\n#include <queue>\n#include <stack>\nusing namespace std;\n\n`;
    if (spec?.cppDriver) {
      return `${header}${userCode}\n${spec.cppDriver}`;
    }
    return `${header}${userCode}`;
  }

  return userCode;
}
