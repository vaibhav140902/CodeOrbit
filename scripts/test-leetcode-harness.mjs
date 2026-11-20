#!/usr/bin/env node
/**
 * Automated Verification: LeetCode Multi-Format Input/Output & Driver Harness
 * Tests two-sum, typed inputs, booleans, strings, and multi-format inputs across Python and JavaScript.
 */

import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { wrapCodeForExecution, areOutputsEquivalent } from "../apps/web/src/lib/code-harness.ts";

console.log("----------------------------------------------------------------");
console.log("Running LeetCode Multi-Format Driver & Output Equivalence Tests");
console.log("----------------------------------------------------------------");

// 1. Output Equivalence Matrix
console.log("Checking areOutputsEquivalent across formats...");
assert(areOutputsEquivalent("[0,1]", "[0, 1]"), "[0,1] == [0, 1]");
assert(areOutputsEquivalent("0 1", "[0,1]"), "0 1 == [0,1]");
assert(areOutputsEquivalent("[0,1]", "0 1"), "[0,1] == 0 1");
assert(areOutputsEquivalent("true", "True"), "true == True");
assert(areOutputsEquivalent("false", "False"), "false == False");
assert(areOutputsEquivalent('"hello"', "hello"), '"hello" == hello');
assert(areOutputsEquivalent("42", "42"), "42 == 42");
assert(!areOutputsEquivalent("[0,1]", "[0,2]"), "[0,1] != [0,2]");
assert(!areOutputsEquivalent("0 1", "0 2"), "0 1 != 0 2");
assert(!areOutputsEquivalent("true", "false"), "true != false");
console.log("✓ areOutputsEquivalent passed 10/10 matrix checks.");

// 2. Python Two-Sum Class Solution (Multi-Format Inputs)
const pythonClassSolution = `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, x in enumerate(nums):
            comp = target - x
            if comp in seen:
                return [seen[comp], i]
            seen[x] = i
        return []
`;

const wrappedPyClass = wrapCodeForExecution("two-sum", "python", pythonClassSolution);

// Test Format A: LeetCode description format `nums = [2,7,11,15], target = 9`
const pyRunA = spawnSync("python3", ["-c", wrappedPyClass], {
  input: "nums = [2,7,11,15], target = 9",
  encoding: "utf8",
});
assert.strictEqual(pyRunA.status, 0, `Python Format A crashed: ${pyRunA.stderr}`);
assert(areOutputsEquivalent(pyRunA.stdout.trim(), "[0,1]"), `Format A output: ${pyRunA.stdout}`);
console.log("✓ Python two-sum Class parsed 'nums = [2,7,11,15], target = 9' -> " + pyRunA.stdout.trim());

// Test Format B: Plain lines format `2 7 11 15\n9`
const pyRunB = spawnSync("python3", ["-c", wrappedPyClass], {
  input: "2 7 11 15\n9",
  encoding: "utf8",
});
assert.strictEqual(pyRunB.status, 0, `Python Format B crashed: ${pyRunB.stderr}`);
assert(areOutputsEquivalent(pyRunB.stdout.trim(), "[0,1]"), `Format B output: ${pyRunB.stdout}`);
console.log("✓ Python two-sum Class parsed '2 7 11 15\\n9' -> " + pyRunB.stdout.trim());

// Test Format C: Multi-line JSON `[2,7,11,15]\n9`
const pyRunC = spawnSync("python3", ["-c", wrappedPyClass], {
  input: "[2,7,11,15]\n9",
  encoding: "utf8",
});
assert.strictEqual(pyRunC.status, 0, `Python Format C crashed: ${pyRunC.stderr}`);
assert(areOutputsEquivalent(pyRunC.stdout.trim(), "[0,1]"), `Format C output: ${pyRunC.stdout}`);
console.log("✓ Python two-sum Class parsed '[2,7,11,15]\\n9' -> " + pyRunC.stdout.trim());

// 3. Python Standalone Function `def twoSum(nums, target)`
const pythonFnSolution = `
def twoSum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        comp = target - x
        if comp in seen:
            return [seen[comp], i]
        seen[x] = i
    return []
`;

