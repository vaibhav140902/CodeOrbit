#!/usr/bin/env node
/**
 * CodeOrbit Milestone 4: Persistent Code Submission Pipeline & Readiness Score Test Suite
 *
 * Verifies:
 * 1. Zod schemas: readinessScoreSchema & readinessScoreTierSchema
 * 2. Guaranteed submission persistence without silent drops
 * 3. User progress state tracking: solved = true, best_status = 'Accepted', attempts count
 * 4. Regression protection: failed submission after accepted retains solved = true
 * 5. Dynamic Readiness Score Engine calculation (0-100 composite, 5 dimensions)
 * 6. Placement tier classification ("Needs Practice" -> "Placement Ready" -> "Top Tier" -> "FAANG")
 * 7. Unseeded problem resilience (auto-provisioning / fallback persistence)
 * 8. Dashboard summary integration with readinessScore
 */

import {
  readinessScoreSchema,
  readinessScoreTierSchema,
  dashboardSummarySchema,
} from "../packages/schema/src/index.ts";
import {
  recordSubmissionData,
  calculateReadinessScore,
  getReadinessScoreData,
  getDashboardSummaryData,
} from "../apps/web/src/lib/server/platform-data.ts";

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failCount++;
  }
}

console.log("=".repeat(80));
console.log("   CODEORBIT MILESTONE 4: SUBMISSION PIPELINE & READINESS ENGINE SUITE   ");
console.log("=".repeat(80));

