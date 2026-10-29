import fs from "fs";
import path from "path";

console.log("================================================================================");
console.log("   CODEORBIT PRODUCTION ENVIRONMENT & CONFIGURATION AUDITOR                     ");
console.log("================================================================================\n");

const targetEnvFile = process.argv[2] || "apps/web/.env.local";
const resolvedPath = path.resolve(targetEnvFile);

if (!fs.existsSync(resolvedPath)) {
  console.error(`ERROR: Environment file not found at: ${resolvedPath}`);
  console.log("Provide path to env file, e.g.: node scripts/verify-production-env.mjs apps/web/.env.production.local\n");
  process.exit(1);
}

console.log(`Auditing target file: ${resolvedPath}\n`);

const rawContent = fs.readFileSync(resolvedPath, "utf-8");
const parsedEnv = {};

for (const line of rawContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    parsedEnv[key] = val;
  }
}

const REQUIRED_VARS = [
  { key: "NEXT_PUBLIC_FIREBASE_API_KEY", category: "Firebase Auth", critical: true },
  { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", category: "Firebase Auth", critical: true },
  { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", category: "Firebase Auth", critical: true },
  { key: "GEMINI_API_KEY", category: "AI Engine", critical: true },
  { key: "RAZORPAY_KEY_ID", category: "Billing Engine", critical: true },
  { key: "RAZORPAY_KEY_SECRET", category: "Billing Engine", critical: true },
  { key: "RAZORPAY_WEBHOOK_SECRET", category: "Billing Engine", critical: true },
  { key: "SUPABASE_URL", category: "Database Persistence", critical: false },
  { key: "SUPABASE_SERVICE_ROLE_KEY", category: "Database Persistence", critical: false },
  { key: "JUDGE0_URL", category: "Code Execution", critical: false },
];

let criticalPassed = 0;
let criticalFailed = 0;
let warnings = 0;

for (const item of REQUIRED_VARS) {
  const value = parsedEnv[item.key];
  const isPresent = Boolean(value && value.trim());
  const isPlaceholder =
    isPresent &&
    (value.toLowerCase().includes("your") ||
      value.toLowerCase().includes("placeholder") ||
      value.toLowerCase().includes("todo") ||
      value.toLowerCase().includes("change_me") ||
      value === "1234567890");

  if (!isPresent) {
    if (item.critical) {
      criticalFailed++;
      console.error(`  ✗ [FAIL] Missing critical variable: ${item.key} (${item.category})`);
    } else {
      warnings++;
      console.warn(`  ! [WARN] Optional variable unset: ${item.key} (${item.category} falls back to local storage)`);
    }
  } else if (isPlaceholder) {
    if (item.critical) {
      criticalFailed++;
      console.error(`  ✗ [FAIL] Contains placeholder value: ${item.key}="${value}"`);
    } else {
      warnings++;
      console.warn(`  ! [WARN] Contains placeholder: ${item.key}`);
    }
  } else {
    criticalPassed++;
    const masked = value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : "***";
    console.log(`  ✓ [PASS] Valid: ${item.key.padEnd(38)} (${item.category}) [${masked}]`);
  }
}

// Special format checks
console.log("\nValidating security formatting...");

if (parsedEnv.RAZORPAY_KEY_ID) {
  const isTest = parsedEnv.RAZORPAY_KEY_ID.startsWith("rzp_test_");
  const isLive = parsedEnv.RAZORPAY_KEY_ID.startsWith("rzp_live_");
  if (isLive) {
    console.log("  ✓ [LIVE] Razorpay is configured with LIVE production keys (rzp_live_*)");
  } else if (isTest) {
    console.log("  ℹ [TEST] Razorpay is configured with TEST sandbox keys (rzp_test_*)");
  } else {
    console.warn("  ! [WARN] RAZORPAY_KEY_ID should start with rzp_live_ or rzp_test_");
  }
}

if (parsedEnv.RAZORPAY_WEBHOOK_SECRET) {
  if (parsedEnv.RAZORPAY_WEBHOOK_SECRET.length < 16) {
    console.warn("  ! [WARN] RAZORPAY_WEBHOOK_SECRET is shorter than 16 characters. Use high entropy string.");
  } else {
    console.log("  ✓ [PASS] RAZORPAY_WEBHOOK_SECRET meets entropy security standards (>16 chars)");
  }
}

if (parsedEnv.BYPASS_PAID_ACCESS === "true") {
  console.warn("  ! [SECURITY WARNING] BYPASS_PAID_ACCESS=true is set! Disable before production traffic!");
}

console.log("\n================================================================================");
console.log(`Audited Variables: ${REQUIRED_VARS.length}`);
console.log(`Critical Passed:   ${criticalPassed}`);
console.log(`Critical Failed:   ${criticalFailed}`);
console.log(`Warnings/Notices:  ${warnings}`);
console.log("================================================================================");

if (criticalFailed > 0) {
  console.error("\nRESULT: FAILED. Please populate missing critical variables before deploying.");
  process.exit(1);
} else {
  console.log("\nRESULT: READY. Environment is verified and ready for deployment.");
  process.exit(0);
}
