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

/**
 * Normalizes and compares actual output against expected output across formats.
 * Handles space-separated numbers vs JSON arrays (e.g., "0 1" vs "[0,1]"),
 * boolean capitalization (e.g., "True" vs "true"), and quoted strings.
 */
export function areOutputsEquivalent(
  actual: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return actual === expected;
  }
  const cleanActual = actual.trim();
  const cleanExpected = expected.trim();
  if (cleanActual === cleanExpected) return true;

  // Case-insensitive boolean match: true vs True
  if (cleanActual.toLowerCase() === cleanExpected.toLowerCase()) return true;

  // Array normalization: [0, 1] vs [0,1] vs 0 1
  const normArray = (str: string) =>
    str.replace(/[\[\]]/g, "").replace(/,/g, " ").replace(/\s+/g, " ").trim();

  const normA = normArray(cleanActual);
  const normE = normArray(cleanExpected);
  if (normA === normE && normA !== "") {
    return true;
  }

  // Quote normalization: "hello" vs hello
  const stripQuotes = (str: string) => str.replace(/^["'](.*)["']$/, "$1");
  if (stripQuotes(cleanActual) === stripQuotes(cleanExpected)) return true;

  return false;
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
    nums = _co_parse_array_int(raw, "nums")
    target = _co_parse_int(raw, "target", 0)
    sol = Solution() if 'Solution' in globals() else None
    if sol and hasattr(sol, 'twoSum'):
        ans = sol.twoSum(nums, target)
    elif 'twoSum' in globals():
        ans = twoSum(nums, target)
    elif 'solve' in globals():
        ans = solve(nums, target)
    else:
        raise Exception("Function twoSum not found")
    if ans is not None:
        print(" ".join(map(str, ans)))
`,
    jsDriver: `
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();

function _co_parse_array_int(raw, paramName) {
  const m = raw.match(new RegExp(paramName + "\\\\s*=\\\\s*(\\\\[[^\\\\]]*\\\\])"));
  if (m) {
    try { return JSON.parse(m[1]); } catch(e) {}
  }
  const mBracket = raw.match(/(\\[[^\\]]*\\])/);
  if (mBracket) {
    try { return JSON.parse(mBracket[1]); } catch(e) {}
  }
  const lines = raw.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    return (lines[0].match(/-?\\d+/g) || []).map(Number);
  }
  return [];
}

function _co_parse_int(raw, paramName, defVal) {
  if (defVal === undefined) defVal = 0;
  const m = raw.match(new RegExp(paramName + "\\\\s*=\\\\s*(-?\\d+)"));
  if (m) return parseInt(m[1], 10);
  const lines = raw.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    const m2 = lines[1].match(/-?\\d+/);
    if (m2) return parseInt(m2[0], 10);
  } else if (lines.length === 1) {
    const all = (lines[0].match(/-?\\d+/g) || []).map(Number);
    if (all.length >= 2) return all[all.length - 1];
  }
  return defVal;
}

const nums = _co_parse_array_int(raw, "nums");
const target = _co_parse_int(raw, "target", 0);
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
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\\n");
        }
        String raw = sb.toString().trim();
        java.util.List<Integer> numsList = new java.util.ArrayList<>();
        int target = 0;
        
        java.util.regex.Matcher mArray = java.util.regex.Pattern.compile("\\[([^\\]]*)\\]").matcher(raw);
        if (mArray.find()) {
            String inner = mArray.group(1);
            for (String part : inner.split("[,\\\\s]+")) {
                if (!part.trim().isEmpty()) numsList.add(Integer.parseInt(part.trim()));
            }
        }
        java.util.regex.Matcher mTarget = java.util.regex.Pattern.compile("target\\\\s*=\\\\s*(-?\\\\d+)").matcher(raw);
        if (mTarget.find()) {
            target = Integer.parseInt(mTarget.group(1));
        } else {
            String[] lines = raw.split("\\\\r?\\\\n");
            if (numsList.isEmpty() && lines.length > 0) {
                for (String part : lines[0].split("[,\\\\s]+")) {
                    if (!part.trim().isEmpty()) numsList.add(Integer.parseInt(part.trim()));
                }
            }
            if (lines.length > 1) {
                java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("-?\\\\d+").matcher(lines[1]);
                if (m2.find()) target = Integer.parseInt(m2.group());
            }
        }
        int[] nums = new int[numsList.size()];
        for (int i = 0; i < numsList.size(); i++) nums[i] = numsList.get(i);
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
    std::string raw, line;
    while (std::getline(std::cin, line)) {
        raw += line + "\\n";
    }
    std::vector<int> nums;
    int target = 0;
    size_t bOpen = raw.find('[');
    size_t bClose = raw.find(']');
    if (bOpen != std::string::npos && bClose != std::string::npos && bClose > bOpen) {
        std::string inner = raw.substr(bOpen + 1, bClose - bOpen - 1);
        std::replace(inner.begin(), inner.end(), ',', ' ');
        std::stringstream ss(inner);
        int v;
        while (ss >> v) nums.push_back(v);
    }
    size_t tPos = raw.find("target");
    if (tPos != std::string::npos) {
        size_t eqPos = raw.find('=', tPos);
        if (eqPos != std::string::npos) {
            std::stringstream ss(raw.substr(eqPos + 1));
            ss >> target;
        }
    } else {
        std::stringstream ss(raw);
        std::string l1, l2;
        if (std::getline(ss, l1) && nums.empty()) {
            std::replace(l1.begin(), l1.end(), ',', ' ');
            std::stringstream ss1(l1);
            int v;
            while (ss1 >> v) nums.push_back(v);
        }
        if (std::getline(ss, l2)) {
            std::stringstream ss2(l2);
            ss2 >> target;
        }
    }
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
    raw = sys.stdin.read().strip()
    text = _co_parse_str(raw, "s")
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
const raw = fs.readFileSync(0, "utf8").trim();
let text = raw;
if (text.includes("=")) {
  text = text.split("=")[1].trim();
}
if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
  text = text.slice(1, -1);
}
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
    raw = sys.stdin.read().strip()
    text = _co_parse_str(raw, "s")
    sol = Solution() if 'Solution' in globals() else None
    if sol and hasattr(sol, 'isValid'):
        ans = sol.isValid(text)
    elif 'isValid' in globals():
        ans = isValid(text)
    elif 'solve' in globals():
        ans = solve(text)
    else:
        raise Exception("Function isValid not found")
    print(str(bool(ans)).lower())
