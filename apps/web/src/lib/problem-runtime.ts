import type { ProblemDetail } from "@codeorbit/schema";
import { LEETCODE_SPECS } from "./code-harness";

type SupportedLanguage = "typescript" | "javascript" | "python" | "java" | "cpp";

interface ProblemRuntimeSpec {
  inputFormat: string;
  sampleInput: string;
  expectedOutput: string;
  templates: Record<SupportedLanguage, string>;
}

const withTypeScriptNodeCompat = (template: string) =>
  template.startsWith("declare const require: any;")
    ? template
    : `declare const require: any;\n${template}`;

const fallbackSpec = (problem: ProblemDetail): ProblemRuntimeSpec => ({
  inputFormat: "Write stdin exactly as your code expects. The runner compares stdout against Expected Output when provided.",
  sampleInput: problem.examples[0]?.input ?? "",
  expectedOutput: problem.examples[0]?.output ?? "",
  templates: {
    typescript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);\n\nfunction solve(lines: string[]): string {\n  // TODO: parse lines and return the answer as a string\n  return lines.join("\\n");\n}\n\nconsole.log(solve(input));\n`,
    javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\r?\\n/);\n\nfunction solve(lines) {\n  // TODO: parse lines and return the answer as a string\n  return lines.join("\\n");\n}\n\nconsole.log(solve(input));\n`,
    python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(lines: List[str]) -> str:\n    # TODO: parse lines and return the answer as a string\n    return \"\\n\".join(lines)\n\n\nif __name__ == \"__main__\":\n    raw = sys.stdin.read().strip()\n    lines = raw.splitlines() if raw else []\n    print(solve(lines))\n`,
    java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n  static String solve(List<String> lines) {\n    // TODO: parse lines and return the answer as a string\n    return String.join(\"\\n\", lines);\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    List<String> lines = new ArrayList<>();\n    String line;\n    while ((line = reader.readLine()) != null) {\n      if (!line.trim().isEmpty()) {\n        lines.add(line.trim());\n      }\n    }\n    System.out.print(solve(lines));\n  }\n}\n`,
    cpp: `#include <iostream>\n#include <string>\n#include <vector>\n\nstd::string solve(const std::vector<std::string>& lines) {\n  // TODO: parse lines and return the answer as a string\n  std::string out;\n  for (size_t i = 0; i < lines.size(); ++i) {\n    if (i) out += "\\n";\n    out += lines[i];\n  }\n  return out;\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  std::vector<std::string> lines;\n  std::string line;\n  while (std::getline(std::cin, line)) {\n    if (!line.empty()) {\n      lines.push_back(line);\n    }\n  }\n\n  std::cout << solve(lines);\n  return 0;\n}\n`,
  },
});

const specs: Record<string, ProblemRuntimeSpec> = {
  "two-sum": {
    inputFormat: "Line 1: space-separated integers nums. Line 2: target integer. Output: two indices separated by a space.",
    sampleInput: "2 7 11 15\n9",
    expectedOutput: "0 1",
    templates: {
      typescript: `const fs = require("fs");\n\nfunction solve(nums: number[], target: number): number[] {\n  // TODO: return the two indices whose values add up to target\n  return [];\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst nums = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [];\nconst target = lines[1] ? Number(lines[1]) : 0;\nconst answer = solve(nums, target);\nconsole.log(answer.join(" "));\n`,
      javascript: `const fs = require("fs");\n\nfunction solve(nums, target) {\n  // TODO: return the two indices whose values add up to target\n  return [];\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst nums = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [];\nconst target = lines[1] ? Number(lines[1]) : 0;\nconst answer = solve(nums, target);\nconsole.log(answer.join(" "));\n`,
      python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(nums: List[int], target: int) -> List[int]:\n    # TODO: return the two indices whose values add up to target\n    return []\n\n\nif __name__ == "__main__":\n    raw = sys.stdin.read().strip()\n    lines = raw.splitlines() if raw else []\n    nums = list(map(int, lines[0].split())) if lines else []\n    target = int(lines[1]) if len(lines) > 1 else 0\n    answer = solve(nums, target)\n    print(" ".join(map(str, answer)))\n`,
      java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\nimport java.util.Arrays;\n\npublic class Main {\n  static int[] solve(int[] nums, int target) {\n    // TODO: return the two indices whose values add up to target\n    return new int[0];\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    String first = reader.readLine();\n    String second = reader.readLine();\n    int[] nums = first == null || first.trim().isEmpty()\n      ? new int[0]\n      : Arrays.stream(first.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n    int target = second == null || second.trim().isEmpty() ? 0 : Integer.parseInt(second.trim());\n    int[] answer = solve(nums, target);\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < answer.length; i++) {\n      if (i > 0) out.append(' ');\n      out.append(answer[i]);\n    }\n    System.out.print(out.toString());\n  }\n}\n`,
      cpp: `#include <iostream>\n#include <sstream>\n#include <string>\n#include <vector>\n\nstd::vector<int> solve(const std::vector<int>& nums, int target) {\n  // TODO: return the two indices whose values add up to target\n  return {};\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  std::string numsLine;\n  std::string targetLine;\n  std::getline(std::cin, numsLine);\n  std::getline(std::cin, targetLine);\n\n  std::stringstream numsStream(numsLine);\n  std::vector<int> nums;\n  int value;\n  while (numsStream >> value) nums.push_back(value);\n  int target = targetLine.empty() ? 0 : std::stoi(targetLine);\n\n  const auto answer = solve(nums, target);\n  for (size_t i = 0; i < answer.size(); ++i) {\n    if (i) std::cout << ' ';\n    std::cout << answer[i];\n  }\n  return 0;\n}\n`,
    },
  },
  "reverse-string": {
    inputFormat: "Line 1: a string. Output: the reversed string.",
    sampleInput: "hello",
    expectedOutput: "olleh",
    templates: {
      typescript: `const fs = require("fs");\n\nfunction solve(text: string): string {\n  // TODO: return the reversed string\n  return text;\n}\n\nconst text = fs.readFileSync(0, "utf8").trim();\nconsole.log(solve(text));\n`,
      javascript: `const fs = require("fs");\n\nfunction solve(text) {\n  // TODO: return the reversed string\n  return text;\n}\n\nconst text = fs.readFileSync(0, "utf8").trim();\nconsole.log(solve(text));\n`,
      python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(text: str) -> str:\n    # TODO: return the reversed string\n    return text\n\n\nif __name__ == "__main__":\n    text = sys.stdin.read().strip()\n    print(solve(text))\n`,
      java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\n\npublic class Main {\n  static String solve(String text) {\n    // TODO: return the reversed string\n    return text;\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    String text = reader.readLine();\n    System.out.print(solve(text == null ? \"\" : text.trim()));\n  }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\n\nstd::string solve(const std::string& text) {\n  // TODO: return the reversed string\n  return text;\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  std::string text;\n  std::getline(std::cin, text);\n  std::cout << solve(text);\n  return 0;\n}\n`,
    },
  },
  "valid-parentheses": {
    inputFormat: "Line 1: a parentheses string like ()[]{}. Output: true or false.",
    sampleInput: "()[]{}",
    expectedOutput: "true",
    templates: {
      typescript: `const fs = require("fs");\n\nfunction solve(text: string): boolean {\n  // TODO: return true if the bracket string is valid\n  return false;\n}\n\nconst text = fs.readFileSync(0, "utf8").trim();\nconsole.log(String(solve(text)));\n`,
      javascript: `const fs = require("fs");\n\nfunction solve(text) {\n  // TODO: return true if the bracket string is valid\n  return false;\n}\n\nconst text = fs.readFileSync(0, "utf8").trim();\nconsole.log(String(solve(text)));\n`,
      python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(text: str) -> bool:\n    # TODO: return True if the bracket string is valid\n    return False\n\n\nif __name__ == "__main__":\n    text = sys.stdin.read().strip()\n    print(str(solve(text)).lower())\n`,
      java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\n\npublic class Main {\n  static boolean solve(String text) {\n    // TODO: return true if the bracket string is valid\n    return false;\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    String text = reader.readLine();\n    System.out.print(Boolean.toString(solve(text == null ? \"\" : text.trim())));\n  }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\n\nbool solve(const std::string& text) {\n  // TODO: return true if the bracket string is valid\n  return false;\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  std::string text;\n  std::getline(std::cin, text);\n  std::cout << (solve(text) ? "true" : "false");\n  return 0;\n}\n`,
    },
  },
  "merge-intervals": {
    inputFormat: "Line 1: number of intervals n. Next n lines: each line has start end. Output: one merged interval per line.",
    sampleInput: "4\n1 3\n2 6\n8 10\n15 18",
    expectedOutput: "1 6\n8 10\n15 18",
    templates: {
      typescript: `const fs = require("fs");\n\ntype Interval = [number, number];\n\nfunction solve(intervals: Interval[]): Interval[] {\n  // TODO: merge all overlapping intervals\n  return intervals;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst n = lines[0] ? Number(lines[0]) : 0;\nconst intervals: Interval[] = [];\nfor (let i = 1; i <= n; i += 1) {\n  const [start, end] = (lines[i] ?? "").trim().split(/\\s+/).map(Number);\n  intervals.push([start, end]);\n}\nconst answer = solve(intervals);\nconsole.log(answer.map((interval) => interval.join(" ")).join("\\n"));\n`,
      javascript: `const fs = require("fs");\n\nfunction solve(intervals) {\n  // TODO: merge all overlapping intervals\n  return intervals;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst n = lines[0] ? Number(lines[0]) : 0;\nconst intervals = [];\nfor (let i = 1; i <= n; i += 1) {\n  const [start, end] = (lines[i] ?? "").trim().split(/\\s+/).map(Number);\n  intervals.push([start, end]);\n}\nconst answer = solve(intervals);\nconsole.log(answer.map((interval) => interval.join(" ")).join("\\n"));\n`,
      python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(intervals: List[Tuple[int, int]]) -> List[Tuple[int, int]]:\n    # TODO: merge all overlapping intervals\n    return intervals\n\n\nif __name__ == "__main__":\n    raw = sys.stdin.read().strip()\n    lines = raw.splitlines() if raw else []\n    n = int(lines[0]) if lines else 0\n    intervals = []\n    for i in range(1, n + 1):\n      start, end = map(int, lines[i].split())\n      intervals.append((start, end))\n    answer = solve(intervals)\n    print(\"\\n\".join(f\"{start} {end}\" for start, end in answer))\n`,
      java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n  static List<int[]> solve(List<int[]> intervals) {\n    // TODO: merge all overlapping intervals\n    return intervals;\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    int n = Integer.parseInt(reader.readLine().trim());\n    List<int[]> intervals = new ArrayList<>();\n    for (int i = 0; i < n; i++) {\n      String[] parts = reader.readLine().trim().split(\"\\\\s+\");\n      intervals.add(new int[] { Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) });\n    }\n    List<int[]> answer = solve(intervals);\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < answer.size(); i++) {\n      if (i > 0) out.append(\"\\n\");\n      out.append(answer.get(i)[0]).append(' ').append(answer.get(i)[1]);\n    }\n    System.out.print(out.toString());\n  }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <utility>\n\nstd::vector<std::pair<int, int>> solve(const std::vector<std::pair<int, int>>& intervals) {\n  // TODO: merge all overlapping intervals\n  return intervals;\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  int n = 0;\n  std::cin >> n;\n  std::vector<std::pair<int, int>> intervals;\n  for (int i = 0; i < n; ++i) {\n    int start = 0;\n    int end = 0;\n    std::cin >> start >> end;\n    intervals.push_back({start, end});\n  }\n  const auto answer = solve(intervals);\n  for (size_t i = 0; i < answer.size(); ++i) {\n    if (i) std::cout << "\\n";\n    std::cout << answer[i].first << ' ' << answer[i].second;\n  }\n  return 0;\n}\n`,
    },
  },
  "binary-search": {
    inputFormat: "Line 1: space-separated sorted integers nums. Line 2: target integer. Output: index or -1.",
    sampleInput: "-1 0 3 5 9 12\n9",
    expectedOutput: "4",
    templates: {
      typescript: `const fs = require("fs");\n\nfunction solve(nums: number[], target: number): number {\n  // TODO: return the index of target or -1\n  return -1;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst nums = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [];\nconst target = lines[1] ? Number(lines[1]) : 0;\nconsole.log(String(solve(nums, target)));\n`,
      javascript: `const fs = require("fs");\n\nfunction solve(nums, target) {\n  // TODO: return the index of target or -1\n  return -1;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst nums = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [];\nconst target = lines[1] ? Number(lines[1]) : 0;\nconsole.log(String(solve(nums, target)));\n`,
      python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(nums: List[int], target: int) -> int:\n    # TODO: return the index of target or -1\n    return -1\n\n\nif __name__ == "__main__":\n    raw = sys.stdin.read().strip()\n    lines = raw.splitlines() if raw else []\n    nums = list(map(int, lines[0].split())) if lines else []\n    target = int(lines[1]) if len(lines) > 1 else 0\n    print(solve(nums, target))\n`,
      java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\nimport java.util.Arrays;\n\npublic class Main {\n  static int solve(int[] nums, int target) {\n    // TODO: return the index of target or -1\n    return -1;\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    String first = reader.readLine();\n    String second = reader.readLine();\n    int[] nums = first == null || first.trim().isEmpty()\n      ? new int[0]\n      : Arrays.stream(first.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n    int target = second == null || second.trim().isEmpty() ? 0 : Integer.parseInt(second.trim());\n    System.out.print(solve(nums, target));\n  }\n}\n`,
      cpp: `#include <iostream>\n#include <sstream>\n#include <string>\n#include <vector>\n\nint solve(const std::vector<int>& nums, int target) {\n  // TODO: return the index of target or -1\n  return -1;\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  std::string numsLine;\n  std::string targetLine;\n  std::getline(std::cin, numsLine);\n  std::getline(std::cin, targetLine);\n\n  std::stringstream numsStream(numsLine);\n  std::vector<int> nums;\n  int value;\n  while (numsStream >> value) nums.push_back(value);\n  int target = targetLine.empty() ? 0 : std::stoi(targetLine);\n  std::cout << solve(nums, target);\n  return 0;\n}\n`,
    },
  },
  "number-of-islands": {
    inputFormat: "Line 1: rows cols. Next rows lines: each line is a 0/1 row like 11001. Output: island count.",
    sampleInput: "3 3\n110\n010\n101",
    expectedOutput: "3",
    templates: {
      typescript: `const fs = require("fs");\n\nfunction solve(grid: string[]): number {\n  // TODO: return the number of islands\n  return 0;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst [rows] = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [0, 0];\nconst grid = lines.slice(1, rows + 1).map((line) => line.trim());\nconsole.log(String(solve(grid)));\n`,
      javascript: `const fs = require("fs");\n\nfunction solve(grid) {\n  // TODO: return the number of islands\n  return 0;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst [rows] = lines[0] ? lines[0].trim().split(/\\s+/).map(Number) : [0, 0];\nconst grid = lines.slice(1, rows + 1).map((line) => line.trim());\nconsole.log(String(solve(grid)));\n`,
      python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(grid: List[str]) -> int:\n    # TODO: return the number of islands\n    return 0\n\n\nif __name__ == "__main__":\n    raw = sys.stdin.read().strip()\n    lines = raw.splitlines() if raw else []\n    first = list(map(int, lines[0].split())) if lines else [0, 0]\n    rows = first[0] if first else 0\n    grid = [lines[i].strip() for i in range(1, rows + 1)]\n    print(solve(grid))\n`,
      java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\n\npublic class Main {\n  static int solve(String[] grid) {\n    // TODO: return the number of islands\n    return 0;\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    String[] dims = reader.readLine().trim().split(\"\\\\s+\");\n    int rows = Integer.parseInt(dims[0]);\n    String[] grid = new String[rows];\n    for (int i = 0; i < rows; i++) {\n      grid[i] = reader.readLine().trim();\n    }\n    System.out.print(solve(grid));\n  }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\n#include <vector>\n\nint solve(const std::vector<std::string>& grid) {\n  // TODO: return the number of islands\n  return 0;\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  int rows = 0;\n  int cols = 0;\n  std::cin >> rows >> cols;\n  std::vector<std::string> grid(rows);\n  for (int i = 0; i < rows; ++i) {\n    std::cin >> grid[i];\n  }\n  std::cout << solve(grid);\n  return 0;\n}\n`,
    },
  },
  "valid-anagram": {
    inputFormat: "Line 1: first string. Line 2: second string. Output: true or false.",
    sampleInput: "anagram\nnagaram",
    expectedOutput: "true",
    templates: {
      typescript: `const fs = require("fs");

function solve(s: string, t: string): boolean {
  // TODO: return whether t is an anagram of s
  return false;
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const s = lines[0] ?? "";
const t = lines[1] ?? "";
console.log(String(solve(s, t)));
`,
      javascript: `const fs = require("fs");

function solve(s, t) {
  // TODO: return whether t is an anagram of s
  return false;
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const s = lines[0] ?? "";
const t = lines[1] ?? "";
console.log(String(solve(s, t)));
`,
      python: `from __future__ import annotations
import sys
from typing import List, Dict, Optional, Tuple, Set


def solve(s: str, t: str) -> bool:
    # TODO: return whether t is an anagram of s
    return False


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    s = lines[0] if lines else ""
    t = lines[1] if len(lines) > 1 else ""
    print(str(solve(s, t)).lower())
`,
      java: `import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Main {
  static boolean solve(String s, String t) {
    // TODO: return whether t is an anagram of s
    return false;
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String s = reader.readLine();
    String t = reader.readLine();
    System.out.print(solve(s == null ? "" : s.trim(), t == null ? "" : t.trim()));
  }
}
`,
      cpp: `#include <iostream>
#include <string>

bool solve(const std::string& s, const std::string& t) {
  // TODO: return whether t is an anagram of s
  return false;
}

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);

  std::string s;
  std::string t;
  std::getline(std::cin, s);
  std::getline(std::cin, t);
  std::cout << (solve(s, t) ? "true" : "false");
  return 0;
}
`,
    },
  },
  "maximum-subarray": {
    inputFormat: "Line 1: space-separated integers nums. Output: maximum subarray sum.",
    sampleInput: "-2 1 -3 4 -1 2 1 -5 4",
    expectedOutput: "6",
    templates: {
      typescript: `const fs = require("fs");

function solve(nums: number[]): number {
  // TODO: return the maximum subarray sum
  return 0;
}

const raw = fs.readFileSync(0, "utf8").trim();
const nums = raw ? raw.split(/\s+/).map(Number) : [];
console.log(String(solve(nums)));
`,
      javascript: `const fs = require("fs");

function solve(nums) {
  // TODO: return the maximum subarray sum
  return 0;
}

const raw = fs.readFileSync(0, "utf8").trim();
const nums = raw ? raw.split(/\s+/).map(Number) : [];
console.log(String(solve(nums)));
`,
      python: `from __future__ import annotations
import sys
from typing import List, Dict, Optional, Tuple, Set


def solve(nums: List[int]) -> int:
    # TODO: return the maximum subarray sum
    return 0


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    nums = list(map(int, raw.split())) if raw else []
    print(solve(nums))
`,
      java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;

public class Main {
  static int solve(int[] nums) {
    // TODO: return the maximum subarray sum
    return 0;
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String line = reader.readLine();
    int[] nums = line == null || line.trim().isEmpty()
      ? new int[0]
      : Arrays.stream(line.trim().split("\s+")).mapToInt(Integer::parseInt).toArray();
    System.out.print(solve(nums));
  }
}
`,
      cpp: `#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int solve(const std::vector<int>& nums) {
  // TODO: return the maximum subarray sum
  return 0;
}

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);

  std::string line;
  std::getline(std::cin, line);
  std::stringstream stream(line);
  std::vector<int> nums;
  int value;
  while (stream >> value) nums.push_back(value);
  std::cout << solve(nums);
  return 0;
}
`,
    },
  },
  "longest-substring-without-repeating-characters": {
    inputFormat: "Line 1: string s. Output: longest substring length without repeats.",
    sampleInput: "abcabcbb",
    expectedOutput: "3",
    templates: {
      typescript: `const fs = require("fs");

function solve(text: string): number {
  // TODO: return the longest substring length without repeats
  return 0;
}

const text = fs.readFileSync(0, "utf8").trim();
console.log(String(solve(text)));
`,
      javascript: `const fs = require("fs");

function solve(text) {
  // TODO: return the longest substring length without repeats
  return 0;
}

const text = fs.readFileSync(0, "utf8").trim();
console.log(String(solve(text)));
`,
      python: `from __future__ import annotations
import sys
from typing import List, Dict, Optional, Tuple, Set


def solve(text: str) -> int:
    # TODO: return the longest substring length without repeats
    return 0


if __name__ == "__main__":
    text = sys.stdin.read().strip()
    print(solve(text))
`,
      java: `import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Main {
  static int solve(String text) {
    // TODO: return the longest substring length without repeats
    return 0;
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String text = reader.readLine();
    System.out.print(solve(text == null ? "" : text.trim()));
  }
}
`,
      cpp: `#include <iostream>
#include <string>

int solve(const std::string& text) {
  // TODO: return the longest substring length without repeats
  return 0;
}

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);

  std::string text;
  std::getline(std::cin, text);
  std::cout << solve(text);
  return 0;
}
`,
    },
  },
  "product-of-array-except-self": {
    inputFormat: "Line 1: space-separated integers nums. Output: product array separated by spaces.",
    sampleInput: "1 2 3 4",
    expectedOutput: "24 12 8 6",
    templates: {
      typescript: `const fs = require("fs");

function solve(nums: number[]): number[] {
  // TODO: return the product array excluding self
  return [];
}

const raw = fs.readFileSync(0, "utf8").trim();
const nums = raw ? raw.split(/\s+/).map(Number) : [];
console.log(solve(nums).join(" "));
`,
      javascript: `const fs = require("fs");

function solve(nums) {
  // TODO: return the product array excluding self
  return [];
}

const raw = fs.readFileSync(0, "utf8").trim();
const nums = raw ? raw.split(/\s+/).map(Number) : [];
console.log(solve(nums).join(" "));
`,
      python: `from __future__ import annotations
import sys
from typing import List, Dict, Optional, Tuple, Set


def solve(nums: List[int]) -> List[int]:
    # TODO: return the product array excluding self
    return []


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    nums = list(map(int, raw.split())) if raw else []
    print(" ".join(map(str, solve(nums))))
`,
      java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;

public class Main {
  static int[] solve(int[] nums) {
    // TODO: return the product array excluding self
    return new int[0];
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String line = reader.readLine();
    int[] nums = line == null || line.trim().isEmpty()
      ? new int[0]
      : Arrays.stream(line.trim().split("\s+")).mapToInt(Integer::parseInt).toArray();
    int[] answer = solve(nums);
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < answer.length; i++) {
      if (i > 0) out.append(' ');
      out.append(answer[i]);
    }
    System.out.print(out.toString());
  }
}
`,
      cpp: `#include <iostream>
#include <sstream>
#include <string>
#include <vector>

std::vector<int> solve(const std::vector<int>& nums) {
  // TODO: return the product array excluding self
  return {};
}

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);

  std::string line;
  std::getline(std::cin, line);
  std::stringstream stream(line);
  std::vector<int> nums;
  int value;
  while (stream >> value) nums.push_back(value);
  const auto answer = solve(nums);
  for (size_t i = 0; i < answer.size(); ++i) {
    if (i) std::cout << ' ';
    std::cout << answer[i];
  }
  return 0;
}
`,
    },
  },
  "search-in-rotated-sorted-array": {
    inputFormat: "Line 1: rotated sorted array nums. Line 2: target. Output: index or -1.",
    sampleInput: "4 5 6 7 0 1 2\n0",
    expectedOutput: "4",
    templates: {
      typescript: `const fs = require("fs");

function solve(nums: number[], target: number): number {
  // TODO: return the target index or -1
  return -1;
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const nums = lines[0] ? lines[0].trim().split(/\s+/).map(Number) : [];
const target = lines[1] ? Number(lines[1]) : 0;
console.log(String(solve(nums, target)));
`,
      javascript: `const fs = require("fs");

function solve(nums, target) {
  // TODO: return the target index or -1
  return -1;
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const nums = lines[0] ? lines[0].trim().split(/\s+/).map(Number) : [];
const target = lines[1] ? Number(lines[1]) : 0;
console.log(String(solve(nums, target)));
`,
      python: `from __future__ import annotations
import sys
from typing import List, Dict, Optional, Tuple, Set


def solve(nums: List[int], target: int) -> int:
    # TODO: return the target index or -1
    return -1


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    target = int(lines[1]) if len(lines) > 1 else 0
    print(solve(nums, target))
`,
      java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;

public class Main {
  static int solve(int[] nums, int target) {
    // TODO: return the target index or -1
    return -1;
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String first = reader.readLine();
    String second = reader.readLine();
    int[] nums = first == null || first.trim().isEmpty()
      ? new int[0]
      : Arrays.stream(first.trim().split("\s+")).mapToInt(Integer::parseInt).toArray();
    int target = second == null || second.trim().isEmpty() ? 0 : Integer.parseInt(second.trim());
    System.out.print(solve(nums, target));
  }
}
`,
      cpp: `#include <iostream>
#include <sstream>
#include <string>
#include <vector>

int solve(const std::vector<int>& nums, int target) {
  // TODO: return the target index or -1
  return -1;
}

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);

  std::string numsLine;
  std::string targetLine;
  std::getline(std::cin, numsLine);
  std::getline(std::cin, targetLine);

  std::stringstream numsStream(numsLine);
  std::vector<int> nums;
  int value;
  while (numsStream >> value) nums.push_back(value);
  int target = targetLine.empty() ? 0 : std::stoi(targetLine);
  std::cout << solve(nums, target);
  return 0;
}
`,
    },
  },
  "top-k-frequent-elements": {
    inputFormat: "Line 1: space-separated integers nums. Line 2: k. Output: k elements in descending frequency order.",
    sampleInput: "1 1 1 2 2 3\n2",
    expectedOutput: "1 2",
    templates: {
      typescript: `const fs = require("fs");

function solve(nums: number[], k: number): number[] {
  // TODO: return the top-k frequent elements
  return [];
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const nums = lines[0] ? lines[0].trim().split(/\s+/).map(Number) : [];
const k = lines[1] ? Number(lines[1]) : 0;
console.log(solve(nums, k).join(" "));
`,
      javascript: `const fs = require("fs");

function solve(nums, k) {
  // TODO: return the top-k frequent elements
  return [];
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const nums = lines[0] ? lines[0].trim().split(/\s+/).map(Number) : [];
const k = lines[1] ? Number(lines[1]) : 0;
console.log(solve(nums, k).join(" "));
`,
      python: `from __future__ import annotations
import sys
from typing import List, Dict, Optional, Tuple, Set


def solve(nums: List[int], k: int) -> List[int]:
    # TODO: return the top-k frequent elements
    return []


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    nums = list(map(int, lines[0].split())) if lines else []
    k = int(lines[1]) if len(lines) > 1 else 0
    print(" ".join(map(str, solve(nums, k))))
`,
      java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;

public class Main {
  static int[] solve(int[] nums, int k) {
    // TODO: return the top-k frequent elements
    return new int[0];
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String first = reader.readLine();
    String second = reader.readLine();
    int[] nums = first == null || first.trim().isEmpty()
      ? new int[0]
      : Arrays.stream(first.trim().split("\s+")).mapToInt(Integer::parseInt).toArray();
    int k = second == null || second.trim().isEmpty() ? 0 : Integer.parseInt(second.trim());
    int[] answer = solve(nums, k);
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < answer.length; i++) {
      if (i > 0) out.append(' ');
      out.append(answer[i]);
    }
    System.out.print(out.toString());
  }
}
`,
      cpp: `#include <iostream>
#include <sstream>
#include <string>
#include <vector>

std::vector<int> solve(const std::vector<int>& nums, int k) {
  // TODO: return the top-k frequent elements
  return {};
}

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);

  std::string numsLine;
  std::string kLine;
  std::getline(std::cin, numsLine);
  std::getline(std::cin, kLine);

  std::stringstream numsStream(numsLine);
  std::vector<int> nums;
  int value;
  while (numsStream >> value) nums.push_back(value);
  int k = kLine.empty() ? 0 : std::stoi(kLine);
  const auto answer = solve(nums, k);
  for (size_t i = 0; i < answer.size(); ++i) {
    if (i) std::cout << ' ';
    std::cout << answer[i];
  }
  return 0;
}
`,
    },
  },
  "rotting-oranges": {
    inputFormat: "Line 1: rows cols. Next rows lines: space-separated integers for the grid. Output: minimum minutes.",
    sampleInput: "3 3\n2 1 1\n1 1 0\n0 1 1",
    expectedOutput: "4",
    templates: {
      typescript: `const fs = require("fs");

function solve(grid: number[][]): number {
  // TODO: return the minimum minutes or -1
  return -1;
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const [rows] = lines[0] ? lines[0].trim().split(/\s+/).map(Number) : [0, 0];
const grid = lines.slice(1, rows + 1).map((line) => line.trim().split(/\s+/).map(Number));
console.log(String(solve(grid)));
`,
      javascript: `const fs = require("fs");

function solve(grid) {
  // TODO: return the minimum minutes or -1
  return -1;
}

const raw = fs.readFileSync(0, "utf8").trim();
const lines = raw ? raw.split(/\r?\n/) : [];
const [rows] = lines[0] ? lines[0].trim().split(/\s+/).map(Number) : [0, 0];
const grid = lines.slice(1, rows + 1).map((line) => line.trim().split(/\s+/).map(Number));
console.log(String(solve(grid)));
`,
      python: `from __future__ import annotations
import sys
from typing import List, Dict, Optional, Tuple, Set


def solve(grid: List[List[int]]) -> int:
    # TODO: return the minimum minutes or -1
    return -1


if __name__ == "__main__":
    raw = sys.stdin.read().strip()
    lines = raw.splitlines() if raw else []
    first = list(map(int, lines[0].split())) if lines else [0, 0]
    rows = first[0] if first else 0
    grid = [list(map(int, lines[index].split())) for index in range(1, rows + 1)]
    print(solve(grid))
`,
      java: `import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Main {
  static int solve(int[][] grid) {
    // TODO: return the minimum minutes or -1
    return -1;
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String[] dims = reader.readLine().trim().split("\s+");
    int rows = Integer.parseInt(dims[0]);
    int cols = Integer.parseInt(dims[1]);
    int[][] grid = new int[rows][cols];
    for (int row = 0; row < rows; row++) {
      String[] values = reader.readLine().trim().split("\s+");
      for (int col = 0; col < cols; col++) {
        grid[row][col] = Integer.parseInt(values[col]);
      }
    }
    System.out.print(solve(grid));
  }
}
`,
      cpp: `#include <iostream>
#include <vector>

int solve(const std::vector<std::vector<int>>& grid) {
  // TODO: return the minimum minutes or -1
  return -1;
}

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);

  int rows = 0;
  int cols = 0;
  std::cin >> rows >> cols;
  std::vector<std::vector<int>> grid(rows, std::vector<int>(cols));
  for (int row = 0; row < rows; ++row) {
    for (int col = 0; col < cols; ++col) {
      std::cin >> grid[row][col];
    }
  }
  std::cout << solve(grid);
  return 0;
}
`,
    },
  },
  "median-of-two-sorted-arrays": {
    inputFormat: "Line 1: first sorted array. Line 2: second sorted array. Output: median value.",
    sampleInput: "1 3\n2",
    expectedOutput: "2",
    templates: {
      typescript: `const fs = require("fs");\n\nfunction solve(nums1: number[], nums2: number[]): number {\n  // TODO: return the median of the two sorted arrays\n  return 0;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst nums1 = lines[0] ? lines[0].trim().split(/\\s+/).filter(Boolean).map(Number) : [];\nconst nums2 = lines[1] ? lines[1].trim().split(/\\s+/).filter(Boolean).map(Number) : [];\nconsole.log(String(solve(nums1, nums2)));\n`,
      javascript: `const fs = require("fs");\n\nfunction solve(nums1, nums2) {\n  // TODO: return the median of the two sorted arrays\n  return 0;\n}\n\nconst raw = fs.readFileSync(0, "utf8").trim();\nconst lines = raw ? raw.split(/\\r?\\n/) : [];\nconst nums1 = lines[0] ? lines[0].trim().split(/\\s+/).filter(Boolean).map(Number) : [];\nconst nums2 = lines[1] ? lines[1].trim().split(/\\s+/).filter(Boolean).map(Number) : [];\nconsole.log(String(solve(nums1, nums2)));\n`,
      python: `from __future__ import annotations\nimport sys\nfrom typing import List, Dict, Optional, Tuple, Set\n\n\ndef solve(nums1: List[int], nums2: List[int]) -> float:\n    # TODO: return the median of the two sorted arrays\n    return 0\n\n\nif __name__ == "__main__":\n    raw = sys.stdin.read().strip()\n    lines = raw.splitlines() if raw else []\n    nums1 = list(map(int, lines[0].split())) if lines and lines[0].strip() else []\n    nums2 = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []\n    print(solve(nums1, nums2))\n`,
      java: `import java.io.BufferedReader;\nimport java.io.InputStreamReader;\nimport java.util.Arrays;\n\npublic class Main {\n  static double solve(int[] nums1, int[] nums2) {\n    // TODO: return the median of the two sorted arrays\n    return 0;\n  }\n\n  public static void main(String[] args) throws Exception {\n    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n    String first = reader.readLine();\n    String second = reader.readLine();\n    int[] nums1 = first == null || first.trim().isEmpty()\n      ? new int[0]\n      : Arrays.stream(first.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n    int[] nums2 = second == null || second.trim().isEmpty()\n      ? new int[0]\n      : Arrays.stream(second.trim().split(\"\\\\s+\")).mapToInt(Integer::parseInt).toArray();\n    System.out.print(solve(nums1, nums2));\n  }\n}\n`,
      cpp: `#include <iostream>\n#include <sstream>\n#include <string>\n#include <vector>\n\ndouble solve(const std::vector<int>& nums1, const std::vector<int>& nums2) {\n  // TODO: return the median of the two sorted arrays\n  return 0;\n}\n\nint main() {\n  std::ios::sync_with_stdio(false);\n  std::cin.tie(nullptr);\n\n  std::string first;\n  std::string second;\n  std::getline(std::cin, first);\n  std::getline(std::cin, second);\n\n  std::stringstream stream1(first);\n  std::stringstream stream2(second);\n  std::vector<int> nums1;\n  std::vector<int> nums2;\n  int value;\n  while (stream1 >> value) nums1.push_back(value);\n  while (stream2 >> value) nums2.push_back(value);\n  std::cout << solve(nums1, nums2);\n  return 0;\n}\n`,
    },
  },
  "best-time-to-buy-and-sell-stock": {
    inputFormat: "Line 1: space-separated stock prices. Output: maximum profit.",
    sampleInput: "7 1 5 3 6 4",
    expectedOutput: "5",
    templates: {
      "typescript": "function maxProfit(prices: number[]): number {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    else if (price - minPrice > maxProfit) maxProfit = price - minPrice;\n  }\n  return maxProfit;\n}",
      "javascript": "function maxProfit(prices) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "contains-duplicate": {
    inputFormat: "Line 1: space-separated integers. Output: true or false.",
    sampleInput: "1 2 3 1",
    expectedOutput: "true",
    templates: {
      "typescript": "function containsDuplicate(nums: number[]): boolean {\n  return new Set(nums).size < nums.length;\n}",
      "javascript": "function containsDuplicate(nums) {\n  // Write logic here\n  return false;\n}\n",
      "python": "class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        # Write logic here\n        return False\n",
      "java": "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write logic here\n        return false;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write logic here\n        return false;\n    }\n};\n"
},
  },
  "group-anagrams": {
    inputFormat: "Line 1: space-separated words. Output: groups of anagrams sorted.",
    sampleInput: "eat tea tan ate nat bat",
    expectedOutput: "ate eat tea\nbat\nnat tan",
    templates: {
      "typescript": "function groupAnagrams(strs: string[]): string[][] {\n  const map = new Map<string, string[]>();\n  for (const s of strs) {\n    const key = s.split('').sort().join('');\n    if (!map.has(key)) map.set(key, []);\n    map.get(key)!.push(s);\n  }\n  return Array.from(map.values());\n}",
      "javascript": "function groupAnagrams(strs) {\n  // Write logic here\n  return [];\n}\n",
      "python": "class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        # Write logic here\n        return []\n",
      "java": "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write logic here\n        return new ArrayList<>();\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write logic here\n        return {};\n    }\n};\n"
},
  },
  "encode-and-decode-strings": {
    inputFormat: "Line 1: space-separated words. Output: decoded space-separated words.",
    sampleInput: "lint code love you",
    expectedOutput: "lint code love you",
    templates: {
      "typescript": "function encode(strs: string[]): string {\n  return strs.map(s => s.length + '#' + s).join('');\n}\n\nfunction decode(s: string): string[] {\n  const res: string[] = [];\n  let i = 0;\n  while (i < s.length) {\n    const hash = s.indexOf('#', i);\n    const len = parseInt(s.slice(i, hash), 10);\n    res.push(s.slice(hash + 1, hash + 1 + len));\n    i = hash + 1 + len;\n  }\n  return res;\n}",
      "javascript": "function encode(strs) {\n  return strs.map(s => s.length + '#' + s).join('');\n}\nfunction decode(s) {\n  const res = [];\n  let i = 0;\n  while (i < s.length) {\n    const hash = s.indexOf('#', i);\n    const len = parseInt(s.slice(i, hash), 10);\n    res.push(s.slice(hash + 1, hash + 1 + len));\n    i = hash + 1 + len;\n  }\n  return res;\n}\n",
      "python": "class Solution:\n    def encode(self, strs: List[str]) -> str:\n        return \"\".join(f\"{len(s)}#{s}\" for s in strs)\n    def decode(self, s: str) -> List[str]:\n        res, i = [], 0\n        while i < len(s):\n            j = s.find(\"#\", i)\n            length = int(s[i:j])\n            res.append(s[j + 1 : j + 1 + length])\n            i = j + 1 + length\n        return res\n",
      "java": "class Solution {\n    public String encode(List<String> strs) {\n        StringBuilder sb = new StringBuilder();\n        for (String s : strs) sb.append(s.length()).append('#').append(s);\n        return sb.toString();\n    }\n    public List<String> decode(String s) {\n        List<String> res = new ArrayList<>();\n        int i = 0;\n        while (i < s.length()) {\n            int hash = s.indexOf('#', i);\n            int len = Integer.parseInt(s.substring(i, hash));\n            res.add(s.substring(hash + 1, hash + 1 + len));\n            i = hash + 1 + len;\n        }\n        return res;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    string encode(vector<string>& strs) {\n        string out;\n        for (auto& s : strs) out += to_string(s.size()) + \"#\" + s;\n        return out;\n    }\n    vector<string> decode(string s) {\n        vector<string> res;\n        int i = 0;\n        while (i < (int)s.size()) {\n            int hash = s.find('#', i);\n            int len = stoi(s.substr(i, hash - i));\n            res.push_back(s.substr(hash + 1, len));\n            i = hash + 1 + len;\n        }\n        return res;\n    }\n};\n"
},
  },
  "majority-element": {
    inputFormat: "Line 1: space-separated integers. Output: majority element.",
    sampleInput: "3 2 3",
    expectedOutput: "3",
    templates: {
      "typescript": "function majorityElement(nums: number[]): number {\n  let count = 0;\n  let candidate = 0;\n  for (const num of nums) {\n    if (count === 0) candidate = num;\n    count += (num === candidate) ? 1 : -1;\n  }\n  return candidate;\n}",
      "javascript": "function majorityElement(nums) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int majorityElement(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "3sum": {
    inputFormat: "Line 1: space-separated integers. Output: unique triplets summing to 0, one per line.",
    sampleInput: "-1 0 1 2 -1 -4",
    expectedOutput: "-1 -1 2\n-1 0 1",
    templates: {
      "typescript": "function threeSum(nums: number[]): number[][] {\n  nums.sort((a, b) => a - b);\n  const res: number[][] = [];\n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    let l = i + 1, r = nums.length - 1;\n    while (l < r) {\n      const s = nums[i] + nums[l] + nums[r];\n      if (s === 0) {\n        res.push([nums[i], nums[l], nums[r]]);\n        while (l < r && nums[l] === nums[l + 1]) l++;\n        while (l < r && nums[r] === nums[r - 1]) r--;\n        l++; r--;\n      } else if (s < 0) l++;\n      else r--;\n    }\n  }\n  return res;\n}",
      "javascript": "function threeSum(nums) {\n  // Write logic here\n  return [];\n}\n",
      "python": "class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        # Write logic here\n        return []\n",
      "java": "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write logic here\n        return new ArrayList<>();\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write logic here\n        return {};\n    }\n};\n"
},
  },
  "container-with-most-water": {
    inputFormat: "Line 1: space-separated heights. Output: max water capacity.",
    sampleInput: "1 8 6 2 5 4 8 3 7",
    expectedOutput: "49",
    templates: {
      "typescript": "function maxArea(height: number[]): number {\n  let left = 0, right = height.length - 1, max = 0;\n  while (left < right) {\n    const w = right - left;\n    const h = Math.min(height[left], height[right]);\n    max = Math.max(max, w * h);\n    if (height[left] < height[right]) left++;\n    else right--;\n  }\n  return max;\n}",
      "javascript": "function maxArea(height) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int maxArea(int[] height) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "trapping-rain-water": {
    inputFormat: "Line 1: space-separated elevation heights. Output: trapped rainwater volume.",
    sampleInput: "0 1 0 2 1 0 1 3 2 1 2 1",
    expectedOutput: "6",
    templates: {
      "typescript": "function trap(height: number[]): number {\n  let l = 0, r = height.length - 1;\n  let leftMax = 0, rightMax = 0, total = 0;\n  while (l < r) {\n    if (height[l] < height[r]) {\n      if (height[l] >= leftMax) leftMax = height[l];\n      else total += leftMax - height[l];\n      l++;\n    } else {\n      if (height[r] >= rightMax) rightMax = height[r];\n      else total += rightMax - height[r];\n      r--;\n    }\n  }\n  return total;\n}",
      "javascript": "function trap(height) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def trap(self, height: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int trap(int[] height) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "valid-palindrome": {
    inputFormat: "Line 1: string to test. Output: true or false.",
    sampleInput: "A man, a plan, a canal: Panama",
    expectedOutput: "true",
    templates: {
      "typescript": "function isPalindrome(s: string): boolean {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  let l = 0, r = clean.length - 1;\n  while (l < r) {\n    if (clean[l] !== clean[r]) return false;\n    l++; r--;\n  }\n  return true;\n}",
      "javascript": "function isPalindrome(s) {\n  // Write logic here\n  return false;\n}\n",
      "python": "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write logic here\n        return False\n",
      "java": "class Solution {\n    public boolean isPalindrome(String s) {\n        // Write logic here\n        return false;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write logic here\n        return false;\n    }\n};\n"
},
  },
  "minimum-window-substring": {
    inputFormat: "Line 1: string s. Line 2: string t. Output: minimum window substring.",
    sampleInput: "ADOBECODEBANC\nABC",
    expectedOutput: "BANC",
    templates: {
      "typescript": "function minWindow(s: string, t: string): string {\n  if (!s || !t) return \"\";\n  const tCount = new Map<string, number>();\n  for (const c of t) tCount.set(c, (tCount.get(c) || 0) + 1);\n  let left = 0, match = 0, minLen = Infinity, start = 0;\n  const window = new Map<string, number>();\n  for (let right = 0; right < s.length; right++) {\n    const c = s[right];\n    if (tCount.has(c)) {\n      window.set(c, (window.get(c) || 0) + 1);\n      if (window.get(c) === tCount.get(c)) match++;\n    }\n    while (match === tCount.size) {\n      if (right - left + 1 < minLen) {\n        minLen = right - left + 1;\n        start = left;\n      }\n      const lc = s[left];\n      if (tCount.has(lc)) {\n        if (window.get(lc) === tCount.get(lc)) match--;\n        window.set(lc, window.get(lc)! - 1);\n      }\n      left++;\n    }\n  }\n  return minLen === Infinity ? \"\" : s.substring(start, start + minLen);\n}",
      "javascript": "function minWindow(s, t) {\n  // Write logic here\n  return \"\";\n}\n",
      "python": "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        # Write logic here\n        return \"\"\n",
      "java": "class Solution {\n    public String minWindow(String s, String t) {\n        // Write logic here\n        return \"\";\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        // Write logic here\n        return \"\";\n    }\n};\n"
},
  },
  "longest-repeating-character-replacement": {
    inputFormat: "Line 1: string s. Line 2: integer k. Output: max length of substring with identical characters.",
    sampleInput: "ABAB\n2",
    expectedOutput: "4",
    templates: {
      "typescript": "function characterReplacement(s: string, k: number): number {\n  const count = new Array(26).fill(0);\n  let left = 0, maxCount = 0, maxLen = 0;\n  for (let right = 0; right < s.length; right++) {\n    const idx = s.charCodeAt(right) - 65;\n    count[idx]++;\n    maxCount = Math.max(maxCount, count[idx]);\n    while (right - left + 1 - maxCount > k) {\n      count[s.charCodeAt(left) - 65]--;\n      left++;\n    }\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}",
      "javascript": "function characterReplacement(s, k) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int characterReplacement(String s, int k) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "permutation-in-string": {
    inputFormat: "Line 1: string s1. Line 2: string s2. Output: true or false.",
    sampleInput: "ab\neidbaooo",
    expectedOutput: "true",
    templates: {
      "typescript": "function checkInclusion(s1: string, s2: string): boolean {\n  if (s1.length > s2.length) return false;\n  const c1 = new Array(26).fill(0), c2 = new Array(26).fill(0);\n  for (let i = 0; i < s1.length; i++) {\n    c1[s1.charCodeAt(i) - 97]++;\n    c2[s2.charCodeAt(i) - 97]++;\n  }\n  const match = () => c1.every((v, i) => v === c2[i]);\n  if (match()) return true;\n  for (let i = s1.length; i < s2.length; i++) {\n    c2[s2.charCodeAt(i) - 97]++;\n    c2[s2.charCodeAt(i - s1.length) - 97]--;\n    if (match()) return true;\n  }\n  return false;\n}",
      "javascript": "function checkInclusion(s1, s2) {\n  // Write logic here\n  return false;\n}\n",
      "python": "class Solution:\n    def checkInclusion(self, s1: str, s2: str) -> bool:\n        # Write logic here\n        return False\n",
      "java": "class Solution {\n    public boolean checkInclusion(String s1, String s2) {\n        // Write logic here\n        return false;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    bool checkInclusion(string s1, string s2) {\n        // Write logic here\n        return false;\n    }\n};\n"
},
  },
  "daily-temperatures": {
    inputFormat: "Line 1: space-separated temperatures. Output: wait days separated by spaces.",
    sampleInput: "73 74 75 71 69 72 76 73",
    expectedOutput: "1 1 4 2 1 1 0 0",
    templates: {
      "typescript": "function dailyTemperatures(temperatures: number[]): number[] {\n  const n = temperatures.length;\n  const res = new Array(n).fill(0);\n  const stack: number[] = [];\n  for (let i = 0; i < n; i++) {\n    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {\n      const prev = stack.pop()!;\n      res[prev] = i - prev;\n    }\n    stack.push(i);\n  }\n  return res;\n}",
      "javascript": "function dailyTemperatures(temperatures) {\n  // Write logic here\n  return [];\n}\n",
      "python": "class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        # Write logic here\n        return []\n",
      "java": "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Write logic here\n        return new int[0];\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        // Write logic here\n        return {};\n    }\n};\n"
},
  },
  "car-fleet": {
    inputFormat: "Line 1: target. Line 2: positions. Line 3: speeds. Output: count of fleets.",
    sampleInput: "12\n10 8 0 5 3\n2 4 1 1 3",
    expectedOutput: "3",
    templates: {
      "typescript": "function carFleet(target: number, position: number[], speed: number[]): number {\n  const pair = position.map((p, i) => [p, speed[i]]).sort((a, b) => b[0] - a[0]);\n  const stack: number[] = [];\n  for (const [p, s] of pair) {\n    const time = (target - p) / s;\n    if (!stack.length || time > stack[stack.length - 1]) {\n      stack.push(time);\n    }\n  }\n  return stack.length;\n}",
      "javascript": "function carFleet(target, position, speed) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int carFleet(int target, int[] position, int[] speed) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int carFleet(int target, vector<int>& position, vector<int>& speed) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "largest-rectangle-in-histogram": {
    inputFormat: "Line 1: space-separated bar heights. Output: maximum rectangle area.",
    sampleInput: "2 1 5 6 2 3",
    expectedOutput: "10",
    templates: {
      "typescript": "function largestRectangleArea(heights: number[]): number {\n  const stack: number[] = [];\n  let maxArea = 0;\n  const h = [...heights, 0];\n  for (let i = 0; i < h.length; i++) {\n    while (stack.length && h[i] < h[stack[stack.length - 1]]) {\n      const height = h[stack.pop()!];\n      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;\n      maxArea = Math.max(maxArea, height * width);\n    }\n    stack.push(i);\n  }\n  return maxArea;\n}",
      "javascript": "function largestRectangleArea(heights) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "koko-eating-bananas": {
    inputFormat: "Line 1: space-separated pile counts. Line 2: integer h. Output: minimum eating speed k.",
    sampleInput: "3 6 7 11\n8",
    expectedOutput: "4",
    templates: {
      "typescript": "function minEatingSpeed(piles: number[], h: number): number {\n  let left = 1, right = Math.max(...piles);\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    const hours = piles.reduce((acc, p) => acc + Math.ceil(p / mid), 0);\n    if (hours <= h) right = mid;\n    else left = mid + 1;\n  }\n  return left;\n}",
      "javascript": "function minEatingSpeed(piles, h) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int minEatingSpeed(vector<int>& piles, int h) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "search-a-2d-matrix": {
    inputFormat: "Line 1: m n. Next m lines: matrix rows. Last line: target. Output: true or false.",
    sampleInput: "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3",
    expectedOutput: "true",
    templates: {
      "typescript": "function searchMatrix(matrix: number[][], target: number): boolean {\n  const m = matrix.length, n = matrix[0].length;\n  let left = 0, right = m * n - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    const val = matrix[Math.floor(mid / n)][mid % n];\n    if (val === target) return true;\n    if (val < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return false;\n}",
      "javascript": "function searchMatrix(matrix, target) {\n  // Write logic here\n  return false;\n}\n",
      "python": "class Solution:\n    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:\n        # Write logic here\n        return False\n",
      "java": "class Solution {\n    public boolean searchMatrix(int[][] matrix, int target) {\n        // Write logic here\n        return false;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    bool searchMatrix(vector<vector<int>>& matrix, int target) {\n        // Write logic here\n        return false;\n    }\n};\n"
},
  },
  "find-minimum-in-rotated-sorted-array": {
    inputFormat: "Line 1: space-separated rotated sorted integers. Output: minimum element.",
    sampleInput: "3 4 5 1 2",
    expectedOutput: "1",
    templates: {
      "typescript": "function findMin(nums: number[]): number {\n  let left = 0, right = nums.length - 1;\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] > nums[right]) left = mid + 1;\n    else right = mid;\n  }\n  return nums[left];\n}",
      "javascript": "function findMin(nums) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int findMin(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "reverse-linked-list": {
    inputFormat: "Line 1: space-separated linked list node values. Output: reversed node values.",
    sampleInput: "1 2 3 4 5",
    expectedOutput: "5 4 3 2 1",
    templates: {
      "typescript": "class ListNode {\n  val: number;\n  next: ListNode | null;\n  constructor(val?: number, next?: ListNode | null) {\n    this.val = (val===undefined ? 0 : val);\n    this.next = (next===undefined ? null : next);\n  }\n}\n\nfunction reverseList(head: ListNode | null): ListNode | null {\n  let prev: ListNode | null = null, curr = head;\n  while (curr) {\n    const next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}",
      "javascript": "function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}\n",
      "python": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        # Write logic here\n        return None\n",
      "java": "class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null, curr = head;\n        while (curr != null) {\n            ListNode next = curr.next;\n            curr.next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        ListNode* curr = head;\n        while (curr) {\n            ListNode* next = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n};\n"
},
  },
  "merge-two-sorted-lists": {
    inputFormat: "Line 1: space-separated integers for list1. Line 2: for list2. Output: merged sorted list.",
    sampleInput: "1 2 4\n1 3 4",
    expectedOutput: "1 1 2 3 4 4",
    templates: {
      "typescript": "function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n  const dummy = new ListNode(0);\n  let cur = dummy;\n  while (list1 && list2) {\n    if (list1.val <= list2.val) {\n      cur.next = list1;\n      list1 = list1.next;\n    } else {\n      cur.next = list2;\n      list2 = list2.next;\n    }\n    cur = cur.next;\n  }\n  cur.next = list1 || list2;\n  return dummy.next;\n}",
      "javascript": "function mergeTwoLists(list1, list2) {\n  // Write logic here\n  return null;\n}\n",
      "python": "class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        # Write logic here\n        return None\n",
      "java": "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write logic here\n        return null;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write logic here\n        return nullptr;\n    }\n};\n"
},
  },
  "lru-cache": {
    inputFormat: "Line 1: capacity. Following lines: operations 'put key val' or 'get key'. Output: results of get operations.",
    sampleInput: "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4",
    expectedOutput: "1 -1 -1 3 4",
    templates: {
      "typescript": "class LRUCache {\n  private capacity: number;\n  private cache = new Map<number, number>();\n  constructor(capacity: number) {\n    this.capacity = capacity;\n  }\n  get(key: number): number {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key)!;\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key: number, value: number): void {\n    if (this.cache.has(key)) this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      const oldest = this.cache.keys().next().value;\n      if (oldest !== undefined) this.cache.delete(oldest);\n    }\n  }\n}",
      "javascript": "class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    if (this.map.has(key)) this.map.delete(key);\n    this.map.set(key, value);\n    if (this.map.size > this.capacity) {\n      this.map.delete(this.map.keys().next().value);\n    }\n  }\n}\n",
      "python": "class LRUCache:\n    def __init__(self, capacity: int):\n        # Write logic here\n        pass\n    def get(self, key: int) -> int:\n        return -1\n    def put(self, key: int, value: int) -> None:\n        pass\n",
      "java": "class LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}\n",
      "cpp": "class LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) { return -1; }\n    void put(int key, int value) {}\n};\n"
},
  },
  "invert-binary-tree": {
    inputFormat: "Line 1: space-separated level-order tree node values. Output: inverted tree level-order node values.",
    sampleInput: "4 2 7 1 3 6 9",
    expectedOutput: "4 7 2 9 6 3 1",
    templates: {
      "typescript": "class TreeNode {\n  val: number;\n  left: TreeNode | null;\n  right: TreeNode | null;\n  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {\n    this.val = (val===undefined ? 0 : val);\n    this.left = (left===undefined ? null : left);\n    this.right = (right===undefined ? null : right);\n  }\n}\n\nfunction invertTree(root: TreeNode | null): TreeNode | null {\n  if (!root) return null;\n  const tmp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(tmp);\n  return root;\n}",
      "javascript": "function invertTree(root) {\n  if (!root) return null;\n  const tmp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(tmp);\n  return root;\n}\n",
      "python": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        # Write logic here\n        return None\n",
      "java": "class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        if (root == null) return null;\n        TreeNode tmp = root.left;\n        root.left = invertTree(root.right);\n        root.right = invertTree(tmp);\n        return root;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        if (!root) return nullptr;\n        TreeNode* tmp = root->left;\n        root->left = invertTree(root->right);\n        root->right = invertTree(tmp);\n        return root;\n    }\n};\n"
},
  },
  "binary-tree-level-order-traversal": {
    inputFormat: "Line 1: space-separated level-order tree node values. Output: values level-by-level, each level on a new line.",
    sampleInput: "3 9 20 null null 15 7",
    expectedOutput: "3\n9 20\n15 7",
    templates: {
      "typescript": "function levelOrder(root: TreeNode | null): number[][] {\n  if (!root) return [];\n  const res: number[][] = [];\n  const queue: TreeNode[] = [root];\n  while (queue.length) {\n    const len = queue.length;\n    const level: number[] = [];\n    for (let i = 0; i < len; i++) {\n      const node = queue.shift()!;\n      level.push(node.val);\n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    res.push(level);\n  }\n  return res;\n}",
      "javascript": "function levelOrder(root) {\n  // Write logic here\n  return [];\n}\n",
      "python": "class Solution:\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\n        # Write logic here\n        return []\n",
      "java": "class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // Write logic here\n        return new ArrayList<>();\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    vector<vector<int>> levelOrder(TreeNode* root) {\n        // Write logic here\n        return {};\n    }\n};\n"
},
  },
  "validate-binary-search-tree": {
    inputFormat: "Line 1: space-separated level-order tree node values. Output: true or false.",
    sampleInput: "2 1 3",
    expectedOutput: "true",
    templates: {
      "typescript": "function isValidBST(root: TreeNode | null): boolean {\n  function validate(node: TreeNode | null, min: number, max: number): boolean {\n    if (!node) return true;\n    if (node.val <= min || node.val >= max) return false;\n    return validate(node.left, min, node.val) && validate(node.right, node.val, max);\n  }\n  return validate(root, -Infinity, Infinity);\n}",
      "javascript": "function isValidBST(root) {\n  // Write logic here\n  return false;\n}\n",
      "python": "class Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        # Write logic here\n        return False\n",
      "java": "class Solution {\n    public boolean isValidBST(TreeNode root) {\n        // Write logic here\n        return false;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        // Write logic here\n        return false;\n    }\n};\n"
},
  },
  "lowest-common-ancestor-of-a-binary-search-tree": {
    inputFormat: "Line 1: level-order BST node values. Line 2: target values p and q. Output: LCA node value.",
    sampleInput: "6 2 8 0 4 7 9 null null 3 5\n2 8",
    expectedOutput: "6",
    templates: {
      "typescript": "function lowestCommonAncestor(root: TreeNode | null, p: TreeNode | null, q: TreeNode | null): TreeNode | null {\n  if (!root || !p || !q) return null;\n  if (p.val < root.val && q.val < root.val) return lowestCommonAncestor(root.left, p, q);\n  if (p.val > root.val && q.val > root.val) return lowestCommonAncestor(root.right, p, q);\n  return root;\n}",
      "javascript": "function lowestCommonAncestor(root, p, q) {\n  // Write logic here\n  return root;\n}\n",
      "python": "class Solution:\n    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':\n        # Write logic here\n        return root\n",
      "java": "class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        // Write logic here\n        return root;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        // Write logic here\n        return root;\n    }\n};\n"
},
  },
  "climbing-stairs": {
    inputFormat: "Line 1: integer n steps. Output: distinct ways to reach top.",
    sampleInput: "2",
    expectedOutput: "2",
    templates: {
      "typescript": "function climbStairs(n: number): number {\n  if (n <= 2) return n;\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) {\n    const next = a + b;\n    a = b;\n    b = next;\n  }\n  return b;\n}",
      "javascript": "function climbStairs(n) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int climbStairs(int n) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "house-robber": {
    inputFormat: "Line 1: space-separated money amounts per house. Output: maximum money robbed.",
    sampleInput: "1 2 3 1",
    expectedOutput: "4",
    templates: {
      "typescript": "function rob(nums: number[]): number {\n  let rob1 = 0, rob2 = 0;\n  for (const n of nums) {\n    const temp = Math.max(n + rob1, rob2);\n    rob1 = rob2;\n    rob2 = temp;\n  }\n  return rob2;\n}",
      "javascript": "function rob(nums) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def rob(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int rob(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "longest-increasing-subsequence": {
    inputFormat: "Line 1: space-separated integers. Output: length of longest strictly increasing subsequence.",
    sampleInput: "10 9 2 5 3 7 101 18",
    expectedOutput: "4",
    templates: {
      "typescript": "function lengthOfLIS(nums: number[]): number {\n  const tails: number[] = [];\n  for (const x of nums) {\n    let l = 0, r = tails.length;\n    while (l < r) {\n      const m = Math.floor((l + r) / 2);\n      if (tails[m] < x) l = m + 1;\n      else r = m;\n    }\n    if (l === tails.length) tails.push(x);\n    else tails[l] = x;\n  }\n  return tails.length;\n}",
      "javascript": "function lengthOfLIS(nums) {\n  // Write logic here\n  return 0;\n}\n",
      "python": "class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        # Write logic here\n        return 0\n",
      "java": "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        // Write logic here\n        return 0;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        // Write logic here\n        return 0;\n    }\n};\n"
},
  },
  "clone-graph": {
    inputFormat: "Line 1: number of nodes n. Next n lines: space-separated neighbor indices for each node. Output: cloned graph adjacency list.",
    sampleInput: "4\n2 4\n1 3\n2 4\n1 3",
    expectedOutput: "2 4\n1 3\n2 4\n1 3",
    templates: {
      "typescript": "class Node {\n  val: number;\n  neighbors: Node[];\n  constructor(val?: number, neighbors?: Node[]) {\n    this.val = (val===undefined ? 0 : val);\n    this.neighbors = (neighbors===undefined ? [] : neighbors);\n  }\n}\n\nfunction cloneGraph(node: Node | null): Node | null {\n  if (!node) return null;\n  const visited = new Map<Node, Node>();\n  function dfs(curr: Node): Node {\n    if (visited.has(curr)) return visited.get(curr)!;\n    const copy = new Node(curr.val);\n    visited.set(curr, copy);\n    for (const nei of curr.neighbors) {\n      copy.neighbors.push(dfs(nei));\n    }\n    return copy;\n  }\n  return dfs(node);\n}",
      "javascript": "function cloneGraph(node) {\n  if (!node) return null;\n  const visited = new Map();\n  function dfs(n) {\n    if (visited.has(n)) return visited.get(n);\n    const copy = { val: n.val, neighbors: [] };\n    visited.set(n, copy);\n    for (const nei of n.neighbors) copy.neighbors.push(dfs(nei));\n    return copy;\n  }\n  return dfs(node);\n}\n",
      "python": "class Node:\n    def __init__(self, val = 0, neighbors = None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\nclass Solution:\n    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:\n        # Write logic here\n        return node\n",
      "java": "class Solution {\n    public Node cloneGraph(Node node) {\n        // Write logic here\n        return node;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    Node* cloneGraph(Node* node) {\n        // Write logic here\n        return node;\n    }\n};\n"
},
  },
  "course-schedule": {
    inputFormat: "Line 1: numCourses. Line 2: number of prerequisites m. Next m lines: course prereq pairs. Output: true or false.",
    sampleInput: "2\n1\n1 0",
    expectedOutput: "true",
    templates: {
      "typescript": "function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n  const adj = Array.from({ length: numCourses }, () => [] as number[]);\n  const inDegree = new Array(numCourses).fill(0);\n  for (const [course, pre] of prerequisites) {\n    adj[pre].push(course);\n    inDegree[course]++;\n  }\n  const queue: number[] = [];\n  for (let i = 0; i < numCourses; i++) {\n    if (inDegree[i] === 0) queue.push(i);\n  }\n  let count = 0;\n  while (queue.length) {\n    const node = queue.shift()!;\n    count++;\n    for (const nei of adj[node]) {\n      inDegree[nei]--;\n      if (inDegree[nei] === 0) queue.push(nei);\n    }\n  }\n  return count === numCourses;\n}",
      "javascript": "function canFinish(numCourses, prerequisites) {\n  // Write logic here\n  return false;\n}\n",
      "python": "class Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        # Write logic here\n        return False\n",
      "java": "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Write logic here\n        return false;\n    }\n}\n",
      "cpp": "class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write logic here\n        return false;\n    }\n};\n"
},
  },
};

export const getProblemRuntimeSpec = (problem: ProblemDetail) => specs[problem.id] ?? fallbackSpec(problem);

export const getProblemTemplate = (problem: ProblemDetail, language: string) => {
  const leetcodeSpec = LEETCODE_SPECS[problem.id];
  const runtimeLanguage = language as SupportedLanguage;

  if (leetcodeSpec) {
    if (runtimeLanguage === "python") {
      return `from typing import List, Dict, Optional, Tuple, Set\n\n${leetcodeSpec.pythonSignature}`;
    }
    if (runtimeLanguage === "javascript") {
      return leetcodeSpec.jsSignature;
    }
    if (runtimeLanguage === "typescript") {
      return leetcodeSpec.tsSignature;
    }
    if (runtimeLanguage === "java") {
      return `import java.util.*;\n\n${leetcodeSpec.javaSignature}`;
    }
    if (runtimeLanguage === "cpp") {
      return `#include <vector>\nusing namespace std;\n\n${leetcodeSpec.cppSignature}`;
    }
  }

  const spec = getProblemRuntimeSpec(problem);
  const template = spec.templates[runtimeLanguage] ?? spec.templates.typescript;

  if (runtimeLanguage === "typescript") {
    return withTypeScriptNodeCompat(template);
  }

  return template;
};
