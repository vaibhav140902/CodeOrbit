import assert from "node:assert/strict";
import {
  aiAssistModeSchema,
  aiAssistInputSchema,
  companyInterviewContextSchema,
  problemDetailSchema,
} from "../packages/schema/src/index.ts";
import { generateDeterministicProblemAssist } from "../apps/web/src/lib/server/ai-shield.ts";

console.log("Starting Milestone 6: Monaco Workspace & Socratic Hint System Test Suite...\n");

async function runTests() {
  // Test 1: Verify Company Interview Context Schema
  console.log("Test 1: Company Interview Context Schema & Validation");
  const validContext = {
    targetCompanies: ["Amazon SDE-1", "TCS Digital", "Infosys SP"],
    roundType: "Online Assessment (OA)",
    frequency: "High Frequency",
    timeTargetMinutes: 20,
    optimalComplexity: {
      time: "O(N)",
      space: "O(N)",
    },
    trapAlert: "Nested loop O(N^2) brute force will Time Out on 10^5 elements.",
  };

  const parsedContext = companyInterviewContextSchema.parse(validContext);
  assert.equal(parsedContext.frequency, "High Frequency");
  assert.equal(parsedContext.timeTargetMinutes, 20);

  // Invalid frequency should fail validation
  assert.throws(() => {
    companyInterviewContextSchema.parse({
      ...validContext,
      frequency: "Ultra Rare",
    });
  }, /Invalid/);
  console.log("  ✓ Company Interview Context schema validates placement metadata.\n");

  // Test 2: AI Assist Mode Schema Extension
  console.log("Test 2: Socratic AI Assist Modes Schema");
  const expectedModes = ["hint", "hint_1", "hint_2", "hint_3", "eli5", "solver", "review"];
  for (const mode of expectedModes) {
    assert.equal(aiAssistModeSchema.parse(mode), mode, `Mode ${mode} must be valid`);
  }

  assert.throws(() => {
    aiAssistModeSchema.parse("invalid_mode");
  }, /Invalid/);
  console.log("  ✓ All 7 AI Assist modes (including 3-tier Socratic hints) validated.\n");

  // Test 3: Level 1 Socratic Hint Generation (Conceptual Nudge)
  console.log("Test 3: Socratic Hint Level 1 (Mental Model & Complexity)");
  const level1Input = {
    problemId: "two-sum",
    mode: "hint_1",
    language: "typescript",
    problemName: "Two Sum",
    problemDifficulty: "Easy",
  };

  const level1Result = generateDeterministicProblemAssist(level1Input);
  assert.match(level1Result.title, /Level 1/i);
  assert.match(level1Result.content, /Conceptual Nudge|Mental Model/i);
  assert.match(level1Result.content, /O\(N\)/i, "Level 1 must state target complexity");
  assert.ok(!level1Result.content.includes("function solve("), "Level 1 must not reveal executable code");
  console.log("  ✓ Level 1 provides conceptual nudge & target complexity without code leak.\n");

  // Test 4: Level 2 Socratic Hint Generation (Data Structure & Pattern)
  console.log("Test 4: Socratic Hint Level 2 (Data Structure & Pattern)");
  const level2Input = {
    problemId: "two-sum",
    mode: "hint_2",
    language: "typescript",
    problemName: "Two Sum",
    problemDifficulty: "Easy",
  };

  const level2Result = generateDeterministicProblemAssist(level2Input);
  assert.match(level2Result.title, /Level 2/i);
  assert.match(level2Result.content, /Hash Map|Strategy/i, "Level 2 must suggest data structure");
  console.log("  ✓ Level 2 provides optimal data structure & pattern recommendation.\n");

  // Test 5: Level 3 Socratic Hint Generation (Pseudocode Breakdown)
  console.log("Test 5: Socratic Hint Level 3 (Step-by-Step Pseudocode)");
  const level3Input = {
    problemId: "two-sum",
    mode: "hint_3",
    language: "typescript",
    problemName: "Two Sum",
    problemDifficulty: "Easy",
  };

  const level3Result = generateDeterministicProblemAssist(level3Input);
  assert.match(level3Result.title, /Level 3/i);
  assert.match(level3Result.content, /Breakdown|Edge Cases/i, "Level 3 must provide algorithmic breakdown");
  console.log("  ✓ Level 3 provides step-by-step algorithmic breakdown and edge case checklist.\n");

  // Test 6: Guarded Full Solution (Solver)
  console.log("Test 6: Guarded AI Auto-Solver Reference Solution");
  const solverInput = {
    problemId: "two-sum",
    mode: "solver",
    language: "typescript",
    problemName: "Two Sum",
    problemDifficulty: "Easy",
  };

  const solverResult = generateDeterministicProblemAssist(solverInput);
  assert.match(solverResult.title, /Solver/i);
  assert.match(solverResult.content, /Strategic|Strategy/i);
  assert.match(solverResult.content, /Reference Implementation|Reference Solution/i);
  console.log("  ✓ Auto-solver produces complete guarded reference solution with complexity.\n");

  // Test 7: Explain Like I'm 5 (ELI5) Analogy
  console.log("Test 7: Explain Like I'm 5 Intuitive Analogy");
  const eli5Input = {
    problemId: "two-sum",
    mode: "eli5",
    language: "python",
    problemName: "Two Sum",
    problemDifficulty: "Easy",
  };

  const eli5Result = generateDeterministicProblemAssist(eli5Input);
  assert.match(eli5Result.title, /Explain Like I'm 5/i);
  assert.match(eli5Result.content, /Analogy/i);
  assert.match(eli5Result.content, /Simple Steps/i);
  console.log("  ✓ ELI5 provides intuitive real-world analogy and simplified steps.\n");

  // Test 8: Problem Detail with Company Context Integration
  console.log("Test 8: Problem Detail Schema with Optional Company Context");
  const mockProblemDetail = {
    id: "two-sum",
    problemName: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table", "Amazon", "TCS"],
    description: "Given an array of integers nums and an integer target...",
    examples: [
      { input: "2 7 11 15\n9", output: "0 1" },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
    starterCode: "function twoSum(nums, target) {}",
    companyContext: validContext,
  };

  const parsedProblem = problemDetailSchema.parse(mockProblemDetail);
  assert.equal(parsedProblem.companyContext?.frequency, "High Frequency");
  assert.equal(parsedProblem.companyContext?.optimalComplexity.time, "O(N)");
  console.log("  ✓ Problem Detail schema seamlessly incorporates Company Context metadata.\n");

  console.log("==================================================================");
  console.log("ALL 8 MONACO WORKSPACE & SOCRATIC HINTS TESTS PASSED (100%)");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
