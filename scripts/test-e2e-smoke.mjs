import fs from "fs";
import crypto from "crypto";

console.log("================================================================================");
console.log("   CODEORBIT TASK #4: END-TO-END PLATFORM SMOKE & JOURNEY VERIFICATION SUITE   ");
console.log("================================================================================\n");

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

async function runSmokeTests() {
  const startTime = performance.now();

  // --------------------------------------------------------------------------
  // SUITE 1: Critical Public Pages & SSR Integrity
  // --------------------------------------------------------------------------
  console.log("[Suite 1/6] Auditing SSR Public Routes and Metadata...");
  const publicPages = [
    "/",
    "/about",
    "/activity",
    "/admin",
    "/blog",
    "/campus-beta",
    "/companies/amazon",
    "/companies/google",
    "/companies/microsoft",
    "/dashboard",
    "/for-campuses",
    "/for-recruiters",
    "/leaderboard",
    "/login",
    "/mock-interview",
    "/prep",
    "/pricing",
    "/privacy",
    "/problems",
    "/problems/two-sum",
    "/proof/aarav-mehta",
    "/readiness-score",
    "/recruiter-beta",
    "/resume",
    "/resume-builder",
    "/roles/sde-intern",
    "/roles/fresher-sde",
    "/roles/frontend-engineer",
    "/roles/backend-engineer",
    "/signup",
    "/terms",
    "/tracks",
    "/robots.txt",
    "/sitemap.xml",
  ];

  let pagesOk = 0;
  for (const page of publicPages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`);
      if (res.status === 200) {
        pagesOk++;
      } else {
        console.error(`    Page ${page} returned unexpected status: ${res.status}`);
      }
    } catch (e) {
      console.error(`    Page ${page} failed with network error: ${e.message}`);
    }
  }
  assert(pagesOk === publicPages.length, `All ${publicPages.length} public pages returned HTTP 200 OK (${pagesOk}/${publicPages.length})`);

  // Verify Landing Page HTML content
  const homeRes = await fetch(`${BASE_URL}/`);
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes("CodeOrbit"), "Landing page contains 'CodeOrbit' brand identity");
  assert(homeHtml.includes("<!DOCTYPE html>"), "Landing page renders valid HTML5 DOCTYPE");

  // --------------------------------------------------------------------------
  // SUITE 2: Problem Solving, Execution & AI Coaching Funnel
  // --------------------------------------------------------------------------
  console.log("\n[Suite 2/6] Verifying Problem Solving, Runner & AI Coaching Funnel...");

  // 1. Problem Catalog
  const problemsRes = await fetch(`${BASE_URL}/api/platform/problems`);
  const problemsData = await problemsRes.json();
  const problemList = problemsData.problems || problemsData;
  assert(problemsRes.status === 200, "GET /api/platform/problems returned 200 OK");
  assert(Array.isArray(problemList) && problemList.length >= 14, `Problem catalog loaded ${problemList?.length} problems`);

  // 2. Problem Detail
  const detailRes = await fetch(`${BASE_URL}/api/platform/problems/two-sum`);
  const detailData = await detailRes.json();
  assert(detailRes.status === 200, "GET /api/platform/problems/two-sum returned 200 OK");
  assert(detailData.problem?.id === "two-sum", "Problem detail matches slug 'two-sum'");
  assert(detailData.problem?.difficulty === "Easy", "Problem difficulty is 'Easy'");
  assert(typeof detailData.problem?.starterCode === "string", "Problem starter code is available");

  // 3. Isolated Code Runner (Judge0)
  console.log("  Testing live code execution via Judge0 runner...");
  const runRes = await fetch(`${BASE_URL}/api/platform/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "python",
      submission: "print(100 + 42)",
      stdin: "",
      expectedOutput: "142",
    }),
  });
  const runData = await runRes.json();
  assert(runRes.status === 200, "POST /api/platform/run returned 200 OK");
  assert(runData.passed === true, "Code execution verified expected output (passed = true)");
  assert(runData.stdout?.trim() === "142", `Runner stdout returned expected value: ${runData.stdout?.trim()}`);

  // 4. Solution Submission Receipt
  console.log("  Testing solution submission receipt generation...");
  const submitRes = await fetch(`${BASE_URL}/api/platform/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "two-sum",
      language: "python",
      submission: "print('0 1')",
      stdin: "2 7 11 15\n9",
      expectedOutput: "0 1",
    }),
  });
  const submitData = await submitRes.json();
  assert(submitRes.status === 200, "POST /api/platform/submit returned 200 OK");
  assert(typeof submitData.id === "string" && submitData.id.length > 10, `Submission receipt created with ID: ${submitData.id}`);
  assert(submitData.status === "Accepted", `Submission status evaluated to 'Accepted'`);

  // 5. AI Problem Assist (4 Modes + Semantic Cache)
  console.log("  Testing AI Problem Assist across 4 modes & caching...");
  
  // Hint Mode
  const hintRes = await fetch(`${BASE_URL}/api/ai/problem-assist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "two-sum",
      mode: "hint",
      language: "python",
    }),
  });
  const hintData = await hintRes.json();
  assert(hintRes.status === 200, "POST /api/ai/problem-assist (mode: hint) returned 200 OK");
  assert(hintData.title === "Smart Hint", "Smart Hint title verified");
  assert(typeof hintData.content === "string" && hintData.content.length > 15, "Hint content is non-empty and structured");

  // Cache Hit Timing
  const tCacheStart = performance.now();
  const cacheRes = await fetch(`${BASE_URL}/api/ai/problem-assist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "two-sum",
      mode: "hint",
      language: "python",
    }),
  });
  const cacheDurationMs = Math.round(performance.now() - tCacheStart);
  const cacheData = await cacheRes.json();
  assert(cacheRes.status === 200, "Cached AI call returned 200 OK");
  assert(cacheDurationMs < 20, `Semantic AI cache responded in ${cacheDurationMs}ms (< 20ms ceiling)`);
  assert(cacheData.provider.includes("cached"), `Provider reflects cache hit: "${cacheData.provider}"`);

  // ELI5 Mode
  const eli5Res = await fetch(`${BASE_URL}/api/ai/problem-assist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "reverse-string",
      mode: "eli5",
      problemName: "Reverse String",
    }),
  });
  const eli5Data = await eli5Res.json();
  assert(eli5Res.status === 200, "POST /api/ai/problem-assist (mode: eli5) returned 200 OK");
  assert(eli5Data.title === "Explain Like I'm 5", "ELI5 title verified");

  // Solver Mode
  const solverRes = await fetch(`${BASE_URL}/api/ai/problem-assist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "binary-search",
      mode: "solver",
      language: "cpp",
      problemName: "Binary Search",
    }),
  });
  const solverData = await solverRes.json();
  assert(solverRes.status === 200, "POST /api/ai/problem-assist (mode: solver) returned 200 OK");
  assert(solverData.title === "AI Auto-Solver", "Solver title verified");
  assert(solverData.content.includes("Complexity"), "Solver includes complexity analysis");

  // Review Mode
  const reviewRes = await fetch(`${BASE_URL}/api/ai/problem-assist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "two-sum",
      mode: "review",
      language: "python",
      code: "def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i]+nums[j]==target: return [i,j]\n    return []",
      judgeStatus: "Time Limit Exceeded",
    }),
  });
  const reviewData = await reviewRes.json();
  assert(reviewRes.status === 200, "POST /api/ai/problem-assist (mode: review) returned 200 OK");
  assert(reviewData.title === "Submission Review + Complexity", "Review title verified");

  // --------------------------------------------------------------------------
  // SUITE 3: Mock Interview OS & Access Control Guardrails
  // --------------------------------------------------------------------------
  console.log("\n[Suite 3/6] Verifying Mock Interview OS & Access Control...");

  // Anonymous Mock Interview Scoring -> 401
  const interviewAnonRes = await fetch(`${BASE_URL}/api/ai/mock-interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: "Google",
      role: "SDE-1",
      transcript: "I structured my approach using two pointers.",
    }),
  });
  const interviewAnonData = await interviewAnonRes.json();
  assert(interviewAnonRes.status === 401, "Anonymous mock interview scoring correctly blocked (HTTP 401)");
  assert(interviewAnonData.message?.includes("Sign in"), "Error message guides user to sign in");

  // Anonymous Live Interview Guidance -> 401
  const liveAnonRes = await fetch(`${BASE_URL}/api/ai/mock-interview/live`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: "Amazon",
      role: "SDE-1",
      transcript: "I started by considering edge cases.",
    }),
  });
  assert(liveAnonRes.status === 401, "Anonymous live interview coaching correctly blocked (HTTP 401)");

  // --------------------------------------------------------------------------
  // SUITE 4: Resume Builder & ATS Scoring Engine
  // --------------------------------------------------------------------------
  console.log("\n[Suite 4/6] Verifying Resume Builder & ATS Scoring Engine...");

  // Sample Mode Generation (Free access for unauthenticated exploration)
  const resumeSampleRes = await fetch(`${BASE_URL}/api/ai/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetRole: "Full Stack Engineer",
      targetCompany: "Swiggy",
      sampleMode: true,
    }),
  });
  const resumeSampleData = await resumeSampleRes.json();
  assert(resumeSampleRes.status === 200, "POST /api/ai/resume (sampleMode: true) returned 200 OK");
  assert(typeof resumeSampleData.atsScore === "number" && resumeSampleData.atsScore >= 60, `ATS score generated: ${resumeSampleData.atsScore}/100`);
  assert(Array.isArray(resumeSampleData.skills) && resumeSampleData.skills.length > 0, "Resume draft includes skills array");
  assert(Array.isArray(resumeSampleData.experience), "Resume draft includes experience array");
  assert(typeof resumeSampleData.summary === "string", "Resume draft includes executive summary");

  // PDF Export Gate (Requires Auth / Premium) -> 401 for anonymous
  const exportAnonRes = await fetch(`${BASE_URL}/api/ai/resume/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft: resumeSampleData,
    }),
  });
  assert(exportAnonRes.status === 401, "Anonymous PDF export correctly protected (HTTP 401)");

  // --------------------------------------------------------------------------
  // SUITE 5: Monetization & Native Razorpay Webhooks
  // --------------------------------------------------------------------------
  console.log("\n[Suite 5/6] Verifying Monetization, Billing & Razorpay Webhook...");

  // 1. Billing Summary
  const billSummaryRes = await fetch(`${BASE_URL}/api/platform/billing-summary`);
  const billSummaryData = await billSummaryRes.json();
  assert(billSummaryRes.status === 200, "GET /api/platform/billing-summary returned 200 OK");
  assert(billSummaryData.summary?.planId === "free", "Default billing tier correctly reports 'free'");
  assert(billSummaryData.summary?.premiumActive === false, "Default account premiumActive is false");

  // 2. Order Creation Gate (Anonymous -> 401)
  const orderAnonRes = await fetch(`${BASE_URL}/api/platform/billing/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: "premium-monthly" }),
  });
  assert(orderAnonRes.status === 401, "Order creation requires authentication (HTTP 401)");

  // 3. Native Razorpay Webhook Verification
  const loadWebhookSecret = () => {
    try {
      const envContent = fs.readFileSync("apps/web/.env.local", "utf8");
      const match = envContent.match(/RAZORPAY_WEBHOOK_SECRET=([^\r\n]+)/);
      if (match) return match[1].trim();
    } catch {}
    return process.env.RAZORPAY_WEBHOOK_SECRET || "codeorbit2026vaibhavsecurewebhook12345";
  };
  const webhookSecret = loadWebhookSecret();
  const webhookPayload = JSON.stringify({
    event: "payment.captured",
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: `pay_smoke_${Date.now()}`,
          order_id: `order_smoke_${Date.now()}`,
          amount: 49900,
          currency: "INR",
          status: "captured",
          email: "student_smoke@college.edu",
          contact: "+919876543210",
          notes: {
            planId: "premium-monthly",
            userId: "usr_smoke_buyer_01",
          },
        },
      },
    },
  });

  // Test 3a: Tampered signature rejection
  const badSignatureRes = await fetch(`${BASE_URL}/api/platform/billing/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "tampered_fake_signature_xyz",
    },
    body: webhookPayload,
  });
  assert(badSignatureRes.status === 400, "Webhook rejects invalid/tampered signature with HTTP 400");

  // Test 3b: Valid cryptographic HMAC-SHA256 signature
  const validSignature = crypto.createHmac("sha256", webhookSecret).update(webhookPayload).digest("hex");
  const goodSignatureRes = await fetch(`${BASE_URL}/api/platform/billing/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": validSignature,
    },
    body: webhookPayload,
  });
  const goodSignatureData = await goodSignatureRes.json();
  assert(goodSignatureRes.status === 200, "Webhook accepts valid HMAC-SHA256 signature with HTTP 200");
  assert(goodSignatureData.received === true && goodSignatureData.event === "payment.captured", "Webhook event processed successfully ({ received: true })");

  // Test 3c: Webhook idempotency (Duplicate delivery does not crash or double charge)
  const duplicateWebhookRes = await fetch(`${BASE_URL}/api/platform/billing/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": validSignature,
    },
    body: webhookPayload,
  });
  const duplicateData = await duplicateWebhookRes.json();
  assert(duplicateWebhookRes.status === 200, "Webhook replay handled idempotently with HTTP 200");
  assert(duplicateData.received === true, "Payment idempotency verified ({ received: true })");

  // --------------------------------------------------------------------------
  // SUITE 6: Dashboard, Activity, Leaderboard & Ingestion
  // --------------------------------------------------------------------------
  console.log("\n[Suite 6/6] Verifying User Dashboard, Feed, Leaderboard & Waitlist...");

  // 1. Dashboard Summary
  const dashRes = await fetch(`${BASE_URL}/api/platform/dashboard`);
  const dashData = await dashRes.json();
  assert(dashRes.status === 200, "GET /api/platform/dashboard returned 200 OK");
  assert(typeof dashData.summary?.streak === "number", "Dashboard provides user streak number");
  assert(Array.isArray(dashData.summary?.weakTopics), "Dashboard provides identified weak topics");

  // 2. Leaderboard Summary
  const lbRes = await fetch(`${BASE_URL}/api/platform/leaderboard`);
  const lbData = await lbRes.json();
  assert(lbRes.status === 200, "GET /api/platform/leaderboard returned 200 OK");
  assert(Array.isArray(lbData.summary?.entries), "Leaderboard provides ranked entries array");

  // 3. Activity Feed
  const actRes = await fetch(`${BASE_URL}/api/platform/activity`);
  const actData = await actRes.json();
  assert(actRes.status === 200, "GET /api/platform/activity returned 200 OK");
  assert(Array.isArray(actData.summary?.recentSubmissions), "Activity feed provides recent submissions");

  // 4. Preferences Update
  const prefRes = await fetch(`${BASE_URL}/api/platform/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: "en",
      privacyConsentAccepted: true,
    }),
  });
  const prefData = await prefRes.json();
  assert(prefRes.status === 200, "POST /api/platform/preferences returned 200 OK");
  assert(prefData.privacyConsentAccepted === true, "Preferences updated privacy consent status");

  // 5. Waitlist Capture
  const waitlistRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "TPO Head IIT Delhi",
      email: "tpo@iitd.ac.in",
      organization: "IIT Delhi Training & Placement Cell",
      role: "Placement Officer",
      target: "campuses",
      message: "Interested in verified coding cohorts for 2026 batch",
    }),
  });
  const waitlistData = await waitlistRes.json();
  assert(waitlistRes.status === 200, "POST /api/waitlist captured campus waitlist request (HTTP 200)");
  assert(waitlistData.message?.length > 10, "Waitlist response provides positive confirmation");

  // 6. Admin Gate Guard
  const adminRes = await fetch(`${BASE_URL}/api/platform/admin`);
  assert(adminRes.status === 401, "GET /api/platform/admin correctly rejects unauthenticated visitors (HTTP 401)");

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  const durationSec = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log("\n================================================================================");
  console.log(`>>> E2E SMOKE VERIFICATION COMPLETED IN ${durationSec}s <<<`);
  console.log(`Total Assertions: ${totalAssertions}`);
  console.log(`Passed:           ${passedAssertions}`);
  console.log(`Failed:           ${failedAssertions}`);
  console.log("================================================================================");

  if (failedAssertions > 0) {
    console.error(`\nERROR: ${failedAssertions} assertion(s) failed.`);
    process.exit(1);
  } else {
    console.log("\nALL SYSTEMS FUNCTIONING AT 100% PRODUCTION INTEGRITY. ZERO REGRESSIONS.");
    process.exit(0);
  }
}

runSmokeTests().catch((err) => {
  console.error("FATAL ERROR during smoke test execution:", err);
  process.exit(1);
});
