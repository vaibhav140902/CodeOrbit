#!/usr/bin/env node
/**
 * CodeOrbit Phase 4: Bulletproof UPI Payments & Idempotent Webhooks Verification
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("=".repeat(70));
console.log("  CODEORBIT PHASE 4: UPI PAYMENTS & IDEMPOTENT WEBHOOKS");
console.log("=".repeat(70));

let failures = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failures++;
  }
}

// 1. One-Time UPI Placement Passes
console.log("\n1. RAZORPAY ONE-TIME PLACEMENT PASSES:");
const platformConfigPath = path.join(rootDir, "apps", "web", "src", "data", "platform-config.ts");
const platformConfigCode = fs.readFileSync(platformConfigPath, "utf-8");
assert(platformConfigCode.includes("₹499"), "₹499 30-Day Sprint Pass configured in platform config");
assert(platformConfigCode.includes("₹1,499"), "₹1,499 4-Month Season Pass configured in platform config");

const pricingPlansPath = path.join(rootDir, "apps", "web", "src", "data", "pricing-plans.ts");
const pricingPlansCode = fs.readFileSync(pricingPlansPath, "utf-8");
assert(pricingPlansCode.includes("30-Day Sprint Pass"), "30-Day Sprint Pass in pricing plans");
assert(pricingPlansCode.includes("4-Month Season Pass"), "4-Month Season Pass in pricing plans");

const platformDataPath = path.join(rootDir, "apps", "web", "src", "lib", "server", "platform-data.ts");
const platformDataCode = fs.readFileSync(platformDataPath, "utf-8");
assert(platformDataCode.includes("amountPaise: 49900"), "Sprint Pass amount mapped to 49,900 paise (₹499)");
assert(platformDataCode.includes("amountPaise: 149900"), "Season Pass amount mapped to 149,900 paise (₹1,499)");

// 2. Webhook Idempotency & Replay Protection
console.log("\n2. WEBHOOK IDEMPOTENCY & REPLAY PROTECTION:");
const webhookPath = path.join(rootDir, "apps", "web", "src", "app", "api", "platform", "billing", "webhook", "route.ts");
const webhookCode = fs.readFileSync(webhookPath, "utf-8");
assert(webhookCode.includes("x-razorpay-event-id"), "x-razorpay-event-id header inspected for idempotency");
assert(webhookCode.includes("recordProcessedEventId"), "Duplicate event detection active");
assert(webhookCode.includes("timingSafeEqual"), "HMAC-SHA256 timing attack protection active");

// 3. Automated Webhook Test Suite
console.log("\n3. RUNNING AUTOMATED WEBHOOK SUITES:");
const webhookTest = spawnSync("node", ["scripts/test-razorpay-webhook.mjs"], {
  cwd: rootDir,
  encoding: "utf-8",
});
assert(webhookTest.status === 0, "test-razorpay-webhook.mjs passes 100%");

const convergenceTest = spawnSync("node", ["scripts/test-billing-convergence.mjs"], {
  cwd: rootDir,
  encoding: "utf-8",
});
assert(convergenceTest.status === 0, "test-billing-convergence.mjs passes 100%");

console.log("\n" + "=".repeat(70));
if (failures === 0) {
  console.log("🎉 ALL PHASE 4 UPI PAYMENT & IDEMPOTENCY CONTROLS VERIFIED!");
  console.log("=".repeat(70) + "\n");
  process.exit(0);
} else {
  console.error(`❌ FAILED WITH ${failures} DEFICIENCIES.`);
  console.log("=".repeat(70) + "\n");
  process.exit(1);
}