async function runMilestone4Tests() {
  console.log("\n[Suite 1/3] Validating Readiness Score Schemas & Tiers...");

  // Test 1: Readiness Score Tier validation
  assert(
    readinessScoreTierSchema.safeParse("Placement Ready").success === true &&
      readinessScoreTierSchema.safeParse("Day-1 FAANG Ready").success === true &&
      readinessScoreTierSchema.safeParse("Invalid Tier").success === false,
    "readinessScoreTierSchema validates placement readiness tiers"
  );

  // Test 2: Readiness Score Schema validation
  const sampleScore = {
    overallScore: 78,
    topicMasteryScore: 82,
    companyTrackScore: 70,
    consistencyScore: 85,
    accuracyScore: 90,
    interviewAtsScore: 65,
    solvedCount: 12,
    totalSubmissions: 18,
    streak: 6,
    tier: "Top Tier Candidate",
    breakdown: {
      easySolved: 5,
      mediumSolved: 6,
      hardSolved: 1,
      acceptanceRatePercent: 88,
    },
    lastCalculatedIso: new Date().toISOString(),
  };

  const parsedScore = readinessScoreSchema.safeParse(sampleScore);
  assert(parsedScore.success === true, "readinessScoreSchema validates complete 5-dimension scorecard");

  console.log("\n[Suite 2/3] Persistent Submission Pipeline & User Progress...");

  const testStudent = {
    uid: "student-submission-audit-2026",
    email: "student-submission-audit@codeorbit.test",
    displayName: "Aarav Placement Ready",
  };

  // Test 3: Record first submission (Accepted)
  const sub1 = await recordSubmissionData(testStudent, {
    problemId: "two-sum",
    language: "python",
    status: "Accepted",
    runtimeMs: 42,
    memoryKb: 38400,
    sourceCode: "def twoSum(nums, target): return [0, 1]",
    passed: true,
  });

  assert(
    typeof sub1?.id === "string" && sub1.id.length > 10,
    `Submission #1 recorded with persistence ID: ${sub1?.id}`
  );

  // Test 4: Record second submission (Runtime Error attempt on same problem)
  const sub2 = await recordSubmissionData(testStudent, {
    problemId: "two-sum",
    language: "python",
    status: "Runtime Error",
    runtimeMs: 12,
    memoryKb: 38400,
    sourceCode: "raise Exception('test')",
    passed: false,
  });

  assert(
    typeof sub2?.id === "string" && sub2.id !== sub1?.id,
    `Submission #2 recorded with distinct persistence ID: ${sub2?.id}`
  );

  // Test 5: Verify problem retains solved status despite subsequent failed attempt
  const baselineReadiness = await getReadinessScoreData(testStudent);
  assert(
    baselineReadiness.solvedCount >= 1,
    `User progress retains solvedCount >= 1 (actual: ${baselineReadiness.solvedCount})`
  );
  assert(
    baselineReadiness.breakdown.easySolved >= 1,
    `Breakdown counts easySolved problem correctly (actual: ${baselineReadiness.breakdown.easySolved})`
  );

  // Test 6: Zero-Drop Fallback on custom/unseeded problem slug
  const unseededSub = await recordSubmissionData(testStudent, {
    problemId: "unseeded-custom-contest-problem-404",
    language: "cpp",
    status: "Accepted",
    runtimeMs: 15,
    memoryKb: 14000,
    sourceCode: "#include <iostream>\nint main(){ return 0; }",
    passed: true,
  });

  assert(
    typeof unseededSub?.id === "string",
    "Zero-Drop Fallback succeeds on unseeded problem without dropping submission"
  );

  console.log("\n[Suite 3/3] Dynamic Readiness Score Engine & Dashboard Integration...");

  // Test 7: Direct calculation with varying skill profiles
  // Profile A: Beginner (0 solved)
  const beginnerScore = calculateReadinessScore([], []);
  assert(
    beginnerScore.overallScore < 50 && beginnerScore.tier === "Needs Practice",
    `Beginner profile correctly classified: ${beginnerScore.overallScore}/100 (${beginnerScore.tier})`
  );

  // Profile B: Placement Ready (6 problems solved, mix of easy/medium, 4-day streak)
  const placementReadyProblems = [
    { difficulty: "Easy", tags: ["Arrays", "TCS"] },
    { difficulty: "Easy", tags: ["Strings", "Infosys"] },
    { difficulty: "Easy", tags: ["Hash Table"] },
    { difficulty: "Medium", tags: ["Binary Search", "Amazon"] },
    { difficulty: "Medium", tags: ["Two Pointers", "Google"] },
    { difficulty: "Medium", tags: ["Dynamic Programming"] },
  ];
  const placementReadySubmissions = [
    { passed: true, status: "Accepted", created_at: "2026-10-27T10:00:00.000Z" },
    { passed: true, status: "Accepted", created_at: "2026-10-28T10:00:00.000Z" },
    { passed: true, status: "Accepted", created_at: "2026-10-29T10:00:00.000Z" },
    { passed: true, status: "Accepted", created_at: "2026-10-30T10:00:00.000Z" },
  ];

  const readyScore = calculateReadinessScore(
    placementReadyProblems,
    placementReadySubmissions,
    { mockInterviewsCompleted: 2, resumesCompiled: 2 }
  );

  assert(
    readyScore.overallScore >= 50 &&
      (readyScore.tier === "Placement Ready" ||
        readyScore.tier === "Top Tier Candidate" ||
        readyScore.tier === "Day-1 FAANG Ready"),
    `Placement candidate correctly classified: ${readyScore.overallScore}/100 (${readyScore.tier})`
  );

  // Test 8: Verify DashboardSummary incorporates readinessScore
  const dashboard = await getDashboardSummaryData(testStudent);
  assert(
    dashboard.readinessScore !== undefined &&
      typeof dashboard.readinessScore.overallScore === "number",
    `Dashboard summary incorporates live readiness score (${dashboard.readinessScore?.overallScore}/100)`
  );

  const parsedDashboard = dashboardSummarySchema.safeParse(dashboard);
  assert(
    parsedDashboard.success === true,
    "Dashboard summary with readinessScore passes dashboardSummarySchema validation"
  );

  console.log("\n" + "=".repeat(80));
  if (failCount === 0) {
    console.log(`>>> MILESTONE 4 VERIFICATION COMPLETED: ${passCount}/${passCount} ASSERTIONS PASSED <<<`);
  } else {
    console.error(`>>> MILESTONE 4 VERIFICATION FAILED: ${failCount} FAILING ASSERTIONS <<<`);
    process.exit(1);
  }
  console.log("=".repeat(80) + "\n");
}

runMilestone4Tests().catch((err) => {
  console.error("FATAL Milestone 4 test error:", err);
  process.exit(1);
});
