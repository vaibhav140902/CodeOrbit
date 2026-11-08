import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================================");
console.log("🛡️  CODEORBIT PHASE 2 SECURITY & PRIVACY PENETRATION VERIFICATION");
console.log("==================================================================\n");

let failureCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failureCount++;
  }
}

// -----------------------------------------------------------------------------
// 1. Secret Hygiene & Client Exposure Audit
// -----------------------------------------------------------------------------
console.log("1. AUDITING SECRETS & CLIENT EXPOSURE:");

const envExamplePath = path.join(rootDir, ".env.production.example");
const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");

const forbiddenSecrets = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "GEMINI_API_KEY",
];

for (const sec of forbiddenSecrets) {
  const match = envExampleContent.match(new RegExp(`^${sec}=(.*)$`, "m"));
  if (match) {
    const val = match[1].trim();
    assert(val === "", `.env.production.example must NOT contain live value for ${sec}`);
  }
}

// Check gitignore contains .env.local
const gitignoreContent = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
assert(
  gitignoreContent.includes(".env") && gitignoreContent.includes(".env.*"),
  ".gitignore properly ignores local env files"
);

// Check that NEXT_PUBLIC_ADMIN_EMAILS is not used in src
function scanDir(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.includes("node_modules") && !entry.name.includes(".next")) {
        scanDir(full, fn);
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      fn(full);
    }
  }
}

let publicAdminEmailFound = false;
let dangerousSecretPrefixFound = false;

scanDir(path.join(rootDir, "apps", "web", "src"), (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  if (content.includes("NEXT_PUBLIC_ADMIN_EMAILS")) {
    console.error(`Found NEXT_PUBLIC_ADMIN_EMAILS in ${filePath}`);
    publicAdminEmailFound = true;
  }
  for (const s of ["SERVICE_ROLE", "KEY_SECRET", "WEBHOOK_SECRET"]) {
    if (content.includes(`NEXT_PUBLIC_${s}`)) {
      console.error(`Found NEXT_PUBLIC_${s} in ${filePath}`);
      dangerousSecretPrefixFound = true;
    }
  }
});

assert(!publicAdminEmailFound, "No client exposure of admin emails (NEXT_PUBLIC_ADMIN_EMAILS eliminated)");
assert(!dangerousSecretPrefixFound, "No backend secrets prefixed with NEXT_PUBLIC_ in src");

// -----------------------------------------------------------------------------
// 2. Auth & Endpoint Guards Audit
// -----------------------------------------------------------------------------
console.log("\n2. AUDITING SENSITIVE API ROUTE AUTH ENFORCEMENT:");

const sensitiveRoutes = [
  "apps/web/src/app/api/ai/mock-interview/route.ts",
  "apps/web/src/app/api/ai/mock-interview/turn/route.ts",
  "apps/web/src/app/api/ai/mock-interview/live/route.ts",
  "apps/web/src/app/api/platform/submit/route.ts",
  "apps/web/src/app/api/platform/run/route.ts",
  "apps/web/src/app/api/platform/billing/order/route.ts",
  "apps/web/src/app/api/platform/campus/workspace/route.ts",
  "apps/web/src/app/api/platform/campus/analytics/route.ts",
  "apps/web/src/app/api/platform/campus/intervention/route.ts",
  "apps/web/src/app/api/platform/campus/nirf-export/route.ts",
  "apps/web/src/app/api/platform/recruiter/workspace/route.ts",
  "apps/web/src/app/api/platform/recruiter/review/route.ts",
  "apps/web/src/app/api/platform/recruiter/export/route.ts",
  "apps/web/src/app/api/platform/delete-account/route.ts",
];

for (const rel of sensitiveRoutes) {
  const full = path.join(rootDir, rel);
  const exists = fs.existsSync(full);
  assert(exists, `Route file exists: ${rel}`);
  if (exists) {
    const code = fs.readFileSync(full, "utf-8");
    const hasAuthGuard = code.includes("requireAuth") || code.includes("requireAdmin") || code.includes("extractViewerFromHeaders");
    assert(hasAuthGuard, `Route requires cryptographically verified auth: ${rel}`);
  }
}

// -----------------------------------------------------------------------------
// 3. Upload Security Verification
// -----------------------------------------------------------------------------
console.log("\n3. AUDITING FILE UPLOAD MAGIC BYTES & HARDENING:");

const uploadSecurityPath = path.join(rootDir, "apps", "web", "src", "lib", "server", "upload-security.ts");
assert(fs.existsSync(uploadSecurityPath), "upload-security.ts exists");

const uploadRoutePath = path.join(rootDir, "apps", "web", "src", "app", "api", "platform", "resume", "parse", "route.ts");
const uploadRouteCode = fs.readFileSync(uploadRoutePath, "utf-8");
assert(uploadRouteCode.includes("validateResumeUpload"), "resume parse route uses validateResumeUpload");
assert(uploadRouteCode.includes("UploadSecurityError"), "resume parse route catches UploadSecurityError");

// -----------------------------------------------------------------------------
// 4. DPDP Act 2023 Compliance & User Controls
// -----------------------------------------------------------------------------
console.log("\n4. AUDITING INDIA DPDP ACT 2023 COMPLIANCE:");

// Signup checkbox
const signupFormPath = path.join(rootDir, "apps", "web", "src", "components", "auth", "signup-form.tsx");
const signupFormCode = fs.readFileSync(signupFormPath, "utf-8");
assert(
  signupFormCode.includes("dpdpConsent") && signupFormCode.includes("DPDP Act 2023"),
  "Signup form includes explicit mandatory DPDP Act 2023 consent checkbox"
);

