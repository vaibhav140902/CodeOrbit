import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

console.log("================================================================================");
console.log("            CODEORBIT MASTER PLATFORM PRODUCTION CERTIFICATION RUNNER          ");
console.log("            Zero-Dollar Architecture, Security Hardening & B2B Wedge           ");
console.log("================================================================================\n");

const suites = [
  { file: "verify-truth-table.mjs", title: "Phase 1: Truth Table & Marketing Integrity (0 Fabricated Claims)" },
  { file: "verify-phase-2-security.mjs", title: "Phase 2: Security Penetration & India DPDP Act 2023 Compliance" },
  { file: "verify-phase-3-reliability.mjs", title: "Phase 3: 14 Problem Suites, 0ms Client Sandbox & AI Guardrails" },
  { file: "verify-phase-4-billing.mjs", title: "Phase 4: UPI Razorpay Passes (₹499/₹1499) & Replay Idempotency" },
  { file: "verify-phase-5-seo.mjs", title: "Phase 5: 1200x630 PNG OpenGraph Social Cards & Crawler Bots" },
  { file: "verify-phase-6-campus.mjs", title: "Phase 6: B2B2C Campus TPO Command Center & Proctoring Telemetry" },
  { file: "test-tenancy-dpdp.mjs", title: "Milestone 1: Multi-Tenancy, Contests & DPDP Compliance" },
  { file: "test-auth-hardening.mjs", title: "Milestone 2: Auth Hardening & SPA Decommissioning" },
  { file: "test-billing-convergence.mjs", title: "Milestone 3: Payment & Subscription State Convergence" },
  { file: "test-submission-readiness.mjs", title: "Milestone 4: Submission Pipeline & Readiness Score Engine" },
  { file: "test-rate-limiting.mjs", title: "Milestone 5: Tier-Aware Rate Limiting & Sandbox Protection" },
  { file: "test-workspace-hints.mjs", title: "Milestone 6: Monaco Workspace & Progressive Socratic Hints" },
  { file: "test-resume-roaster.mjs", title: "Milestone 7: ATS Resume Builder & Viral Resume Roaster" },
  { file: "test-mock-interview.mjs", title: "Milestone 8: AI Voice/Chat Mock Interviewer & Scorecard" },
  { file: "test-b2b-portal.mjs", title: "Milestone 9: B2B TPO Batch Analytics & Cryptographic Proof Badges" },
  { file: "test-phase2-growth.mjs", title: "Growth & Telemetry: Viral Loops, Health & NIRF Export" },
];

let totalPassed = 0;
let totalFailed = 0;
const results = [];

const startTime = Date.now();

for (let i = 0; i < suites.length; i++) {
  const suite = suites[i];
  console.log(`[${i + 1}/${suites.length}] Running ${suite.title}...`);
  const scriptPath = path.join(process.cwd(), "scripts", suite.file);

  const res = spawnSync("node", ["--experimental-strip-types", scriptPath], {
    encoding: "utf-8",
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, NODE_ENV: "production" },
  });

  if (res.status === 0) {
    totalPassed++;
    results.push({ name: suite.title, status: "PASS" });
    console.log(`\n  >> Result: PASS\n`);
  } else {
    totalFailed++;
    results.push({ name: suite.title, status: "FAIL", code: res.status });
    console.error(`\n  >> Result: FAIL with exit code ${res.status}\n`);
  }
}

const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

console.log("================================================================================");
console.log("                      MASTER CERTIFICATION SUMMARY RESULTS                     ");
console.log("================================================================================");
results.forEach((r, idx) => {
  const icon = r.status === "PASS" ? "✓" : "✗";
  console.log(`  [${icon}] ${idx + 1}. ${r.name}: ${r.status}`);
});

console.log("\n--------------------------------------------------------------------------------");
console.log(`Total Suites: ${suites.length} | Passed: ${totalPassed} | Failed: ${totalFailed} | Time: ${durationSec}s`);
console.log("--------------------------------------------------------------------------------");

if (totalFailed > 0) {
  console.error("CERTIFICATION FAILED: One or more suites did not pass.");
  process.exit(1);
} else {
  console.log(">>> ALL 10 MILESTONES & PHASES CERTIFIED FOR PRODUCTION DEPLOYMENT (100% PASS RATE) <<<");
  process.exit(0);
}