const wrappedPyFn = wrapCodeForExecution("two-sum", "python", pythonFnSolution);
const pyRunFn = spawnSync("python3", ["-c", wrappedPyFn], {
  input: "nums = [3,2,4], target = 6",
  encoding: "utf8",
});
assert.strictEqual(pyRunFn.status, 0, `Python standalone fn crashed: ${pyRunFn.stderr}`);
assert(areOutputsEquivalent(pyRunFn.stdout.trim(), "[1,2]"), `Standalone fn output: ${pyRunFn.stdout}`);
console.log("✓ Python two-sum standalone function parsed 'nums = [3,2,4], target = 6' -> " + pyRunFn.stdout.trim());

// 4. JavaScript Two-Sum Solution (Multi-Format Inputs)
const jsSolution = `
function twoSum(nums, target) {
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (comp in seen) return [seen[comp], i];
        seen[nums[i]] = i;
    }
    return [];
}
`;

const wrappedJs = wrapCodeForExecution("two-sum", "javascript", jsSolution);

// JS Format A: LeetCode format
const jsRunA = spawnSync("node", ["-e", wrappedJs], {
  input: "nums = [2,7,11,15], target = 9",
  encoding: "utf8",
});
assert.strictEqual(jsRunA.status, 0, `JS Format A crashed: ${jsRunA.stderr}`);
assert(areOutputsEquivalent(jsRunA.stdout.trim(), "[0,1]"), `JS Format A output: ${jsRunA.stdout}`);
console.log("✓ JS two-sum parsed 'nums = [2,7,11,15], target = 9' -> " + jsRunA.stdout.trim());

// JS Format B: Plain lines format
const jsRunB = spawnSync("node", ["-e", wrappedJs], {
  input: "2 7 11 15\n9",
  encoding: "utf8",
});
assert.strictEqual(jsRunB.status, 0, `JS Format B crashed: ${jsRunB.stderr}`);
assert(areOutputsEquivalent(jsRunB.stdout.trim(), "[0,1]"), `JS Format B output: ${jsRunB.stdout}`);
console.log("✓ JS two-sum parsed '2 7 11 15\\n9' -> " + jsRunB.stdout.trim());

// 5. Python String & Boolean Problems
const pyReverseSol = `
class Solution:
    def reverseString(self, s: str) -> str:
        return s[::-1]
`;
const wrappedPyRev = wrapCodeForExecution("reverse-string", "python", pyReverseSol);
const pyRunRev = spawnSync("python3", ["-c", wrappedPyRev], {
  input: 's = "hello"',
  encoding: "utf8",
});
assert.strictEqual(pyRunRev.status, 0, `Python reverseString crashed: ${pyRunRev.stderr}`);
assert(areOutputsEquivalent(pyRunRev.stdout.trim(), "olleh"), `reverse output: ${pyRunRev.stdout}`);
console.log("✓ Python reverse-string parsed 's = \"hello\"' -> " + pyRunRev.stdout.trim());

const pyValidParenSol = `
class Solution:
    def isValid(self, s: str) -> bool:
        pairs = {')': '(', '}': '{', ']': '['}
        stack = []
        for c in s:
            if c in "({[":
                stack.append(c)
            elif not stack or stack.pop() != pairs.get(c):
                return False
        return len(stack) == 0
`;
const wrappedPyVP = wrapCodeForExecution("valid-parentheses", "python", pyValidParenSol);
const pyRunVP = spawnSync("python3", ["-c", wrappedPyVP], {
  input: 's = "()[]{}"',
  encoding: "utf8",
});
assert.strictEqual(pyRunVP.status, 0, `Python isValid crashed: ${pyRunVP.stderr}`);
assert(areOutputsEquivalent(pyRunVP.stdout.trim(), "true"), `isValid output: ${pyRunVP.stdout}`);
console.log("✓ Python valid-parentheses parsed 's = \"()[]{}\"' -> " + pyRunVP.stdout.trim());

console.log("----------------------------------------------------------------");
console.log("ALL LEETCODE MULTI-FORMAT HARNESS TESTS PASSED (100%)");
console.log("----------------------------------------------------------------");
