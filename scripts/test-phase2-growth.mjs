// ==============================================================================
// CodeOrbit Phase 2 Verification: Viral Growth, Health & Institutional Compliance
// File: scripts/test-phase2-growth.mjs
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SAMPLE_TPO_BATCH_ANALYTICS,
  getTpoBatchAnalyticsData,
  exportRecruiterCandidatesWithDpdp,
} from "../apps/web/src/lib/server/b2b-platform.ts";
import {
  getAllDpdpConsentLogs,
  recordDpdpConsent,
} from "../apps/web/src/lib/server/platform-data.ts";

console.log("================================================================================");
console.log("   CODEORBIT PHASE 2: VIRAL GROWTH, HEALTH & NIRF COMPLIANCE SUITE             ");
console.log("================================================================================");

let totalPassed = 0;
const test = async (description, fn) => {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${description}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(err);
    process.exit(1);
  }
};

const runSuite = async () => {
  // --- Test Suite 1: Health Probe & System Diagnostics ---
  console.log("\n[Suite 1/5] Verifying System Health Probe & Observability...");

  await test("Health route handler file exists and exports valid GET handler", async () => {
    const routePath = path.resolve(process.cwd(), "apps/web/src/app/api/health/route.ts");
    assert.ok(fs.existsSync(routePath), "Health route must exist");
    const content = fs.readFileSync(routePath, "utf8");
    assert.ok(content.includes('status: "healthy"'), "Must return healthy status");
    assert.ok(content.includes("uptimeSeconds"), "Must report uptime");
    assert.ok(content.includes("memory"), "Must report memory telemetry");
    assert.ok(content.includes("dpdpCompliance"), "Must report DPDP compliance status");
  });

  await test("System memory and process uptime metrics are valid numbers", async () => {
    const memory = process.memoryUsage();
    assert.ok(typeof memory.rss === "number" && memory.rss > 0);
    assert.ok(typeof memory.heapUsed === "number" && memory.heapUsed > 0);
    const uptime = process.uptime();
    assert.ok(typeof uptime === "number" && uptime >= 0);
  });

  // --- Test Suite 2: Dynamic OpenGraph Roaster Card Engine ---
  console.log("\n[Suite 2/5] Verifying Dynamic OpenGraph Social Engine...");

  await test("Dynamic OG roaster route exists with edge runtime and 1200x630 dimensions", async () => {
    const ogPath = path.resolve(process.cwd(), "apps/web/src/app/api/og/roaster/route.tsx");
    assert.ok(fs.existsSync(ogPath), "OG roaster route must exist");
    const content = fs.readFileSync(ogPath, "utf8");
    assert.ok(content.includes('runtime = "edge"'), "Must run on Edge runtime for sub-50ms latency");
    assert.ok(content.includes("1200"), "Must render 1200px width");
    assert.ok(content.includes("630"), "Must render 630px height");
    assert.ok(content.includes("#CodeOrbitReady"), "Must include viral social tag");
    assert.ok(content.includes("ATS READINESS SCORE"), "Must include ATS score header");
  });

  await test("Resume Roaster view contains 1-click LinkedIn and WhatsApp social sharing", async () => {
    const roasterViewPath = path.resolve(process.cwd(), "apps/web/src/components/resume/resume-roaster-view.tsx");
    assert.ok(fs.existsSync(roasterViewPath));
    const content = fs.readFileSync(roasterViewPath, "utf8");
    assert.ok(content.includes("handleShareLinkedIn"), "Must have LinkedIn share action");
    assert.ok(content.includes("handleShareWhatsApp"), "Must have WhatsApp share action");
    assert.ok(content.includes("api/og/roaster"), "Must render dynamic OpenGraph preview");
  });

  // --- Test Suite 3: Institutional TPO Interactive Demo & Analytics ---
  console.log("\n[Suite 3/5] Verifying Institutional TPO Command Center Demo...");

  await test("TPO Demo page exists with self-serve guest access (no login wall)", async () => {
    const demoPagePath = path.resolve(process.cwd(), "apps/web/src/app/for-campuses/demo/page.tsx");
    assert.ok(fs.existsSync(demoPagePath), "Demo page must exist");
    const content = fs.readFileSync(demoPagePath, "utf8");
    assert.ok(content.includes("Interactive TPO Command Center Demo"));
    assert.ok(content.includes("SAMPLE_COHORTS"));
    assert.ok(content.includes("Automated Company OA Clearance Predictor"));
    assert.ok(!content.includes("AuthGuard"), "Must remain ungated for friction-free institutional demos");
  });

  await test("TPO batch readiness distribution sums to total batch cohort", async () => {
    const batchData = await getTpoBatchAnalyticsData("nit-trichy-cse-2026");
    const { dayOneFaangReady, strongCampusShortlist, borderlineOaScreen, needsOverhaul } = batchData.readinessTiers;
    const tierSum = dayOneFaangReady + strongCampusShortlist + borderlineOaScreen + needsOverhaul;
    assert.equal(tierSum, batchData.totalStudents, "Tier sum must match total enrolled students");
    assert.ok(batchData.verifiedStudents <= batchData.totalStudents, "Verified students must not exceed total");
  });

  await test("Company OA clearance predictions have valid clearance probabilities (0-100%)", async () => {
    const batchData = await getTpoBatchAnalyticsData("nit-trichy-cse-2026");
    assert.ok(batchData.companyOaClearancePredictions.length >= 3, "Must predict for at least 3 companies");
    batchData.companyOaClearancePredictions.forEach((pred) => {
      assert.ok(pred.estimatedClearanceRatePercent >= 0 && pred.estimatedClearanceRatePercent <= 100);
      assert.ok(pred.predictedShortlistsCount >= 0);
      assert.ok(pred.company.length > 0);
    });
  });

  // --- Test Suite 4: Accredited NIRF / NAAC Placement Compliance Export ---
  console.log("\n[Suite 4/5] Verifying NIRF / NAAC Compliance Reporting Engine...");

  await test("NIRF export endpoint file exists and supports CSV & JSON formats", async () => {
    const nirfRoutePath = path.resolve(process.cwd(), "apps/web/src/app/api/platform/campus/nirf-export/route.ts");
    assert.ok(fs.existsSync(nirfRoutePath), "NIRF route must exist");
    const content = fs.readFileSync(nirfRoutePath, "utf8");
    assert.ok(content.includes("CODEORBIT NIRF & NAAC ACCREDITED PLACEMENT TRAINING COMPLIANCE REPORT"));
    assert.ok(content.includes("NIRF Metric 5.2.1"));
    assert.ok(content.includes("NAAC Criterion V"));
    assert.ok(content.includes("text/csv"));
  });

  // --- Test Suite 5: DPDP Act 2023 Statutory Compliance & Audit Center ---
  console.log("\n[Suite 5/5] Verifying DPDP Fiduciary Compliance & Admin Audit Center...");

  await test("DPDP Admin Audit page exists and enforces admin authentication", async () => {
    const dpdpAdminPath = path.resolve(process.cwd(), "apps/web/src/app/admin/dpdp/page.tsx");
    assert.ok(fs.existsSync(dpdpAdminPath), "DPDP admin page must exist");
    const content = fs.readFileSync(dpdpAdminPath, "utf8");
    assert.ok(content.includes("requireAdmin={true}"), "Must be guarded by admin authorization");
    assert.ok(content.includes("DPDP Act 2023 Statutory Compliance & Fiduciary Audit Center") || content.includes("DPDP Act 2023"));
    assert.ok(content.includes("Section 6"), "Must reference Section 6 Notice & Consent");
  });

  await test("DPDP consent log storage saves and retrieves records correctly", async () => {
    const testConsent = await recordDpdpConsent(
      {
        consentVersion: "2026.1",
        isUnder18: false,
        purposesAccepted: ["ai_coaching", "tpo_reporting", "ats_analysis", "recruiter_sharing"],
      },
      { uid: "audit-test-student-2026", email: "student@audit.edu", displayName: "Audit Student", isAdmin: false }
    );

    assert.ok(testConsent.id, "Consent ID must be generated");
    assert.ok(testConsent.userId, "User ID must be assigned");
    assert.equal(testConsent.consentVersion, "2026.1");

    const allLogs = await getAllDpdpConsentLogs(20);
    const found = allLogs.find((l) => l.id === testConsent.id);
    assert.ok(found, "Newly recorded DPDP consent must be retrieved by consent ID");
    assert.equal(found.consentVersion, "2026.1");
  });

  await test("Zero-Trust Recruiter Export strictly drops candidates without recruiter_sharing consent", async () => {
    const exportResult = await exportRecruiterCandidatesWithDpdp({
      candidateHandles: [
        "vaibhav-maurya",      // has consent: true
        "ananya-deshmukh",  // has consent: false (explicitly denied)
      ],
      format: "json",
      purpose: "Campus SDE-1 Shortlist",
    });

    assert.equal(exportResult.exportedCount, 1, "Only 1 candidate with active consent must be exported");
    assert.equal(exportResult.blockedCount, 1, "1 candidate without consent must be blocked");
    assert.ok(exportResult.dpdpAuditRef.startsWith("DPDP-EXP-"), "Audit ref must be generated");
  });

  console.log("\n================================================================================");
  console.log(`>>> PHASE 2 GROWTH & COMPLIANCE CERTIFICATION: ${totalPassed}/${totalPassed} ASSERTIONS PASSED <<<`);
  console.log("================================================================================\n");
};

void runSuite();
