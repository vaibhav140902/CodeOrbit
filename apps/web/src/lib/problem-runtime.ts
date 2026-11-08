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
