#!/usr/bin/env node
/**
 * CodeOrbit Phase 5: SEO, Social Cards & OpenGraph Verification
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("=".repeat(70));
console.log("  CODEORBIT PHASE 5: SEO, SOCIAL CARDS & OPENGRAPH VERIFICATION");
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

// 1. OpenGraph Image Config
console.log("\n1. OPENGRAPH PNG CONFIGURATION:");
const siteConfigPath = path.join(rootDir, "apps", "web", "src", "lib", "site-config.ts");
const siteConfigCode = fs.readFileSync(siteConfigPath, "utf-8");
assert(!siteConfigCode.includes('ogImage: "/brand-mark.svg"'), "SVG eliminated as default OpenGraph image");
assert(siteConfigCode.includes('ogImage: "/api/og"'), "Default OpenGraph image set to dynamic PNG generator /api/og");
assert(siteConfigCode.includes("width: 1200"), "OpenGraph width set to 1200px");
assert(siteConfigCode.includes("height: 630"), "OpenGraph height set to 630px");

// 2. Dynamic Social Image Generators
console.log("\n2. DYNAMIC SOCIAL CARD GENERATORS:");
const ogRoutePath = path.join(rootDir, "apps", "web", "src", "app", "api", "og", "route.tsx");
assert(fs.existsSync(ogRoutePath), "Primary /api/og ImageResponse route exists");
const ogRouteCode = fs.readFileSync(ogRoutePath, "utf-8");
assert(ogRouteCode.includes("ImageResponse"), "Primary OG route uses next/og ImageResponse");

const roasterOgPath = path.join(rootDir, "apps", "web", "src", "app", "api", "og", "roaster", "route.tsx");
assert(fs.existsSync(roasterOgPath), "Roaster scorecard OG route exists");
const roasterOgCode = fs.readFileSync(roasterOgPath, "utf-8");
assert(roasterOgCode.includes("ImageResponse"), "Roaster OG route uses next/og ImageResponse");

// 3. Robots & Sitemap
console.log("\n3. CRAWLER BOT & SITEMAP VERIFICATION:");
const robotsPath = path.join(rootDir, "apps", "web", "src", "app", "robots.ts");
const robotsCode = fs.readFileSync(robotsPath, "utf-8");
assert(robotsCode.includes("/api/og"), "Robots allows /api/og for crawler bots");
assert(robotsCode.includes("WhatsApp") || robotsCode.includes("LinkedInBot"), "Robots whitelists social link crawlers");

const sitemapPath = path.join(rootDir, "apps", "web", "src", "app", "sitemap.ts");
const sitemapCode = fs.readFileSync(sitemapPath, "utf-8");
assert(sitemapCode.includes("/resume-roaster"), "Sitemap includes /resume-roaster");
assert(sitemapCode.includes("/for-campuses"), "Sitemap includes /for-campuses");
assert(sitemapCode.includes("/for-recruiters"), "Sitemap includes /for-recruiters");

console.log("\n" + "=".repeat(70));
if (failures === 0) {
  console.log("🎉 ALL PHASE 5 SEO & SOCIAL PREVIEW CONTROLS VERIFIED!");
  console.log("=".repeat(70) + "\n");
  process.exit(0);
} else {
  console.error(`❌ FAILED WITH ${failures} DEFICIENCIES.`);
  console.log("=".repeat(70) + "\n");
  process.exit(1);
}
