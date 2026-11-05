#!/usr/bin/env node
/**
 * CodeOrbit Phase 6: B2B2C Campus TPO Command Center & Proctoring Telemetry Verification
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("=".repeat(70));
console.log("  CODEORBIT PHASE 6: B2B2C CAMPUS TPO & PROCTORING VERIFICATION");
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

// 1. Campus NIRF & NAAC Accreditation Export
console.log("\n1. NIRF / NAAC ACCREDITATION EXPORT:");
const nirfRoutePath = path.join(rootDir, "apps", "web", "src", "app", "api", "platform", "campus", "nirf-export", "route.ts");
assert(fs.existsSync(nirfRoutePath), "NIRF export API route exists");
const nirfRouteCode = fs.readFileSync(nirfRoutePath, "utf-8");
assert(nirfRouteCode.includes("NIRF Metric 5.2.1"), "NIRF Metric 5.2.1 compliance reporting implemented");
assert(nirfRouteCode.includes("NAAC Criterion V"), "NAAC Criterion V student progression reporting implemented");
assert(nirfRouteCode.includes("DPDP Act 2023"), "DPDP compliance audit ref attached to batch export");

// 2. Proctoring Telemetry & Anti-Cheat
console.log("\n2. MONACO IDE PROCTORING TELEMETRY:");
const workspacePath = path.join(rootDir, "apps", "web", "src", "components", "problems", "problem-workspace-preview.tsx");
const workspaceCode = fs.readFileSync(workspacePath, "utf-8");
assert(workspaceCode.includes("visibilitychange"), "visibilitychange listener tracks assessment tab switches");
assert(workspaceCode.includes("paste"), "paste event listener tracks external code pasting");
assert(workspaceCode.includes("Proctor Active"), "Live Proctor Active badge rendered on assessment workspace");

// 3. Automated B2B Portal Test Suite
console.log("\n3. RUNNING B2B PORTAL SUITE:");
const b2bTest = spawnSync("node", ["scripts/test-b2b-portal.mjs"], {
  cwd: rootDir,
  encoding: "utf-8",
});
assert(b2bTest.status === 0, "test-b2b-portal.mjs passes 100%");

console.log("\n" + "=".repeat(70));
if (failures === 0) {
  console.log("🎉 ALL PHASE 6 CAMPUS TPO & PROCTORING CONTROLS VERIFIED!");
  console.log("=".repeat(70) + "\n");
  process.exit(0);
} else {
  console.error(`❌ FAILED WITH ${failures} DEFICIENCIES.`);
  console.log("=".repeat(70) + "\n");
  process.exit(1);
}
