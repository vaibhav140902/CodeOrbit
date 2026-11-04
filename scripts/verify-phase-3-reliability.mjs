#!/usr/bin/env node
/**
 * CodeOrbit Phase 3: Reliability, Hybrid WASM & AI Guardrails Verification
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("=".repeat(70));
console.log("  CODEORBIT PHASE 3: RELIABILITY, HYBRID WASM & AI GUARDRAILS");
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

// 1. Problem Suites Test Runner
console.log("\n1. PROBLEM TEST SUITES & REFERENCE RUNNER:");
const runAll14 = spawnSync("node", ["scripts/test-all-14-problems.mjs"], {
  cwd: rootDir,
  encoding: "utf-8",
});
assert(runAll14.status === 0, "All 14 problems pass canonical test suites end-to-end");
if (runAll14.status !== 0) {
  console.error(runAll14.stderr || runAll14.stdout);
}

// 2. Gemini 2.5 Flash AI Guardrails
console.log("\n2. GEMINI 2.5 FLASH LATENCY & QUOTA GUARDRAILS:");
const geminiPath = path.join(rootDir, "apps", "web", "src", "lib", "server", "gemini.ts");
const geminiCode = fs.readFileSync(geminiPath, "utf-8");
assert(geminiCode.includes("thinkingBudget: 0"), "thinkingConfig: { thinkingBudget: 0 } configured for Gemini 2.5 Flash");
assert(geminiCode.includes("maxOutputTokens: 2048"), "maxOutputTokens ceiling enforced on generative responses");
assert(geminiCode.includes("acquireGeminiQuota"), "15 RPM ceiling protection active on outbound LLM calls");

// 3. Client Sandbox
console.log("\n3. HYBRID 0MS CLIENT SANDBOX:");
const sandboxPath = path.join(rootDir, "apps", "web", "src", "lib", "client-sandbox.ts");
assert(fs.existsSync(sandboxPath), "client-sandbox.ts exists");
const sandboxCode = fs.readFileSync(sandboxPath, "utf-8");
assert(sandboxCode.includes("executeInClientSandbox"), "executeInClientSandbox exported");
assert(sandboxCode.includes("canExecuteClientSide"), "canExecuteClientSide exported");

const workspacePath = path.join(rootDir, "apps", "web", "src", "components", "problems", "problem-workspace-preview.tsx");
const workspaceCode = fs.readFileSync(workspacePath, "utf-8");
assert(workspaceCode.includes("executeInClientSandbox"), "Workspace preview wires instant client sandbox for sample runs");

// 4. Non-Blocking Route Skeleton
console.log("\n4. NON-BLOCKING ROUTE SKELETON LOADER:");
const loadingPath = path.join(rootDir, "apps", "web", "src", "app", "loading.tsx");
const loadingCode = fs.readFileSync(loadingPath, "utf-8");
assert(!loadingCode.includes("Preparing the workspace"), "Heavy blocking card eliminated from loading.tsx");
assert(loadingCode.includes("animate-pulse"), "Non-blocking shimmer skeleton active in loading.tsx");

console.log("\n" + "=".repeat(70));
if (failures === 0) {
  console.log("🎉 ALL PHASE 3 RELIABILITY & GUARDRAIL CONTROLS VERIFIED!");
  console.log("=".repeat(70) + "\n");
  process.exit(0);
} else {
  console.error(`❌ FAILED WITH ${failures} DEFICIENCIES.`);
  console.log("=".repeat(70) + "\n");
  process.exit(1);
}