`,
    jsDriver: `
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
let text = raw;
if (text.includes("=")) {
  text = text.split("=")[1].trim();
}
if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
  text = text.slice(1, -1);
}
let ans = false;
if (typeof Solution !== "undefined" && new Solution().isValid) {
  ans = new Solution().isValid(text);
} else if (typeof isValid === "function") {
  ans = isValid(text);
} else if (typeof solve === "function") {
  ans = solve(text);
}
console.log(String(Boolean(ans)));
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
  "best-time-to-buy-and-sell-stock": {
    methodName: "maxProfit",
    pythonSignature: "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function maxProfit(prices) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function maxProfit(prices: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    prices = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'maxProfit'):\n        print(sol.maxProfit(prices))\n    elif 'maxProfit' in globals():\n        print(maxProfit(prices))\n    elif 'solve' in globals():\n        print(solve(prices))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst prices = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().maxProfit) {\n  ans = new Solution().maxProfit(prices);\n} else if (typeof maxProfit === \"function\") {\n  ans = maxProfit(prices);\n} else if (typeof solve === \"function\") {\n  ans = solve(prices);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] prices = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.maxProfit(prices));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> prices;\n    int val;\n    while (ss >> val) prices.push_back(val);\n    Solution sol;\n    std::cout << sol.maxProfit(prices);\n    return 0;\n}\n",
  },
  "contains-duplicate": {
    methodName: "containsDuplicate",
    pythonSignature: "class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        # Write logic here\n        return False\n",
    jsSignature: "function containsDuplicate(nums) {\n  // Write logic here\n  return false;\n}\n",
    tsSignature: "function containsDuplicate(nums: number[]): boolean {\n  // Write logic here\n  return false;\n}\n",
    javaSignature: "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write logic here\n        return false;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write logic here\n        return false;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    nums = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'containsDuplicate'):\n        print(str(sol.containsDuplicate(nums)).lower())\n    elif 'containsDuplicate' in globals():\n        print(str(containsDuplicate(nums)).lower())\n    elif 'solve' in globals():\n        print(str(solve(nums)).lower())\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst nums = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = false;\nif (typeof Solution !== \"undefined\" && new Solution().containsDuplicate) {\n  ans = new Solution().containsDuplicate(nums);\n} else if (typeof containsDuplicate === \"function\") {\n  ans = containsDuplicate(nums);\n} else if (typeof solve === \"function\") {\n  ans = solve(nums);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] nums = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(Boolean.toString(sol.containsDuplicate(nums)));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> nums;\n    int val;\n    while (ss >> val) nums.push_back(val);\n    Solution sol;\n    std::cout << (sol.containsDuplicate(nums) ? \"true\" : \"false\");\n    return 0;\n}\n",
  },
  "group-anagrams": {
    methodName: "groupAnagrams",
    pythonSignature: "class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        # Write logic here\n        return []\n",
    jsSignature: "function groupAnagrams(strs) {\n  // Write logic here\n  return [];\n}\n",
    tsSignature: "function groupAnagrams(strs: string[]): string[][] {\n  // Write logic here\n  return [];\n}\n",
    javaSignature: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write logic here\n        return new ArrayList<>();\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write logic here\n        return {};\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    strs = raw.split() if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'groupAnagrams'):\n        groups = sol.groupAnagrams(strs)\n    elif 'groupAnagrams' in globals():\n        groups = groupAnagrams(strs)\n    elif 'solve' in globals():\n        groups = solve(strs)\n    else:\n        groups = []\n    norm = [sorted(g) for g in groups]\n    norm.sort(key=lambda g: (g[0] if g else '', len(g)))\n    for g in norm:\n        print(\" \".join(g))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst strs = raw ? raw.split(/\\s+/) : [];\nlet groups = [];\nif (typeof Solution !== \"undefined\" && new Solution().groupAnagrams) {\n  groups = new Solution().groupAnagrams(strs);\n} else if (typeof groupAnagrams === \"function\") {\n  groups = groupAnagrams(strs);\n} else if (typeof solve === \"function\") {\n  groups = solve(strs);\n}\nconst norm = groups.map(g => [...g].sort()).sort((a, b) => (a[0] || '').localeCompare(b[0] || '') || a.length - b.length);\nconsole.log(norm.map(g => g.join(\" \")).join(\"\\n\"));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        String[] strs = line == null || line.trim().isEmpty() ? new String[0] : line.trim().split(\"\\\\s+\");\n        Solution sol = new Solution();\n        List<List<String>> groups = sol.groupAnagrams(strs);\n        for (List<String> g : groups) Collections.sort(g);\n        groups.sort((a, b) -> (a.isEmpty() ? \"\" : a.get(0)).compareTo(b.isEmpty() ? \"\" : b.get(0)));\n        for (int i = 0; i < groups.size(); i++) {\n            if (i > 0) System.out.println();\n            System.out.print(String.join(\" \", groups.get(i)));\n        }\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<std::string> strs;\n    std::string s;\n    while (ss >> s) strs.push_back(s);\n    Solution sol;\n    auto groups = sol.groupAnagrams(strs);\n    for (auto& g : groups) std::sort(g.begin(), g.end());\n    std::sort(groups.begin(), groups.end());\n    for (size_t i = 0; i < groups.size(); i++) {\n        if (i > 0) std::cout << \"\\n\";\n        for (size_t j = 0; j < groups[i].size(); j++) {\n            if (j) std::cout << ' ';\n            std::cout << groups[i][j];\n        }\n    }\n    return 0;\n}\n",
  },
  "encode-and-decode-strings": {
    methodName: "encodeAndDecode",
    pythonSignature: "class Solution:\n    def encode(self, strs: List[str]) -> str:\n        return \"\".join(f\"{len(s)}#{s}\" for s in strs)\n    def decode(self, s: str) -> List[str]:\n        res, i = [], 0\n        while i < len(s):\n            j = s.find(\"#\", i)\n            length = int(s[i:j])\n            res.append(s[j + 1 : j + 1 + length])\n            i = j + 1 + length\n        return res\n",
    jsSignature: "function encode(strs) {\n  return strs.map(s => s.length + '#' + s).join('');\n}\nfunction decode(s) {\n  const res = [];\n  let i = 0;\n  while (i < s.length) {\n    const hash = s.indexOf('#', i);\n    const len = parseInt(s.slice(i, hash), 10);\n    res.push(s.slice(hash + 1, hash + 1 + len));\n    i = hash + 1 + len;\n  }\n  return res;\n}\n",
    tsSignature: "function encode(strs: string[]): string {\n  return strs.map(s => s.length + '#' + s).join('');\n}\nfunction decode(s: string): string[] {\n  const res: string[] = [];\n  let i = 0;\n  while (i < s.length) {\n    const hash = s.indexOf('#', i);\n    const len = parseInt(s.slice(i, hash), 10);\n    res.push(s.slice(hash + 1, hash + 1 + len));\n    i = hash + 1 + len;\n  }\n  return res;\n}\n",
    javaSignature: "class Solution {\n    public String encode(List<String> strs) {\n        StringBuilder sb = new StringBuilder();\n        for (String s : strs) sb.append(s.length()).append('#').append(s);\n        return sb.toString();\n    }\n    public List<String> decode(String s) {\n        List<String> res = new ArrayList<>();\n        int i = 0;\n        while (i < s.length()) {\n            int hash = s.indexOf('#', i);\n            int len = Integer.parseInt(s.substring(i, hash));\n            res.add(s.substring(hash + 1, hash + 1 + len));\n            i = hash + 1 + len;\n        }\n        return res;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    string encode(vector<string>& strs) {\n        string out;\n        for (auto& s : strs) out += to_string(s.size()) + \"#\" + s;\n        return out;\n    }\n    vector<string> decode(string s) {\n        vector<string> res;\n        int i = 0;\n        while (i < (int)s.size()) {\n            int hash = s.find('#', i);\n            int len = stoi(s.substr(i, hash - i));\n            res.push_back(s.substr(hash + 1, len));\n            i = hash + 1 + len;\n        }\n        return res;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    strs = raw.split() if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'encode') and hasattr(sol, 'decode'):\n        print(\" \".join(sol.decode(sol.encode(strs))))\n    elif 'encode' in globals() and 'decode' in globals():\n        print(\" \".join(decode(encode(strs))))\n    else:\n        print(raw)\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst strs = raw ? raw.split(/\\s+/) : [];\nlet ans = strs;\nif (typeof Solution !== \"undefined\" && new Solution().encode) {\n  const s = new Solution();\n  ans = s.decode(s.encode(strs));\n} else if (typeof encode === \"function\" && typeof decode === \"function\") {\n  ans = decode(encode(strs));\n}\nconsole.log(ans.join(\" \"));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        List<String> strs = line == null || line.trim().isEmpty() ? new ArrayList<>() : Arrays.asList(line.trim().split(\"\\\\s+\"));\n        Solution sol = new Solution();\n        List<String> res = sol.decode(sol.encode(strs));\n        System.out.print(String.join(\" \", res));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<std::string> strs;\n    std::string s;\n    while (ss >> s) strs.push_back(s);\n    Solution sol;\n    auto res = sol.decode(sol.encode(strs));\n    for (size_t i = 0; i < res.size(); i++) {\n        if (i) std::cout << ' ';\n        std::cout << res[i];\n    }\n    return 0;\n}\n",
  },
  "majority-element": {
    methodName: "majorityElement",
    pythonSignature: "class Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function majorityElement(nums) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function majorityElement(nums: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int majorityElement(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    nums = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'majorityElement'):\n        print(sol.majorityElement(nums))\n    elif 'majorityElement' in globals():\n        print(majorityElement(nums))\n    elif 'solve' in globals():\n        print(solve(nums))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst nums = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().majorityElement) {\n  ans = new Solution().majorityElement(nums);\n} else if (typeof majorityElement === \"function\") {\n  ans = majorityElement(nums);\n} else if (typeof solve === \"function\") {\n  ans = solve(nums);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] nums = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.majorityElement(nums));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> nums;\n    int val;\n    while (ss >> val) nums.push_back(val);\n    Solution sol;\n    std::cout << sol.majorityElement(nums);\n    return 0;\n}\n",
  },
  "3sum": {
    methodName: "threeSum",
    pythonSignature: "class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        # Write logic here\n        return []\n",
    jsSignature: "function threeSum(nums) {\n  // Write logic here\n  return [];\n}\n",
    tsSignature: "function threeSum(nums: number[]): number[][] {\n  // Write logic here\n  return [];\n}\n",
    javaSignature: "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write logic here\n        return new ArrayList<>();\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write logic here\n        return {};\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    nums = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'threeSum'):\n        res = sol.threeSum(nums)\n    elif 'threeSum' in globals():\n        res = threeSum(nums)\n    elif 'solve' in globals():\n        res = solve(nums)\n    else:\n        res = []\n    norm = [sorted(t) for t in res]\n    norm.sort()\n    for t in norm:\n        print(\" \".join(map(str, t)))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst nums = raw ? raw.split(/\\s+/).map(Number) : [];\nlet res = [];\nif (typeof Solution !== \"undefined\" && new Solution().threeSum) {\n  res = new Solution().threeSum(nums);\n} else if (typeof threeSum === \"function\") {\n  res = threeSum(nums);\n} else if (typeof solve === \"function\") {\n  res = solve(nums);\n}\nconst norm = res.map(t => [...t].sort((a,b)=>a-b)).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);\nconsole.log(norm.map(t => t.join(\" \")).join(\"\\n\"));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] nums = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        List<List<Integer>> res = sol.threeSum(nums);\n        for (List<Integer> t : res) Collections.sort(t);\n        res.sort((a, b) -> {\n            for (int i = 0; i < 3; i++) {\n                int c = a.get(i).compareTo(b.get(i));\n                if (c != 0) return c;\n            }\n            return 0;\n        });\n        for (int i = 0; i < res.size(); i++) {\n            if (i > 0) System.out.println();\n            System.out.print(res.get(i).get(0) + \" \" + res.get(i).get(1) + \" \" + res.get(i).get(2));\n        }\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> nums;\n    int val;\n    while (ss >> val) nums.push_back(val);\n    Solution sol;\n    auto res = sol.threeSum(nums);\n    for (auto& t : res) std::sort(t.begin(), t.end());\n    std::sort(res.begin(), res.end());\n    for (size_t i = 0; i < res.size(); i++) {\n        if (i) std::cout << \"\\n\";\n        std::cout << res[i][0] << \" \" << res[i][1] << \" \" << res[i][2];\n    }\n    return 0;\n}\n",
  },
  "container-with-most-water": {
    methodName: "maxArea",
    pythonSignature: "class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function maxArea(height) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function maxArea(height: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int maxArea(int[] height) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    h = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'maxArea'):\n        print(sol.maxArea(h))\n    elif 'maxArea' in globals():\n        print(maxArea(h))\n    elif 'solve' in globals():\n        print(solve(h))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst h = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().maxArea) {\n  ans = new Solution().maxArea(h);\n} else if (typeof maxArea === \"function\") {\n  ans = maxArea(h);\n} else if (typeof solve === \"function\") {\n  ans = solve(h);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] h = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.maxArea(h));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> h;\n    int val;\n    while (ss >> val) h.push_back(val);\n    Solution sol;\n    std::cout << sol.maxArea(h);\n    return 0;\n}\n",
  },
  "trapping-rain-water": {
    methodName: "trap",
    pythonSignature: "class Solution:\n    def trap(self, height: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function trap(height) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function trap(height: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int trap(int[] height) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    h = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'trap'):\n        print(sol.trap(h))\n    elif 'trap' in globals():\n        print(trap(h))\n    elif 'solve' in globals():\n        print(solve(h))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst h = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().trap) {\n  ans = new Solution().trap(h);\n} else if (typeof trap === \"function\") {\n  ans = trap(h);\n} else if (typeof solve === \"function\") {\n  ans = solve(h);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] h = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.trap(h));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> h;\n    int val;\n    while (ss >> val) h.push_back(val);\n    Solution sol;\n    std::cout << sol.trap(h);\n    return 0;\n}\n",
  },
  "valid-palindrome": {
    methodName: "isPalindrome",
    pythonSignature: "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write logic here\n        return False\n",
    jsSignature: "function isPalindrome(s) {\n  // Write logic here\n  return false;\n}\n",
    tsSignature: "function isPalindrome(s: string): boolean {\n  // Write logic here\n  return false;\n}\n",
    javaSignature: "class Solution {\n    public boolean isPalindrome(String s) {\n        // Write logic here\n        return false;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write logic here\n        return false;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    text = sys.stdin.read().strip()\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'isPalindrome'):\n        print(str(sol.isPalindrome(text)).lower())\n    elif 'isPalindrome' in globals():\n        print(str(isPalindrome(text)).lower())\n    elif 'solve' in globals():\n        print(str(solve(text)).lower())\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst text = fs.readFileSync(0, \"utf8\").trim();\nlet ans = false;\nif (typeof Solution !== \"undefined\" && new Solution().isPalindrome) {\n  ans = new Solution().isPalindrome(text);\n} else if (typeof isPalindrome === \"function\") {\n  ans = isPalindrome(text);\n} else if (typeof solve === \"function\") {\n  ans = solve(text);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String text = reader.readLine();\n        Solution sol = new Solution();\n        System.out.print(Boolean.toString(sol.isPalindrome(text == null ? \"\" : text)));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string text;\n    std::getline(std::cin, text);\n    Solution sol;\n    std::cout << (sol.isPalindrome(text) ? \"true\" : \"false\");\n    return 0;\n}\n",
  },
  "minimum-window-substring": {
    methodName: "minWindow",
    pythonSignature: "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        # Write logic here\n        return \"\"\n",
    jsSignature: "function minWindow(s, t) {\n  // Write logic here\n  return \"\";\n}\n",
    tsSignature: "function minWindow(s: string, t: string): string {\n  // Write logic here\n  return \"\";\n}\n",
    javaSignature: "class Solution {\n    public String minWindow(String s, String t) {\n        // Write logic here\n        return \"\";\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        // Write logic here\n        return \"\";\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    s = lines[0] if lines else \"\"\n    t = lines[1] if len(lines) > 1 else \"\"\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'minWindow'):\n        print(sol.minWindow(s, t))\n    elif 'minWindow' in globals():\n        print(minWindow(s, t))\n    elif 'solve' in globals():\n        print(solve(s, t))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nconst s = lines[0] || \"\";\nconst t = lines[1] || \"\";\nlet ans = \"\";\nif (typeof Solution !== \"undefined\" && new Solution().minWindow) {\n  ans = new Solution().minWindow(s, t);\n} else if (typeof minWindow === \"function\") {\n  ans = minWindow(s, t);\n} else if (typeof solve === \"function\") {\n  ans = solve(s, t);\n}\nconsole.log(ans);\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String s = reader.readLine();\n        String t = reader.readLine();\n        Solution sol = new Solution();\n        System.out.print(sol.minWindow(s == null ? \"\" : s.trim(), t == null ? \"\" : t.trim()));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string s, t;\n    std::getline(std::cin, s);\n    std::getline(std::cin, t);\n    Solution sol;\n    std::cout << sol.minWindow(s, t);\n    return 0;\n}\n",
  },
  "longest-repeating-character-replacement": {
    methodName: "characterReplacement",
    pythonSignature: "class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function characterReplacement(s, k) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function characterReplacement(s: string, k: number): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int characterReplacement(String s, int k) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    s = lines[0] if lines else \"\"\n    k = int(lines[1]) if len(lines) > 1 else 0\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'characterReplacement'):\n        print(sol.characterReplacement(s, k))\n    elif 'characterReplacement' in globals():\n        print(characterReplacement(s, k))\n    elif 'solve' in globals():\n        print(solve(s, k))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nconst s = lines[0] || \"\";\nconst k = lines[1] ? Number(lines[1]) : 0;\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().characterReplacement) {\n  ans = new Solution().characterReplacement(s, k);\n} else if (typeof characterReplacement === \"function\") {\n  ans = characterReplacement(s, k);\n} else if (typeof solve === \"function\") {\n  ans = solve(s, k);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String s = reader.readLine();\n        String kStr = reader.readLine();\n        int k = kStr == null || kStr.trim().isEmpty() ? 0 : Integer.parseInt(kStr.trim());\n        Solution sol = new Solution();\n        System.out.print(sol.characterReplacement(s == null ? \"\" : s.trim(), k));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string s, kStr;\n    std::getline(std::cin, s);\n    std::getline(std::cin, kStr);\n    int k = kStr.empty() ? 0 : std::stoi(kStr);\n    Solution sol;\n    std::cout << sol.characterReplacement(s, k);\n    return 0;\n}\n",
  },
  "permutation-in-string": {
    methodName: "checkInclusion",
    pythonSignature: "class Solution:\n    def checkInclusion(self, s1: str, s2: str) -> bool:\n        # Write logic here\n        return False\n",
    jsSignature: "function checkInclusion(s1, s2) {\n  // Write logic here\n  return false;\n}\n",
    tsSignature: "function checkInclusion(s1: string, s2: string): boolean {\n  // Write logic here\n  return false;\n}\n",
    javaSignature: "class Solution {\n    public boolean checkInclusion(String s1, String s2) {\n        // Write logic here\n        return false;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    bool checkInclusion(string s1, string s2) {\n        // Write logic here\n        return false;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    s1 = lines[0] if lines else \"\"\n    s2 = lines[1] if len(lines) > 1 else \"\"\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'checkInclusion'):\n        print(str(sol.checkInclusion(s1, s2)).lower())\n    elif 'checkInclusion' in globals():\n        print(str(checkInclusion(s1, s2)).lower())\n    elif 'solve' in globals():\n        print(str(solve(s1, s2)).lower())\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nconst s1 = lines[0] || \"\";\nconst s2 = lines[1] || \"\";\nlet ans = false;\nif (typeof Solution !== \"undefined\" && new Solution().checkInclusion) {\n  ans = new Solution().checkInclusion(s1, s2);\n} else if (typeof checkInclusion === \"function\") {\n  ans = checkInclusion(s1, s2);\n} else if (typeof solve === \"function\") {\n  ans = solve(s1, s2);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String s1 = reader.readLine();\n        String s2 = reader.readLine();\n        Solution sol = new Solution();\n        System.out.print(Boolean.toString(sol.checkInclusion(s1 == null ? \"\" : s1.trim(), s2 == null ? \"\" : s2.trim())));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string s1, s2;\n    std::getline(std::cin, s1);\n    std::getline(std::cin, s2);\n    Solution sol;\n    std::cout << (sol.checkInclusion(s1, s2) ? \"true\" : \"false\");\n    return 0;\n}\n",
  },
  "daily-temperatures": {
    methodName: "dailyTemperatures",
    pythonSignature: "class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        # Write logic here\n        return []\n",
    jsSignature: "function dailyTemperatures(temperatures) {\n  // Write logic here\n  return [];\n}\n",
    tsSignature: "function dailyTemperatures(temperatures: number[]): number[] {\n  // Write logic here\n  return [];\n}\n",
    javaSignature: "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Write logic here\n        return new int[0];\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        // Write logic here\n        return {};\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    temps = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'dailyTemperatures'):\n        print(\" \".join(map(str, sol.dailyTemperatures(temps))))\n    elif 'dailyTemperatures' in globals():\n        print(\" \".join(map(str, dailyTemperatures(temps))))\n    elif 'solve' in globals():\n        print(\" \".join(map(str, solve(temps))))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst temps = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = [];\nif (typeof Solution !== \"undefined\" && new Solution().dailyTemperatures) {\n  ans = new Solution().dailyTemperatures(temps);\n} else if (typeof dailyTemperatures === \"function\") {\n  ans = dailyTemperatures(temps);\n} else if (typeof solve === \"function\") {\n  ans = solve(temps);\n}\nconsole.log(ans.join(\" \"));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] temps = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        int[] ans = sol.dailyTemperatures(temps);\n        for (int i = 0; i < ans.length; i++) {\n            if (i > 0) System.out.print(' ');\n            System.out.print(ans[i]);\n        }\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> temps;\n    int val;\n    while (ss >> val) temps.push_back(val);\n    Solution sol;\n    auto ans = sol.dailyTemperatures(temps);\n    for (size_t i = 0; i < ans.size(); i++) {\n        if (i) std::cout << ' ';\n        std::cout << ans[i];\n    }\n    return 0;\n}\n",
  },
  "car-fleet": {
    methodName: "carFleet",
    pythonSignature: "class Solution:\n    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function carFleet(target, position, speed) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function carFleet(target: number, position: number[], speed: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int carFleet(int target, int[] position, int[] speed) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int carFleet(int target, vector<int>& position, vector<int>& speed) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    target = int(lines[0]) if lines else 0\n    pos = list(map(int, lines[1].split())) if len(lines) > 1 else []\n    spd = list(map(int, lines[2].split())) if len(lines) > 2 else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'carFleet'):\n        print(sol.carFleet(target, pos, spd))\n    elif 'carFleet' in globals():\n        print(carFleet(target, pos, spd))\n    elif 'solve' in globals():\n        print(solve(target, pos, spd))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nconst target = lines[0] ? Number(lines[0]) : 0;\nconst pos = lines[1] ? lines[1].trim().split(/\\s+/).map(Number) : [];\nconst spd = lines[2] ? lines[2].trim().split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().carFleet) {\n  ans = new Solution().carFleet(target, pos, spd);\n} else if (typeof carFleet === \"function\") {\n  ans = carFleet(target, pos, spd);\n} else if (typeof solve === \"function\") {\n  ans = solve(target, pos, spd);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        int target = Integer.parseInt(reader.readLine().trim());\n        String pLine = reader.readLine();\n        String sLine = reader.readLine();\n        int[] pos = pLine == null || pLine.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(pLine.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        int[] spd = sLine == null || sLine.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(sLine.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.carFleet(target, pos, spd));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int target = 0;\n    std::cin >> target;\n    std::string dummy;\n    std::getline(std::cin, dummy);\n    std::string pLine, sLine;\n    std::getline(std::cin, pLine);\n    std::getline(std::cin, sLine);\n    std::stringstream ss1(pLine), ss2(sLine);\n    std::vector<int> pos, spd;\n    int v;\n    while (ss1 >> v) pos.push_back(v);\n    while (ss2 >> v) spd.push_back(v);\n    Solution sol;\n    std::cout << sol.carFleet(target, pos, spd);\n    return 0;\n}\n",
  },
  "largest-rectangle-in-histogram": {
    methodName: "largestRectangleArea",
    pythonSignature: "class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function largestRectangleArea(heights) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function largestRectangleArea(heights: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    heights = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'largestRectangleArea'):\n        print(sol.largestRectangleArea(heights))\n    elif 'largestRectangleArea' in globals():\n        print(largestRectangleArea(heights))\n    elif 'solve' in globals():\n        print(solve(heights))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst heights = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().largestRectangleArea) {\n  ans = new Solution().largestRectangleArea(heights);\n} else if (typeof largestRectangleArea === \"function\") {\n  ans = largestRectangleArea(heights);\n} else if (typeof solve === \"function\") {\n  ans = solve(heights);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] heights = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.largestRectangleArea(heights));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> heights;\n    int val;\n    while (ss >> val) heights.push_back(val);\n    Solution sol;\n    std::cout << sol.largestRectangleArea(heights);\n    return 0;\n}\n",
  },
  "koko-eating-bananas": {
    methodName: "minEatingSpeed",
    pythonSignature: "class Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function minEatingSpeed(piles, h) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function minEatingSpeed(piles: number[], h: number): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int minEatingSpeed(vector<int>& piles, int h) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    piles = list(map(int, lines[0].split())) if lines else []\n    h = int(lines[1]) if len(lines) > 1 else 0\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'minEatingSpeed'):\n        print(sol.minEatingSpeed(piles, h))\n    elif 'minEatingSpeed' in globals():\n        print(minEatingSpeed(piles, h))\n    elif 'solve' in globals():\n        print(solve(piles, h))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nconst piles = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [];\nconst h = lines[1] ? Number(lines[1]) : 0;\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().minEatingSpeed) {\n  ans = new Solution().minEatingSpeed(piles, h);\n} else if (typeof minEatingSpeed === \"function\") {\n  ans = minEatingSpeed(piles, h);\n} else if (typeof solve === \"function\") {\n  ans = solve(piles, h);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String pLine = reader.readLine();\n        String hLine = reader.readLine();\n        int[] piles = pLine == null || pLine.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(pLine.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        int h = hLine == null || hLine.trim().isEmpty() ? 0 : Integer.parseInt(hLine.trim());\n        Solution sol = new Solution();\n        System.out.print(sol.minEatingSpeed(piles, h));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string pLine, hLine;\n    std::getline(std::cin, pLine);\n    std::getline(std::cin, hLine);\n    std::stringstream ss(pLine);\n    std::vector<int> piles;\n    int val;\n    while (ss >> val) piles.push_back(val);\n    int h = hLine.empty() ? 0 : std::stoi(hLine);\n    Solution sol;\n    std::cout << sol.minEatingSpeed(piles, h);\n    return 0;\n}\n",
  },
  "search-a-2d-matrix": {
    methodName: "searchMatrix",
    pythonSignature: "class Solution:\n    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:\n        # Write logic here\n        return False\n",
    jsSignature: "function searchMatrix(matrix, target) {\n  // Write logic here\n  return false;\n}\n",
    tsSignature: "function searchMatrix(matrix: number[][], target: number): boolean {\n  // Write logic here\n  return false;\n}\n",
    javaSignature: "class Solution {\n    public boolean searchMatrix(int[][] matrix, int target) {\n        // Write logic here\n        return false;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    bool searchMatrix(vector<vector<int>>& matrix, int target) {\n        // Write logic here\n        return false;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    if not lines:\n        print(\"false\")\n        sys.exit(0)\n    dims = list(map(int, lines[0].split()))\n    m, n = dims[0], dims[1]\n    matrix = [list(map(int, lines[i+1].split())) for i in range(m)]\n    target = int(lines[m+1]) if len(lines) > m+1 else 0\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'searchMatrix'):\n        print(str(sol.searchMatrix(matrix, target)).lower())\n    elif 'searchMatrix' in globals():\n        print(str(searchMatrix(matrix, target)).lower())\n    elif 'solve' in globals():\n        print(str(solve(matrix, target)).lower())\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nif (!lines.length) { console.log(\"false\"); process.exit(0); }\nconst [m, n] = lines[0].trim().split(/\\s+/).map(Number);\nconst matrix = [];\nfor (let i = 1; i <= m; i++) {\n  matrix.push(lines[i].trim().split(/\\s+/).map(Number));\n}\nconst target = lines[m + 1] ? Number(lines[m + 1]) : 0;\nlet ans = false;\nif (typeof Solution !== \"undefined\" && new Solution().searchMatrix) {\n  ans = new Solution().searchMatrix(matrix, target);\n} else if (typeof searchMatrix === \"function\") {\n  ans = searchMatrix(matrix, target);\n} else if (typeof solve === \"function\") {\n  ans = solve(matrix, target);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String dimLine = reader.readLine();\n        if (dimLine == null) return;\n        String[] dims = dimLine.trim().split(\"\\\\s+\");\n        int m = Integer.parseInt(dims[0]), n = Integer.parseInt(dims[1]);\n        int[][] matrix = new int[m][n];\n        for (int i = 0; i < m; i++) {\n            String[] parts = reader.readLine().trim().split(\"\\\\s+\");\n            for (int j = 0; j < n; j++) matrix[i][j] = Integer.parseInt(parts[j]);\n        }\n        int target = Integer.parseInt(reader.readLine().trim());\n        Solution sol = new Solution();\n        System.out.print(Boolean.toString(sol.searchMatrix(matrix, target)));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int m, n;\n    if (!(std::cin >> m >> n)) return 0;\n    std::vector<std::vector<int>> matrix(m, std::vector<int>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++)\n            std::cin >> matrix[i][j];\n    int target;\n    std::cin >> target;\n    Solution sol;\n    std::cout << (sol.searchMatrix(matrix, target) ? \"true\" : \"false\");\n    return 0;\n}\n",
  },
  "find-minimum-in-rotated-sorted-array": {
    methodName: "findMin",
    pythonSignature: "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function findMin(nums) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function findMin(nums: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int findMin(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    nums = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'findMin'):\n        print(sol.findMin(nums))\n    elif 'findMin' in globals():\n        print(findMin(nums))\n    elif 'solve' in globals():\n        print(solve(nums))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst nums = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().findMin) {\n  ans = new Solution().findMin(nums);\n} else if (typeof findMin === \"function\") {\n  ans = findMin(nums);\n} else if (typeof solve === \"function\") {\n  ans = solve(nums);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] nums = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.findMin(nums));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> nums;\n    int val;\n    while (ss >> val) nums.push_back(val);\n    Solution sol;\n    std::cout << sol.findMin(nums);\n    return 0;\n}\n",
  },
  "reverse-linked-list": {
    methodName: "reverseList",
    pythonSignature: "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        # Write logic here\n        return None\n",
    jsSignature: "function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}\n",
    tsSignature: "function reverseList(head: ListNode | null): ListNode | null {\n  let prev: ListNode | null = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}\n",
    javaSignature: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) {\n            ListNode next = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        ListNode* curr = head;\n        while (curr) {\n            ListNode* next = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n};\n",
    pythonDriver: "\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    vals = list(map(int, raw.split())) if raw else []\n    head = None\n    curr = None\n    for v in vals:\n        n = ListNode(v)\n        if not head: head = n; curr = n\n        else: curr.next = n; curr = n\n    sol = Solution() if 'Solution' in globals() else None\n    res = sol.reverseList(head) if sol and hasattr(sol, 'reverseList') else reverseList(head) if 'reverseList' in globals() else None\n    out = []\n    while res:\n        out.append(str(res.val))\n        res = res.next\n    print(\" \".join(out))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nfunction ListNode(val, next) { this.val = val; this.next = next || null; }\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst vals = raw ? raw.split(/\\s+/).map(Number) : [];\nlet head = null, tail = null;\nfor (const v of vals) {\n  const n = new ListNode(v);\n  if (!head) { head = n; tail = n; } else { tail.next = n; tail = n; }\n}\nlet res = null;\nif (typeof Solution !== \"undefined\" && new Solution().reverseList) {\n  res = new Solution().reverseList(head);\n} else if (typeof reverseList === \"function\") {\n  res = reverseList(head);\n}\nconst out = [];\nwhile (res) { out.push(res.val); res = res.next; }\nconsole.log(out.join(\" \"));\n",
    javaDriver: "\nclass ListNode {\n    int val; ListNode next;\n    ListNode(int x) { val = x; }\n}\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] vals = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        ListNode head = null, tail = null;\n        for (int v : vals) {\n            ListNode n = new ListNode(v);\n            if (head == null) { head = n; tail = n; } else { tail.next = n; tail = n; }\n        }\n        Solution sol = new Solution();\n        ListNode res = sol.reverseList(head);\n        StringBuilder sb = new StringBuilder();\n        while (res != null) {\n            if (sb.length() > 0) sb.append(' ');\n            sb.append(res.val);\n            res = res.next;\n        }\n        System.out.print(sb.toString());\n    }\n}\n",
    cppDriver: "\nstruct ListNode { int val; ListNode *next; ListNode(int x) : val(x), next(NULL) {} };\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> vals;\n    int v;\n    while (ss >> v) vals.push_back(v);\n    ListNode* head = nullptr, *tail = nullptr;\n    for (int x : vals) {\n        ListNode* n = new ListNode(x);\n        if (!head) { head = n; tail = n; } else { tail->next = n; tail = n; }\n    }\n    Solution sol;\n    ListNode* res = sol.reverseList(head);\n    bool first = true;\n    while (res) {\n        if (!first) std::cout << ' ';\n        std::cout << res->val;\n        first = false;\n        res = res->next;\n    }\n    return 0;\n}\n",
  },
  "merge-two-sorted-lists": {
    methodName: "mergeTwoLists",
    pythonSignature: "class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        # Write logic here\n        return None\n",
    jsSignature: "function mergeTwoLists(list1, list2) {\n  // Write logic here\n  return null;\n}\n",
    tsSignature: "function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n  // Write logic here\n  return null;\n}\n",
    javaSignature: "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write logic here\n        return null;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write logic here\n        return nullptr;\n    }\n};\n",
    pythonDriver: "\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\ndef build(vals):\n    h = c = None\n    for v in vals:\n        n = ListNode(v)\n        if not h: h = c = n\n        else: c.next = n; c = n\n    return h\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    v1 = list(map(int, lines[0].split())) if lines and lines[0].strip() else []\n    v2 = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []\n    l1, l2 = build(v1), build(v2)\n    sol = Solution() if 'Solution' in globals() else None\n    res = sol.mergeTwoLists(l1, l2) if sol and hasattr(sol, 'mergeTwoLists') else mergeTwoLists(l1, l2) if 'mergeTwoLists' in globals() else None\n    out = []\n    while res:\n        out.append(str(res.val))\n        res = res.next\n    print(\" \".join(out))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nfunction ListNode(val, next) { this.val = val; this.next = next || null; }\nfunction build(vals) {\n  let h = null, c = null;\n  for (const v of vals) {\n    const n = new ListNode(v);\n    if (!h) { h = n; c = n; } else { c.next = n; c = n; }\n  }\n  return h;\n}\nconst lines = fs.readFileSync(0, \"utf8\").split(/\\r?\\n/);\nconst v1 = lines[0] && lines[0].trim() ? lines[0].trim().split(/\\s+/).map(Number) : [];\nconst v2 = lines[1] && lines[1].trim() ? lines[1].trim().split(/\\s+/).map(Number) : [];\nconst l1 = build(v1), l2 = build(v2);\nlet res = null;\nif (typeof Solution !== \"undefined\" && new Solution().mergeTwoLists) {\n  res = new Solution().mergeTwoLists(l1, l2);\n} else if (typeof mergeTwoLists === \"function\") {\n  res = mergeTwoLists(l1, l2);\n}\nconst out = [];\nwhile (res) { out.push(res.val); res = res.next; }\nconsole.log(out.join(\" \"));\n",
    javaDriver: "\nclass ListNode { int val; ListNode next; ListNode(int x) { val = x; } }\npublic class Main {\n    static ListNode build(int[] vals) {\n        ListNode h = null, c = null;\n        for (int v : vals) {\n            ListNode n = new ListNode(v);\n            if (h == null) { h = n; c = n; } else { c.next = n; c = n; }\n        }\n        return h;\n    }\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String l1Str = reader.readLine();\n        String l2Str = reader.readLine();\n        int[] v1 = l1Str == null || l1Str.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(l1Str.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        int[] v2 = l2Str == null || l2Str.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(l2Str.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        ListNode res = sol.mergeTwoLists(build(v1), build(v2));\n        StringBuilder sb = new StringBuilder();\n        while (res != null) {\n            if (sb.length() > 0) sb.append(' ');\n            sb.append(res.val);\n            res = res.next;\n        }\n        System.out.print(sb.toString());\n    }\n}\n",
    cppDriver: "\nstruct ListNode { int val; ListNode *next; ListNode(int x) : val(x), next(NULL) {} };\nListNode* build(const std::vector<int>& vals) {\n    ListNode* h = nullptr, *c = nullptr;\n    for (int v : vals) {\n        ListNode* n = new ListNode(v);\n        if (!h) { h = n; c = n; } else { c->next = n; c = n; }\n    }\n    return h;\n}\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string l1Str, l2Str;\n    std::getline(std::cin, l1Str);\n    std::getline(std::cin, l2Str);\n    std::stringstream ss1(l1Str), ss2(l2Str);\n    std::vector<int> v1, v2;\n    int val;\n    while (ss1 >> val) v1.push_back(val);\n    while (ss2 >> val) v2.push_back(val);\n    Solution sol;\n    ListNode* res = sol.mergeTwoLists(build(v1), build(v2));\n    bool first = true;\n    while (res) {\n        if (!first) std::cout << ' ';\n        std::cout << res->val;\n        first = false;\n        res = res->next;\n    }\n    return 0;\n}\n",
  },
  "lru-cache": {
    methodName: "LRUCache",
    pythonSignature: "class LRUCache:\n    def __init__(self, capacity: int):\n        # Write logic here\n        pass\n    def get(self, key: int) -> int:\n        return -1\n    def put(self, key: int, value: int) -> None:\n        pass\n",
    jsSignature: "class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    if (this.map.has(key)) this.map.delete(key);\n    this.map.set(key, value);\n    if (this.map.size > this.capacity) {\n      this.map.delete(this.map.keys().next().value);\n    }\n  }\n}\n",
    tsSignature: "class LRUCache {\n  constructor(capacity: number) {\n    this.capacity = capacity;\n  }\n  get(key: number): number {\n    return -1;\n  }\n  put(key: number, value: number): void {}\n}\n",
    javaSignature: "class LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}\n",
    cppSignature: "class LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) { return -1; }\n    void put(int key, int value) {}\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    if not lines: sys.exit(0)\n    cap = int(lines[0])\n    cache = LRUCache(cap)\n    out = []\n    for line in lines[1:]:\n        parts = line.split()\n        if not parts: continue\n        if parts[0] == \"get\":\n            out.append(str(cache.get(int(parts[1]))))\n        elif parts[0] == \"put\":\n            cache.put(int(parts[1]), int(parts[2]))\n    print(\" \".join(out))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nif (!lines.length) process.exit(0);\nconst cap = Number(lines[0]);\nconst cache = new LRUCache(cap);\nconst out = [];\nfor (let i = 1; i < lines.length; i++) {\n  const parts = lines[i].trim().split(/\\s+/);\n  if (!parts[0]) continue;\n  if (parts[0] === \"get\") {\n    out.push(cache.get(Number(parts[1])));\n  } else if (parts[0] === \"put\") {\n    cache.put(Number(parts[1]), Number(parts[2]));\n  }\n}\nconsole.log(out.join(\" \"));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String capLine = reader.readLine();\n        if (capLine == null) return;\n        int cap = Integer.parseInt(capLine.trim());\n        LRUCache cache = new LRUCache(cap);\n        StringBuilder sb = new StringBuilder();\n        String line;\n        while ((line = reader.readLine()) != null) {\n            String[] parts = line.trim().split(\"\\\\s+\");\n            if (parts.length == 0 || parts[0].isEmpty()) continue;\n            if (parts[0].equals(\"get\")) {\n                if (sb.length() > 0) sb.append(' ');\n                sb.append(cache.get(Integer.parseInt(parts[1])));\n            } else if (parts[0].equals(\"put\")) {\n                cache.put(Integer.parseInt(parts[1]), Integer.parseInt(parts[2]));\n            }\n        }\n        System.out.print(sb.toString());\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int cap;\n    if (!(std::cin >> cap)) return 0;\n    LRUCache cache(cap);\n    std::string op;\n    bool first = true;\n    while (std::cin >> op) {\n        if (op == \"get\") {\n            int k;\n            std::cin >> k;\n            if (!first) std::cout << ' ';\n            std::cout << cache.get(k);\n            first = false;\n        } else if (op == \"put\") {\n            int k, v;\n            std::cin >> k >> v;\n            cache.put(k, v);\n        }\n    }\n    return 0;\n}\n",
  },
  "invert-binary-tree": {
    methodName: "invertTree",
    pythonSignature: "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        # Write logic here\n        return None\n",
    jsSignature: "function invertTree(root) {\n  if (!root) return null;\n  const tmp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(tmp);\n  return root;\n}\n",
    tsSignature: "function invertTree(root: TreeNode | null): TreeNode | null {\n  if (!root) return null;\n  const tmp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(tmp);\n  return root;\n}\n",
    javaSignature: "class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        if (root == null) return null;\n        TreeNode tmp = root.left;\n        root.left = invertTree(root.right);\n        root.right = invertTree(tmp);\n        return root;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        if (!root) return nullptr;\n        TreeNode* tmp = root->left;\n        root->left = invertTree(root->right);\n        root->right = invertTree(tmp);\n        return root;\n    }\n};\n",
    pythonDriver: "\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\ndef buildTree(vals):\n    if not vals: return None\n    nodes = [TreeNode(int(v)) if v != \"null\" else None for v in vals]\n    kids = nodes[::-1]\n    root = kids.pop()\n    for n in nodes:\n        if n:\n            if kids: n.left = kids.pop()\n            if kids: n.right = kids.pop()\n    return root\ndef toList(root):\n    if not root: return []\n    q = [root]\n    res = []\n    while q:\n        curr = q.pop(0)\n        if curr:\n            res.append(str(curr.val))\n            q.append(curr.left)\n            q.append(curr.right)\n    while res and res[-1] == \"null\": res.pop()\n    return res\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    vals = raw.split() if raw else []\n    root = buildTree(vals)\n    sol = Solution() if 'Solution' in globals() else None\n    res = sol.invertTree(root) if sol and hasattr(sol, 'invertTree') else invertTree(root) if 'invertTree' in globals() else None\n    print(\" \".join(toList(res)))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nfunction TreeNode(val, left, right) {\n  this.val = val; this.left = left || null; this.right = right || null;\n}\nfunction buildTree(vals) {\n  if (!vals.length) return null;\n  const nodes = vals.map(v => v === \"null\" ? null : new TreeNode(Number(v)));\n  const kids = [...nodes].reverse();\n  const root = kids.pop();\n  for (const n of nodes) {\n    if (n) {\n      if (kids.length) n.left = kids.pop();\n      if (kids.length) n.right = kids.pop();\n    }\n  }\n  return root;\n}\nfunction toList(root) {\n  if (!root) return [];\n  const q = [root], res = [];\n  while (q.length) {\n    const curr = q.shift();\n    if (curr) {\n      res.push(curr.val);\n      q.push(curr.left);\n      q.push(curr.right);\n    }\n  }\n  return res;\n}\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst vals = raw ? raw.split(/\\s+/) : [];\nconst root = buildTree(vals);\nlet res = null;\nif (typeof Solution !== \"undefined\" && new Solution().invertTree) {\n  res = new Solution().invertTree(root);\n} else if (typeof invertTree === \"function\") {\n  res = invertTree(root);\n}\nconsole.log(toList(res).join(\" \"));\n",
    javaDriver: "\nclass TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }\npublic class Main {\n    static TreeNode buildTree(String[] vals) {\n        if (vals.length == 0) return null;\n        TreeNode[] nodes = new TreeNode[vals.length];\n        for (int i = 0; i < vals.length; i++) nodes[i] = vals[i].equals(\"null\") ? null : new TreeNode(Integer.parseInt(vals[i]));\n        int child = 1;\n        for (int i = 0; i < vals.length && child < vals.length; i++) {\n            if (nodes[i] != null) {\n                if (child < vals.length) nodes[i].left = nodes[child++];\n                if (child < vals.length) nodes[i].right = nodes[child++];\n            }\n        }\n        return nodes[0];\n    }\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        String[] vals = line == null || line.trim().isEmpty() ? new String[0] : line.trim().split(\"\\\\s+\");\n        TreeNode root = buildTree(vals);\n        Solution sol = new Solution();\n        TreeNode res = sol.invertTree(root);\n        StringBuilder sb = new StringBuilder();\n        java.util.Queue<TreeNode> q = new java.util.LinkedList<>();\n        if (res != null) q.add(res);\n        while (!q.isEmpty()) {\n            TreeNode curr = q.poll();\n            if (curr != null) {\n                if (sb.length() > 0) sb.append(' ');\n                sb.append(curr.val);\n                q.add(curr.left);\n                q.add(curr.right);\n            }\n        }\n        System.out.print(sb.toString());\n    }\n}\n",
    cppDriver: "\nstruct TreeNode { int val; TreeNode *left, *right; TreeNode(int x) : val(x), left(NULL), right(NULL) {} };\nTreeNode* buildTree(const std::vector<std::string>& vals) {\n    if (vals.empty()) return nullptr;\n    std::vector<TreeNode*> nodes;\n    for (auto& s : vals) nodes.push_back(s == \"null\" ? nullptr : new TreeNode(std::stoi(s)));\n    int child = 1;\n    for (size_t i = 0; i < nodes.size() && child < (int)nodes.size(); i++) {\n        if (nodes[i]) {\n            if (child < (int)nodes.size()) nodes[i]->left = nodes[child++];\n            if (child < (int)nodes.size()) nodes[i]->right = nodes[child++];\n        }\n    }\n    return nodes[0];\n}\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<std::string> vals;\n    std::string s;\n    while (ss >> s) vals.push_back(s);\n    TreeNode* root = buildTree(vals);\n    Solution sol;\n    TreeNode* res = sol.invertTree(root);\n    std::queue<TreeNode*> q;\n    if (res) q.push(res);\n    bool first = true;\n    while (!q.empty()) {\n        TreeNode* curr = q.front(); q.pop();\n        if (curr) {\n            if (!first) std::cout << ' ';\n            std::cout << curr->val;\n            first = false;\n            q.push(curr->left);\n            q.push(curr->right);\n        }\n    }\n    return 0;\n}\n",
  },
  "binary-tree-level-order-traversal": {
    methodName: "levelOrder",
    pythonSignature: "class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        # Write logic here\n        return []\n",
    jsSignature: "function levelOrder(root) {\n  // Write logic here\n  return [];\n}\n",
    tsSignature: "function levelOrder(root: TreeNode | null): number[][] {\n  // Write logic here\n  return [];\n}\n",
    javaSignature: "class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // Write logic here\n        return new ArrayList<>();\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // Write logic here\n        return {};\n    }\n};\n",
    pythonDriver: "\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\ndef buildTree(vals):\n    if not vals: return None\n    nodes = [TreeNode(int(v)) if v != \"null\" else None for v in vals]\n    kids = nodes[::-1]\n    root = kids.pop()\n    for n in nodes:\n        if n:\n            if kids: n.left = kids.pop()\n            if kids: n.right = kids.pop()\n    return root\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    vals = raw.split() if raw else []\n    root = buildTree(vals)\n    sol = Solution() if 'Solution' in globals() else None\n    res = sol.levelOrder(root) if sol and hasattr(sol, 'levelOrder') else levelOrder(root) if 'levelOrder' in globals() else []\n    for lvl in res:\n        print(\" \".join(map(str, lvl)))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nfunction TreeNode(val, left, right) {\n  this.val = val; this.left = left || null; this.right = right || null;\n}\nfunction buildTree(vals) {\n  if (!vals.length) return null;\n  const nodes = vals.map(v => v === \"null\" ? null : new TreeNode(Number(v)));\n  const kids = [...nodes].reverse();\n  const root = kids.pop();\n  for (const n of nodes) {\n    if (n) {\n      if (kids.length) n.left = kids.pop();\n      if (kids.length) n.right = kids.pop();\n    }\n  }\n  return root;\n}\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst vals = raw ? raw.split(/\\s+/) : [];\nconst root = buildTree(vals);\nlet res = [];\nif (typeof Solution !== \"undefined\" && new Solution().levelOrder) {\n  res = new Solution().levelOrder(root);\n} else if (typeof levelOrder === \"function\") {\n  res = levelOrder(root);\n}\nconsole.log(res.map(lvl => lvl.join(\" \")).join(\"\\n\"));\n",
    javaDriver: "\nclass TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }\npublic class Main {\n    static TreeNode buildTree(String[] vals) {\n        if (vals.length == 0) return null;\n        TreeNode[] nodes = new TreeNode[vals.length];\n        for (int i = 0; i < vals.length; i++) nodes[i] = vals[i].equals(\"null\") ? null : new TreeNode(Integer.parseInt(vals[i]));\n        int child = 1;\n        for (int i = 0; i < vals.length && child < vals.length; i++) {\n            if (nodes[i] != null) {\n                if (child < vals.length) nodes[i].left = nodes[child++];\n                if (child < vals.length) nodes[i].right = nodes[child++];\n            }\n        }\n        return nodes[0];\n    }\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        String[] vals = line == null || line.trim().isEmpty() ? new String[0] : line.trim().split(\"\\\\s+\");\n        TreeNode root = buildTree(vals);\n        Solution sol = new Solution();\n        List<List<Integer>> res = sol.levelOrder(root);\n        for (int i = 0; i < res.size(); i++) {\n            if (i > 0) System.out.println();\n            for (int j = 0; j < res.get(i).size(); j++) {\n                if (j > 0) System.out.print(' ');\n                System.out.print(res.get(i).get(j));\n            }\n        }\n    }\n}\n",
    cppDriver: "\nstruct TreeNode { int val; TreeNode *left, *right; TreeNode(int x) : val(x), left(NULL), right(NULL) {} };\nTreeNode* buildTree(const std::vector<std::string>& vals) {\n    if (vals.empty()) return nullptr;\n    std::vector<TreeNode*> nodes;\n    for (auto& s : vals) nodes.push_back(s == \"null\" ? nullptr : new TreeNode(std::stoi(s)));\n    int child = 1;\n    for (size_t i = 0; i < nodes.size() && child < (int)nodes.size(); i++) {\n        if (nodes[i]) {\n            if (child < (int)nodes.size()) nodes[i]->left = nodes[child++];\n            if (child < (int)nodes.size()) nodes[i]->right = nodes[child++];\n        }\n    }\n    return nodes[0];\n}\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<std::string> vals;\n    std::string s;\n    while (ss >> s) vals.push_back(s);\n    TreeNode* root = buildTree(vals);\n    Solution sol;\n    auto res = sol.levelOrder(root);\n    for (size_t i = 0; i < res.size(); i++) {\n        if (i) std::cout << \"\\n\";\n        for (size_t j = 0; j < res[i].size(); j++) {\n            if (j) std::cout << ' ';\n            std::cout << res[i][j];\n        }\n    }\n    return 0;\n}\n",
  },
  "validate-binary-search-tree": {
    methodName: "isValidBST",
    pythonSignature: "class Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        # Write logic here\n        return False\n",
    jsSignature: "function isValidBST(root) {\n  // Write logic here\n  return false;\n}\n",
    tsSignature: "function isValidBST(root: TreeNode | null): boolean {\n  // Write logic here\n  return false;\n}\n",
    javaSignature: "class Solution {\n    public boolean isValidBST(TreeNode root) {\n        // Write logic here\n        return false;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        // Write logic here\n        return false;\n    }\n};\n",
    pythonDriver: "\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\ndef buildTree(vals):\n    if not vals: return None\n    nodes = [TreeNode(int(v)) if v != \"null\" else None for v in vals]\n    kids = nodes[::-1]\n    root = kids.pop()\n    for n in nodes:\n        if n:\n            if kids: n.left = kids.pop()\n            if kids: n.right = kids.pop()\n    return root\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    vals = raw.split() if raw else []\n    root = buildTree(vals)\n    sol = Solution() if 'Solution' in globals() else None\n    res = sol.isValidBST(root) if sol and hasattr(sol, 'isValidBST') else isValidBST(root) if 'isValidBST' in globals() else False\n    print(str(res).lower())\n",
    jsDriver: "\nconst fs = require(\"fs\");\nfunction TreeNode(val, left, right) {\n  this.val = val; this.left = left || null; this.right = right || null;\n}\nfunction buildTree(vals) {\n  if (!vals.length) return null;\n  const nodes = vals.map(v => v === \"null\" ? null : new TreeNode(Number(v)));\n  const kids = [...nodes].reverse();\n  const root = kids.pop();\n  for (const n of nodes) {\n    if (n) {\n      if (kids.length) n.left = kids.pop();\n      if (kids.length) n.right = kids.pop();\n    }\n  }\n  return root;\n}\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst vals = raw ? raw.split(/\\s+/) : [];\nconst root = buildTree(vals);\nlet res = false;\nif (typeof Solution !== \"undefined\" && new Solution().isValidBST) {\n  res = new Solution().isValidBST(root);\n} else if (typeof isValidBST === \"function\") {\n  res = isValidBST(root);\n}\nconsole.log(String(res));\n",
    javaDriver: "\nclass TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }\npublic class Main {\n    static TreeNode buildTree(String[] vals) {\n        if (vals.length == 0) return null;\n        TreeNode[] nodes = new TreeNode[vals.length];\n        for (int i = 0; i < vals.length; i++) nodes[i] = vals[i].equals(\"null\") ? null : new TreeNode(Integer.parseInt(vals[i]));\n        int child = 1;\n        for (int i = 0; i < vals.length && child < vals.length; i++) {\n            if (nodes[i] != null) {\n                if (child < vals.length) nodes[i].left = nodes[child++];\n                if (child < vals.length) nodes[i].right = nodes[child++];\n            }\n        }\n        return nodes[0];\n    }\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        String[] vals = line == null || line.trim().isEmpty() ? new String[0] : line.trim().split(\"\\\\s+\");\n        TreeNode root = buildTree(vals);\n        Solution sol = new Solution();\n        System.out.print(Boolean.toString(sol.isValidBST(root)));\n    }\n}\n",
    cppDriver: "\nstruct TreeNode { int val; TreeNode *left, *right; TreeNode(int x) : val(x), left(NULL), right(NULL) {} };\nTreeNode* buildTree(const std::vector<std::string>& vals) {\n    if (vals.empty()) return nullptr;\n    std::vector<TreeNode*> nodes;\n    for (auto& s : vals) nodes.push_back(s == \"null\" ? nullptr : new TreeNode(std::stoi(s)));\n    int child = 1;\n    for (size_t i = 0; i < nodes.size() && child < (int)nodes.size(); i++) {\n        if (nodes[i]) {\n            if (child < (int)nodes.size()) nodes[i]->left = nodes[child++];\n            if (child < (int)nodes.size()) nodes[i]->right = nodes[child++];\n        }\n    }\n    return nodes[0];\n}\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<std::string> vals;\n    std::string s;\n    while (ss >> s) vals.push_back(s);\n    TreeNode* root = buildTree(vals);\n    Solution sol;\n    std::cout << (sol.isValidBST(root) ? \"true\" : \"false\");\n    return 0;\n}\n",
  },
  "lowest-common-ancestor-of-a-binary-search-tree": {
    methodName: "lowestCommonAncestor",
    pythonSignature: "class Solution:\n    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':\n        # Write logic here\n        return root\n",
    jsSignature: "function lowestCommonAncestor(root, p, q) {\n  // Write logic here\n  return root;\n}\n",
    tsSignature: "function lowestCommonAncestor(root: TreeNode | null, p: TreeNode | null, q: TreeNode | null): TreeNode | null {\n  // Write logic here\n  return root;\n}\n",
    javaSignature: "class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        // Write logic here\n        return root;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        // Write logic here\n        return root;\n    }\n};\n",
    pythonDriver: "\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\ndef buildTree(vals):\n    if not vals: return None\n    nodes = [TreeNode(int(v)) if v != \"null\" else None for v in vals]\n    kids = nodes[::-1]\n    root = kids.pop()\n    for n in nodes:\n        if n:\n            if kids: n.left = kids.pop()\n            if kids: n.right = kids.pop()\n    return root\ndef findNode(root, val):\n    if not root: return None\n    if root.val == val: return root\n    return findNode(root.left, val) or findNode(root.right, val)\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    vals = lines[0].split() if lines else []\n    root = buildTree(vals)\n    pq = list(map(int, lines[1].split())) if len(lines) > 1 else [0, 0]\n    p, q = findNode(root, pq[0]), findNode(root, pq[1])\n    sol = Solution() if 'Solution' in globals() else None\n    res = sol.lowestCommonAncestor(root, p, q) if sol and hasattr(sol, 'lowestCommonAncestor') else lowestCommonAncestor(root, p, q) if 'lowestCommonAncestor' in globals() else None\n    print(res.val if res else \"\")\n",
    jsDriver: "\nconst fs = require(\"fs\");\nfunction TreeNode(val, left, right) {\n  this.val = val; this.left = left || null; this.right = right || null;\n}\nfunction buildTree(vals) {\n  if (!vals.length) return null;\n  const nodes = vals.map(v => v === \"null\" ? null : new TreeNode(Number(v)));\n  const kids = [...nodes].reverse();\n  const root = kids.pop();\n  for (const n of nodes) {\n    if (n) {\n      if (kids.length) n.left = kids.pop();\n      if (kids.length) n.right = kids.pop();\n    }\n  }\n  return root;\n}\nfunction findNode(root, val) {\n  if (!root) return null;\n  if (root.val === val) return root;\n  return findNode(root.left, val) || findNode(root.right, val);\n}\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nconst vals = lines[0] ? lines[0].trim().split(/\\s+/) : [];\nconst root = buildTree(vals);\nconst [pv, qv] = lines[1] ? lines[1].trim().split(/\\s+/).map(Number) : [0, 0];\nconst p = findNode(root, pv), q = findNode(root, qv);\nlet res = null;\nif (typeof Solution !== \"undefined\" && new Solution().lowestCommonAncestor) {\n  res = new Solution().lowestCommonAncestor(root, p, q);\n} else if (typeof lowestCommonAncestor === \"function\") {\n  res = lowestCommonAncestor(root, p, q);\n}\nconsole.log(res ? String(res.val) : \"\");\n",
    javaDriver: "\nclass TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }\npublic class Main {\n    static TreeNode buildTree(String[] vals) {\n        if (vals.length == 0) return null;\n        TreeNode[] nodes = new TreeNode[vals.length];\n        for (int i = 0; i < vals.length; i++) nodes[i] = vals[i].equals(\"null\") ? null : new TreeNode(Integer.parseInt(vals[i]));\n        int child = 1;\n        for (int i = 0; i < vals.length && child < vals.length; i++) {\n            if (nodes[i] != null) {\n                if (child < vals.length) nodes[i].left = nodes[child++];\n                if (child < vals.length) nodes[i].right = nodes[child++];\n            }\n        }\n        return nodes[0];\n    }\n    static TreeNode find(TreeNode root, int val) {\n        if (root == null) return null;\n        if (root.val == val) return root;\n        TreeNode l = find(root.left, val);\n        return l != null ? l : find(root.right, val);\n    }\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String tLine = reader.readLine();\n        String pqLine = reader.readLine();\n        String[] vals = tLine == null || tLine.trim().isEmpty() ? new String[0] : tLine.trim().split(\"\\\\s+\");\n        TreeNode root = buildTree(vals);\n        String[] pq = pqLine == null || pqLine.trim().isEmpty() ? new String[]{\"0\",\"0\"} : pqLine.trim().split(\"\\\\s+\");\n        TreeNode p = find(root, Integer.parseInt(pq[0])), q = find(root, Integer.parseInt(pq[1]));\n        Solution sol = new Solution();\n        TreeNode res = sol.lowestCommonAncestor(root, p, q);\n        System.out.print(res != null ? Integer.toString(res.val) : \"\");\n    }\n}\n",
    cppDriver: "\nstruct TreeNode { int val; TreeNode *left, *right; TreeNode(int x) : val(x), left(NULL), right(NULL) {} };\nTreeNode* buildTree(const std::vector<std::string>& vals) {\n    if (vals.empty()) return nullptr;\n    std::vector<TreeNode*> nodes;\n    for (auto& s : vals) nodes.push_back(s == \"null\" ? nullptr : new TreeNode(std::stoi(s)));\n    int child = 1;\n    for (size_t i = 0; i < nodes.size() && child < (int)nodes.size(); i++) {\n        if (nodes[i]) {\n            if (child < (int)nodes.size()) nodes[i]->left = nodes[child++];\n            if (child < (int)nodes.size()) nodes[i]->right = nodes[child++];\n        }\n    }\n    return nodes[0];\n}\nTreeNode* findNode(TreeNode* root, int val) {\n    if (!root) return nullptr;\n    if (root->val == val) return root;\n    TreeNode* l = findNode(root->left, val);\n    return l ? l : findNode(root->right, val);\n}\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string tLine, pqLine;\n    std::getline(std::cin, tLine);\n    std::getline(std::cin, pqLine);\n    std::stringstream ss(tLine);\n    std::vector<std::string> vals;\n    std::string s;\n    while (ss >> s) vals.push_back(s);\n    TreeNode* root = buildTree(vals);\n    std::stringstream ss2(pqLine);\n    int pv = 0, qv = 0;\n    ss2 >> pv >> qv;\n    TreeNode* p = findNode(root, pv), *q = findNode(root, qv);\n    Solution sol;\n    TreeNode* res = sol.lowestCommonAncestor(root, p, q);\n    if (res) std::cout << res->val;\n    return 0;\n}\n",
  },
  "climbing-stairs": {
    methodName: "climbStairs",
    pythonSignature: "class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function climbStairs(n) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function climbStairs(n: number): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int climbStairs(int n) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    n = int(raw) if raw else 0\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'climbStairs'):\n        print(sol.climbStairs(n))\n    elif 'climbStairs' in globals():\n        print(climbStairs(n))\n    elif 'solve' in globals():\n        print(solve(n))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst n = raw ? Number(raw) : 0;\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().climbStairs) {\n  ans = new Solution().climbStairs(n);\n} else if (typeof climbStairs === \"function\") {\n  ans = climbStairs(n);\n} else if (typeof solve === \"function\") {\n  ans = solve(n);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int n = line == null || line.trim().isEmpty() ? 0 : Integer.parseInt(line.trim());\n        Solution sol = new Solution();\n        System.out.print(sol.climbStairs(n));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int n = 0;\n    std::cin >> n;\n    Solution sol;\n    std::cout << sol.climbStairs(n);\n    return 0;\n}\n",
  },
  "house-robber": {
    methodName: "rob",
    pythonSignature: "class Solution:\n    def rob(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function rob(nums) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function rob(nums: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int rob(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    nums = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'rob'):\n        print(sol.rob(nums))\n    elif 'rob' in globals():\n        print(rob(nums))\n    elif 'solve' in globals():\n        print(solve(nums))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst nums = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().rob) {\n  ans = new Solution().rob(nums);\n} else if (typeof rob === \"function\") {\n  ans = rob(nums);\n} else if (typeof solve === \"function\") {\n  ans = solve(nums);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] nums = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.rob(nums));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> nums;\n    int val;\n    while (ss >> val) nums.push_back(val);\n    Solution sol;\n    std::cout << sol.rob(nums);\n    return 0;\n}\n",
  },
  "longest-increasing-subsequence": {
    methodName: "lengthOfLIS",
    pythonSignature: "class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
    jsSignature: "function lengthOfLIS(nums) {\n  // Write logic here\n  return 0;\n}\n",
    tsSignature: "function lengthOfLIS(nums: number[]): number {\n  // Write logic here\n  return 0;\n}\n",
    javaSignature: "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    raw = sys.stdin.read().strip()\n    nums = list(map(int, raw.split())) if raw else []\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'lengthOfLIS'):\n        print(sol.lengthOfLIS(nums))\n    elif 'lengthOfLIS' in globals():\n        print(lengthOfLIS(nums))\n    elif 'solve' in globals():\n        print(solve(nums))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst raw = fs.readFileSync(0, \"utf8\").trim();\nconst nums = raw ? raw.split(/\\s+/).map(Number) : [];\nlet ans = 0;\nif (typeof Solution !== \"undefined\" && new Solution().lengthOfLIS) {\n  ans = new Solution().lengthOfLIS(nums);\n} else if (typeof lengthOfLIS === \"function\") {\n  ans = lengthOfLIS(nums);\n} else if (typeof solve === \"function\") {\n  ans = solve(nums);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String line = reader.readLine();\n        int[] nums = line == null || line.trim().isEmpty() ? new int[0] : java.util.Arrays.stream(line.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n        Solution sol = new Solution();\n        System.out.print(sol.lengthOfLIS(nums));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    std::string line;\n    std::getline(std::cin, line);\n    std::stringstream ss(line);\n    std::vector<int> nums;\n    int val;\n    while (ss >> val) nums.push_back(val);\n    Solution sol;\n    std::cout << sol.lengthOfLIS(nums);\n    return 0;\n}\n",
  },
  "clone-graph": {
    methodName: "cloneGraph",
    pythonSignature: "class Node:\n    def __init__(self, val = 0, neighbors = None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\nclass Solution:\n    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:\n        # Write logic here\n        return node\n",
    jsSignature: "function cloneGraph(node) {\n  if (!node) return null;\n  const visited = new Map();\n  function dfs(n) {\n    if (visited.has(n)) return visited.get(n);\n    const copy = { val: n.val, neighbors: [] };\n    visited.set(n, copy);\n    for (const nei of n.neighbors) copy.neighbors.push(dfs(nei));\n    return copy;\n  }\n  return dfs(node);\n}\n",
    tsSignature: "function cloneGraph(node: Node | null): Node | null {\n  if (!node) return null;\n  const visited = new Map<Node, Node>();\n  function dfs(n: Node): Node {\n    if (visited.has(n)) return visited.get(n)!;\n    const copy = new Node(n.val);\n    visited.set(n, copy);\n    for (const nei of n.neighbors) copy.neighbors.push(dfs(nei));\n    return copy;\n  }\n  return dfs(node);\n}\n",
    javaSignature: "class Solution {\n    public Node cloneGraph(Node node) {\n        // Write logic here\n        return node;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    Node* cloneGraph(Node* node) {\n        // Write logic here\n        return node;\n    }\n};\n",
    pythonDriver: "\nclass Node:\n    def __init__(self, val = 0, neighbors = None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    if not lines or not lines[0].strip(): sys.exit(0)\n    n = int(lines[0])\n    nodes = [Node(i + 1) for i in range(n)]\n    for i in range(n):\n        if i + 1 < len(lines) and lines[i + 1].strip():\n            neis = list(map(int, lines[i + 1].split()))\n            for nei in neis:\n                nodes[i].neighbors.append(nodes[nei - 1])\n    sol = Solution() if 'Solution' in globals() else None\n    root = nodes[0] if nodes else None\n    clone = sol.cloneGraph(root) if sol and hasattr(sol, 'cloneGraph') else cloneGraph(root) if 'cloneGraph' in globals() else root\n    if not clone: sys.exit(0)\n    seen = {}\n    def dfs(node):\n        if node.val in seen: return\n        seen[node.val] = [nei.val for nei in node.neighbors]\n        for nei in node.neighbors: dfs(nei)\n    dfs(clone)\n    for i in range(1, len(seen) + 1):\n        print(\" \".join(map(str, seen.get(i, []))))\n",
    jsDriver: "\nconst fs = require(\"fs\");\nfunction Node(val, neighbors) { this.val = val; this.neighbors = neighbors || []; }\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nif (!lines.length || !lines[0].trim()) process.exit(0);\nconst n = Number(lines[0]);\nconst nodes = Array.from({length: n}, (_, i) => new Node(i + 1));\nfor (let i = 0; i < n; i++) {\n  if (i + 1 < lines.length && lines[i + 1].trim()) {\n    const neis = lines[i + 1].trim().split(/\\s+/).map(Number);\n    for (const nei of neis) nodes[i].neighbors.push(nodes[nei - 1]);\n  }\n}\nconst root = nodes[0] || null;\nlet clone = root;\nif (typeof Solution !== \"undefined\" && new Solution().cloneGraph) {\n  clone = new Solution().cloneGraph(root);\n} else if (typeof cloneGraph === \"function\") {\n  clone = cloneGraph(root);\n}\nif (!clone) process.exit(0);\nconst seen = new Map();\nfunction dfs(node) {\n  if (seen.has(node.val)) return;\n  seen.set(node.val, node.neighbors.map(nei => nei.val));\n  for (const nei of node.neighbors) dfs(nei);\n}\ndfs(clone);\nconst out = [];\nfor (let i = 1; i <= seen.size; i++) {\n  out.push((seen.get(i) || []).join(\" \"));\n}\nconsole.log(out.join(\"\\n\"));\n",
    javaDriver: "\nclass Node {\n    public int val;\n    public List<Node> neighbors;\n    public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }\n}\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String nLine = reader.readLine();\n        if (nLine == null || nLine.trim().isEmpty()) return;\n        int n = Integer.parseInt(nLine.trim());\n        Node[] nodes = new Node[n];\n        for (int i = 0; i < n; i++) nodes[i] = new Node(i + 1);\n        for (int i = 0; i < n; i++) {\n            String line = reader.readLine();\n            if (line != null && !line.trim().isEmpty()) {\n                String[] parts = line.trim().split(\"\\\\s+\");\n                for (String p : parts) nodes[i].neighbors.add(nodes[Integer.parseInt(p) - 1]);\n            }\n        }\n        Solution sol = new Solution();\n        Node clone = sol.cloneGraph(n > 0 ? nodes[0] : null);\n        if (clone == null) return;\n        Map<Integer, List<Integer>> seen = new HashMap<>();\n        Queue<Node> q = new LinkedList<>();\n        q.add(clone);\n        seen.put(clone.val, new ArrayList<>());\n        while (!q.isEmpty()) {\n            Node curr = q.poll();\n            List<Integer> neis = new ArrayList<>();\n            for (Node nei : curr.neighbors) {\n                neis.add(nei.val);\n                if (!seen.containsKey(nei.val)) {\n                    seen.put(nei.val, new ArrayList<>());\n                    q.add(nei);\n                }\n            }\n            seen.put(curr.val, neis);\n        }\n        for (int i = 1; i <= seen.size(); i++) {\n            if (i > 1) System.out.println();\n            List<Integer> neis = seen.get(i);\n            for (int j = 0; j < neis.size(); j++) {\n                if (j > 0) System.out.print(' ');\n                System.out.print(neis.get(j));\n            }\n        }\n    }\n}\n",
    cppDriver: "\nclass Node {\npublic:\n    int val;\n    vector<Node*> neighbors;\n    Node(int _val) { val = _val; }\n};\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int n = 0;\n    if (!(std::cin >> n)) return 0;\n    std::string dummy;\n    std::getline(std::cin, dummy);\n    std::vector<Node*> nodes;\n    for (int i = 0; i < n; i++) nodes.push_back(new Node(i + 1));\n    for (int i = 0; i < n; i++) {\n        std::string line;\n        std::getline(std::cin, line);\n        std::stringstream ss(line);\n        int nei;\n        while (ss >> nei) nodes[i]->neighbors.push_back(nodes[nei - 1]);\n    }\n    Solution sol;\n    Node* clone = sol.cloneGraph(n > 0 ? nodes[0] : nullptr);\n    if (!clone) return 0;\n    std::map<int, std::vector<int>> seen;\n    std::queue<Node*> q;\n    q.push(clone);\n    seen[clone->val] = {};\n    while (!q.empty()) {\n        Node* curr = q.front(); q.pop();\n        for (Node* nei : curr->neighbors) {\n            seen[curr->val].push_back(nei->val);\n            if (seen.find(nei->val) == seen.end()) {\n                seen[nei->val] = {};\n                q.push(nei);\n            }\n        }\n    }\n    for (int i = 1; i <= (int)seen.size(); i++) {\n        if (i > 1) std::cout << \"\\n\";\n        for (size_t j = 0; j < seen[i].size(); j++) {\n            if (j) std::cout << ' ';\n            std::cout << seen[i][j];\n        }\n    }\n    return 0;\n}\n",
  },
  "course-schedule": {
    methodName: "canFinish",
    pythonSignature: "class Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        # Write logic here\n        return False\n",
    jsSignature: "function canFinish(numCourses, prerequisites) {\n  // Write logic here\n  return false;\n}\n",
    tsSignature: "function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n  // Write logic here\n  return false;\n}\n",
    javaSignature: "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Write logic here\n        return false;\n    }\n}\n",
    cppSignature: "class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write logic here\n        return false;\n    }\n};\n",
    pythonDriver: "\nif __name__ == \"__main__\":\n    import sys\n    lines = sys.stdin.read().splitlines()\n    if not lines: sys.exit(0)\n    numCourses = int(lines[0])\n    m = int(lines[1]) if len(lines) > 1 else 0\n    prereqs = [list(map(int, lines[i+2].split())) for i in range(m)]\n    sol = Solution() if 'Solution' in globals() else None\n    if sol and hasattr(sol, 'canFinish'):\n        print(str(sol.canFinish(numCourses, prereqs)).lower())\n    elif 'canFinish' in globals():\n        print(str(canFinish(numCourses, prereqs)).lower())\n    elif 'solve' in globals():\n        print(str(solve(numCourses, prereqs)).lower())\n",
    jsDriver: "\nconst fs = require(\"fs\");\nconst lines = fs.readFileSync(0, \"utf8\").trim().split(/\\r?\\n/);\nif (!lines.length) process.exit(0);\nconst numCourses = Number(lines[0]);\nconst m = lines[1] ? Number(lines[1]) : 0;\nconst prereqs = [];\nfor (let i = 0; i < m; i++) {\n  prereqs.push(lines[i + 2].trim().split(/\\s+/).map(Number));\n}\nlet ans = false;\nif (typeof Solution !== \"undefined\" && new Solution().canFinish) {\n  ans = new Solution().canFinish(numCourses, prereqs);\n} else if (typeof canFinish === \"function\") {\n  ans = canFinish(numCourses, prereqs);\n} else if (typeof solve === \"function\") {\n  ans = solve(numCourses, prereqs);\n}\nconsole.log(String(ans));\n",
    javaDriver: "\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));\n        String ncLine = reader.readLine();\n        if (ncLine == null) return;\n        int numCourses = Integer.parseInt(ncLine.trim());\n        String mLine = reader.readLine();\n        int m = mLine == null || mLine.trim().isEmpty() ? 0 : Integer.parseInt(mLine.trim());\n        int[][] prereqs = new int[m][2];\n        for (int i = 0; i < m; i++) {\n            String[] parts = reader.readLine().trim().split(\"\\\\s+\");\n            prereqs[i][0] = Integer.parseInt(parts[0]);\n            prereqs[i][1] = Integer.parseInt(parts[1]);\n        }\n        Solution sol = new Solution();\n        System.out.print(Boolean.toString(sol.canFinish(numCourses, prereqs)));\n    }\n}\n",
    cppDriver: "\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int numCourses = 0, m = 0;\n    if (!(std::cin >> numCourses >> m)) return 0;\n    std::vector<std::vector<int>> prereqs(m, std::vector<int>(2));\n    for (int i = 0; i < m; i++) {\n        std::cin >> prereqs[i][0] >> prereqs[i][1];\n    }\n    Solution sol;\n    std::cout << (sol.canFinish(numCourses, prereqs) ? \"true\" : \"false\");\n    return 0;\n}\n",
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
    const header = `from __future__ import annotations
import sys, json, re
from typing import List, Dict, Optional, Tuple, Set

def _co_parse_array_int(raw, param_name="nums"):
    m = re.search(rf'{param_name}\\s*=\\s*(\\[[^\\]]*\\])', raw)
    if m:
        try: return json.loads(m.group(1))
        except Exception: pass
    m_bracket = re.search(r'(\\[[^\\]]*\\])', raw)
    if m_bracket:
        try: return json.loads(m_bracket.group(1))
        except Exception: pass
    lines = [l.strip() for l in raw.splitlines() if l.strip()]
    if lines:
        return [int(x) for x in re.findall(r'-?\\d+', lines[0])]
    return []

def _co_parse_int(raw, param_name="target", default=0):
    m = re.search(rf'{param_name}\\s*=\\s*(-?\\d+)', raw)
    if m: return int(m.group(1))
    lines = [l.strip() for l in raw.splitlines() if l.strip()]
    if len(lines) > 1:
        m2 = re.search(r'-?\\d+', lines[1])
        if m2: return int(m2.group(0))
    elif len(lines) == 1:
        all_nums = [int(x) for x in re.findall(r'-?\\d+', lines[0])]
        if len(all_nums) >= 2: return all_nums[-1]
    return default

def _co_parse_str(raw, param_name="s"):
    raw_s = raw.strip()
    if "=" in raw_s:
        raw_s = raw_s.split("=", 1)[1].strip()
    if (raw_s.startswith('"') and raw_s.endswith('"')) or (raw_s.startswith("'") and raw_s.endswith("'")):
        return raw_s[1:-1]
    return raw_s

`;
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