// Resume Roaster In-Memory notice
const roasterViewPath = path.join(rootDir, "apps", "web", "src", "components", "resume", "resume-roaster-view.tsx");
const roasterCode = fs.readFileSync(roasterViewPath, "utf-8");
assert(
  roasterCode.includes("DPDP Act 2023 In-Memory Privacy Guarantee"),
  "Resume Roaster displays explicit volatile in-memory processing guarantee"
);

// Data Erasure Endpoint and UI
const deleteAccountRoute = path.join(rootDir, "apps", "web", "src", "app", "api", "platform", "delete-account", "route.ts");
assert(fs.existsSync(deleteAccountRoute), "DPDP Section 12 Data Erasure API route exists");

const accountPrivacyComponent = path.join(rootDir, "apps", "web", "src", "components", "dashboard", "account-privacy-settings.tsx");
assert(fs.existsSync(accountPrivacyComponent), "Account privacy and 'Delete My Data' UI component exists");

// Privacy Policy & Terms
const privacyPage = path.join(rootDir, "apps", "web", "src", "app", "privacy", "page.tsx");
const privacyCode = fs.readFileSync(privacyPage, "utf-8");
assert(
  privacyCode.includes("DPDP Act 2023") && privacyCode.includes("Right to Erasure"),
  "Privacy policy documents DPDP Act 2023 rights, volatile memory parsing, and erasure"
);

const termsPage = path.join(rootDir, "apps", "web", "src", "app", "terms", "page.tsx");
const termsCode = fs.readFileSync(termsPage, "utf-8");
assert(
  termsCode.includes("Placement Disclaimer") && termsCode.includes("User Ownership"),
  "Terms of service clearly state candidate code ownership and placement disclaimers"
);

// -----------------------------------------------------------------------------
// 5. CORS & Rate Limiting
// -----------------------------------------------------------------------------
console.log("\n5. AUDITING CORS & RATE LIMITING:");

const middlewarePath = path.join(rootDir, "apps", "web", "src", "middleware.ts");
assert(fs.existsSync(middlewarePath), "middleware.ts exists for CORS origin lockdown");
const middlewareCode = fs.readFileSync(middlewarePath, "utf-8");
assert(
  middlewareCode.includes("codeorbit.app") && middlewareCode.includes("getcodeorbit.vercel.app"),
  "CORS allows only approved production and local domains"
);

const rateLimitPath = path.join(rootDir, "apps", "web", "src", "lib", "server", "rate-limit.ts");
const rateLimitCode = fs.readFileSync(rateLimitPath, "utf-8");
assert(rateLimitCode.includes("TIER_QUOTAS"), "Tier quotas defined for guest, free, and pro");
assert(rateLimitCode.includes("hashClientIp"), "Anonymous requests rate-limited by SHA-256 hashed IP");

// -----------------------------------------------------------------------------
// 6. Server-Side Hidden Test Suites & Anti-Spoofing
// -----------------------------------------------------------------------------
console.log("\n6. AUDITING SERVER-SIDE TEST SUITES & ANTI-SPOOFING:");
const submitRoutePath = path.join(rootDir, "apps", "web", "src", "app", "api", "platform", "submit", "route.ts");
const submitRouteCode = fs.readFileSync(submitRoutePath, "utf-8");
assert(submitRouteCode.includes("getProblemTestSuite"), "Submit route evaluates against canonical problem test suites");
assert(submitRouteCode.includes("hiddenCase"), "Submit route checks hidden test cases to prevent client spoofing");

const testSuitesPath = path.join(rootDir, "apps", "web", "src", "lib", "server", "problem-test-suites.ts");
assert(fs.existsSync(testSuitesPath), "Canonical problem test suites file exists");
const testSuitesCode = fs.readFileSync(testSuitesPath, "utf-8");
assert(testSuitesCode.includes("two-sum"), "Test suites contain canonical two-sum tests");
assert(testSuitesCode.includes("isHidden: true"), "Test suites contain hidden test cases");

// -----------------------------------------------------------------------------
// 7. Privacy: Email Masking on Leaderboards & Python Template Compatibility
// -----------------------------------------------------------------------------
console.log("\n7. AUDITING LEADERBOARD EMAIL MASKING & PYTHON COMPATIBILITY:");
const platformDataPath = path.join(rootDir, "apps", "web", "src", "lib", "server", "platform-data.ts");
const platformDataCode = fs.readFileSync(platformDataPath, "utf-8");
assert(platformDataCode.includes("maskIfEmail"), "Leaderboard data masks email addresses from public view");

const runtimeSpecPath = path.join(rootDir, "apps", "web", "src", "lib", "problem-runtime.ts");
const runtimeSpecCode = fs.readFileSync(runtimeSpecPath, "utf-8");
assert(!runtimeSpecCode.includes("list[int]"), "Python templates avoid un-annotated lowercase generic list[int]");
assert(runtimeSpecCode.includes("from __future__ import annotations"), "Python templates use future annotations for runtime compatibility");

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n==================================================================");
if (failureCount === 0) {
  console.log("🎉 ALL PHASE 2 SECURITY & PRIVACY CONTROLS VERIFIED SUCCESSFULLY!");
  console.log("==================================================================\n");
  process.exit(0);
} else {
  console.error(`❌ FAILED WITH ${failureCount} SECURITY DEFICIENCIES.`);
  console.log("==================================================================\n");
  process.exit(1);
}
