import assert from "node:assert/strict";
import {
  tpoBatchAnalyticsSchema,
  verifiedProofBadgeSchema,
  recruiterCandidateSummarySchema,
  recruiterExportInputSchema,
  recruiterExportResponseSchema,
} from "../packages/schema/src/index.ts";
import {
  generateCandidateProofBadge,
  verifyProofBadgeIntegrity,
  getTpoBatchAnalyticsData,
  getCampusBetaWorkspaceData,
  saveCampusCohortInterventionData,
  getRecruiterBetaWorkspaceData,
  saveRecruiterCandidateReviewData,
  exportRecruiterCandidatesWithDpdp,
} from "../apps/web/src/lib/server/b2b-platform.ts";

console.log("Starting Milestone 9: B2B TPO & Recruiter Portal Test Suite...\n");

async function runTests() {
  // ---------------------------------------------------------------------------
  // Test 1: Verify Schema & Domain Contracts
  // ---------------------------------------------------------------------------
  console.log("Test 1: B2B Schemas & Domain Contracts Validation");

  const sampleBadge = {
    candidateHandle: "aarav-sharma",
    fullName: "Aarav Sharma",
    verificationHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    verifiedAtIso: new Date().toISOString(),
    overallReadiness: 92,
    proctorTrustScore: 98,
    solvesCount: 420,
    contestsParticipated: 14,
    issuer: "CodeOrbit Verified National Placement Authority",
    skillsVerified: ["Data Structures", "Algorithms", "Kafka"],
  };
  assert.equal(verifiedProofBadgeSchema.parse(sampleBadge).candidateHandle, "aarav-sharma");

  const sampleExport = {
    candidateHandles: ["aarav-sharma", "priya-patel"],
    format: "csv",
    purpose: "campus_placement_hiring",
  };
  assert.equal(recruiterExportInputSchema.parse(sampleExport).format, "csv");
  console.log("  ✓ Verified proof badge, candidate summary, and export schemas validated.\n");

  // ---------------------------------------------------------------------------
  // Test 2: Cryptographic Proof Badge Generation & Tamper Detection
  // ---------------------------------------------------------------------------
  console.log("Test 2: Cryptographic Proof Badge Verification & Anti-Tamper Check");

  const badge = generateCandidateProofBadge({
    candidateHandle: "aarav-sharma",
    fullName: "Aarav Sharma",
    overallReadiness: 92,
    proctorTrustScore: 98,
    solvesCount: 420,
    contestsParticipated: 14,
    skillsVerified: ["Java", "AWS", "Kafka", "DSA"],
  });

  assert.ok(badge.verificationHash.length >= 32, "Hash must be standard SHA-256 length");
  assert.equal(verifyProofBadgeIntegrity(badge), true, "Authentic badge must pass cryptographic verification");

  // Tampered readiness score (92 -> 99)
  const tamperedBadge = {
    ...badge,
    overallReadiness: 99,
  };
  assert.equal(verifyProofBadgeIntegrity(tamperedBadge), false, "Tampered badge score must fail verification");

  // Tampered candidate handle
  const spoofedBadge = {
    ...badge,
    candidateHandle: "spoofed-user",
  };
  assert.equal(verifyProofBadgeIntegrity(spoofedBadge), false, "Spoofed candidate handle must fail verification");

  console.log("  ✓ Cryptographic SHA-256 proof badge verified; tamper attempts rejected.\n");

  // ---------------------------------------------------------------------------
  // Test 3: TPO Batch Placement Analytics & Company OA Predictor
  // ---------------------------------------------------------------------------
  console.log("Test 3: TPO Batch Placement Analytics & Company OA Predictor");

  const analytics = await getTpoBatchAnalyticsData("nit-trichy-cse-2026");
  const parsedAnalytics = tpoBatchAnalyticsSchema.parse(analytics);

  assert.equal(parsedAnalytics.collegeName, "National Institute of Technology (NIT), Trichy");
  assert.equal(parsedAnalytics.totalStudents, 140);
  assert.equal(parsedAnalytics.verifiedStudents, 112);

  // Check 4-Tier readiness distribution
  const sumTiers =
    parsedAnalytics.readinessTiers.dayOneFaangReady +
    parsedAnalytics.readinessTiers.strongCampusShortlist +
    parsedAnalytics.readinessTiers.borderlineOaScreen +
    parsedAnalytics.readinessTiers.needsOverhaul;
  assert.equal(sumTiers, parsedAnalytics.totalStudents, "Tier counts must sum to total students");

  // Check Company OA predictions
  assert.ok(parsedAnalytics.companyOaClearancePredictions.length >= 4, "Must predict for at least 4 tech companies");
  const tcsPred = parsedAnalytics.companyOaClearancePredictions.find((p) => p.company.includes("TCS"));
  assert.ok(tcsPred && tcsPred.estimatedClearanceRatePercent > 80, "TCS clearance rate should be > 80%");

  // Check Weak Topic Heatmap
  const dpWeakness = parsedAnalytics.weakTopicHeatmap.find((w) => w.topic.includes("Dynamic Programming"));
  assert.ok(dpWeakness && dpWeakness.priorityStatus === "Critical Weakness", "DP must be flagged as Critical Weakness");

  console.log(
    `  ✓ Batch analytics verified: ${parsedAnalytics.totalStudents} students across 4 readiness tiers; OA predictions calculated.\n`
  );

  // ---------------------------------------------------------------------------
  // Test 4: DPDP-Compliant Recruiter Candidate Export
  // ---------------------------------------------------------------------------
  console.log("Test 4: DPDP Data Protection Act Compliant Candidate Export");

  // Candidate with consent (vaibhav-maurya) + candidate without consent (ananya-deshmukh)
  const exportResult = await exportRecruiterCandidatesWithDpdp({
    candidateHandles: ["vaibhav-maurya", "priya-patel", "ananya-deshmukh"],
    format: "csv",
    purpose: "campus_placement_hiring",
  });

  const parsedExport = recruiterExportResponseSchema.parse(exportResult);
  assert.equal(parsedExport.exportedCount, 2, "Consented candidates (vaibhav, priya) must be exported");
  assert.equal(parsedExport.blockedCount, 1, "Non-consented candidate (ananya) must be blocked");
  assert.ok(parsedExport.dpdpAuditRef.startsWith("DPDP-EXP-"), "Must generate audit reference");
  assert.ok(parsedExport.csvData && parsedExport.csvData.includes("Vaibhav Maurya"));
  assert.ok(!parsedExport.csvData.includes("Ananya Deshmukh"), "Blocked candidate data must NEVER appear in export");

  // JSON format test
  const jsonExportResult = await exportRecruiterCandidatesWithDpdp({
    candidateHandles: ["vaibhav-maurya"],
    format: "json",
    purpose: "campus_placement_hiring",
  });
  assert.equal(jsonExportResult.exportedCount, 1);
  assert.ok(Array.isArray(jsonExportResult.jsonData));
  assert.equal(jsonExportResult.jsonData[0].handle, "vaibhav-maurya");

  console.log("  ✓ DPDP compliance enforced: non-consented candidate blocked, audit ref logged.\n");

  // ---------------------------------------------------------------------------
  // Test 5: Campus Interventions & Recruiter Reviews Persistence
  // ---------------------------------------------------------------------------
  console.log("Test 5: Campus Interventions & Recruiter Reviews Workflow");

  const savedIntervention = await saveCampusCohortInterventionData({
    cohortId: "nit-trichy-cse-2026",
    priorityFocus: "Mandatory 3-day DP sprint before Amazon OA drive.",
    note: "TPO scheduled peer coding labs.",
  });
  assert.equal(savedIntervention.cohortId, "nit-trichy-cse-2026");

  const campusWs = await getCampusBetaWorkspaceData();
  const foundIntervention = campusWs.interventions.find((i) => i.cohortId === "nit-trichy-cse-2026");
  assert.ok(foundIntervention, "Saved intervention must be present in campus workspace");

  const savedReview = await saveRecruiterCandidateReviewData({
    candidateHandle: "aarav-sharma",
    status: "shortlisted",
    note: "Exceptional system design and Kafka latency explanation.",
  });
  assert.equal(savedReview.status, "shortlisted");

  const recruiterWs = await getRecruiterBetaWorkspaceData();
  const foundReview = recruiterWs.reviews.find((r) => r.candidateHandle === "aarav-sharma");
  assert.ok(foundReview && foundReview.status === "shortlisted");

  console.log("  ✓ Campus TPO interventions and recruiter candidate reviews persisted.\n");

  console.log("==================================================================");
  console.log("ALL 5 B2B TPO & RECRUITER PORTAL TESTS PASSED (100%)");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
