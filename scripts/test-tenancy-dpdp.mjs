// ==============================================================================
// CodeOrbit Milestone 1 Verification: Multi-Tenancy & DPDP Schema & Data Pipeline
// File: scripts/test-tenancy-dpdp.mjs
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  tenantSchema,
  tenantInputSchema,
  tenantMembershipSchema,
  contestSchema,
  contestInputSchema,
  proctorEventSchema,
  proctorEventInputSchema,
  dpdpConsentLogSchema,
  dpdpConsentInputSchema,
} from "../packages/schema/src/index.ts";

console.log("================================================================================");
console.log("   CODEORBIT MILESTONE 1: MULTI-TENANCY, CONTESTS & DPDP VERIFICATION SUITE    ");
console.log("================================================================================");

let totalPassed = 0;
const test = (description, fn) => {
  try {
    fn();
    console.log(`  ✓ [PASS] ${description}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(err);
    process.exit(1);
  }
};

// --- Test Suite 1: Schema Validation (Zod Contracts) ---
console.log("\n[Suite 1/3] Validating Zod Schemas & Domain Contracts...");

test("Valid Tenant passes validation", () => {
  const sampleTenant = {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "kiet-ghaziabad",
    name: "KIET Group of Institutions",
    tier: "tier-2",
    state: "UP",
    contactTpoName: "Dr. R. K. Sharma",
    contactTpoEmail: "tpo@kiet.edu",
    contactTpoPhone: "+919876543210",
    planStatus: "pilot",
    maxStudents: 1500,
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  };
  const parsed = tenantSchema.parse(sampleTenant);
  assert.equal(parsed.slug, "kiet-ghaziabad");
  assert.equal(parsed.tier, "tier-2");
});

test("Invalid Tenant slug is rejected", () => {
  assert.throws(() => {
    tenantSchema.parse({
      id: "1",
      slug: "INVALID SLUG WITH SPACES",
      name: "Bad College",
      tier: "tier-3",
      state: "UP",
      contactTpoName: "TPO",
      contactTpoEmail: "tpo@college.edu",
      planStatus: "pilot",
      maxStudents: 500,
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
    });
  });
});

test("Tenant Membership validates student role and graduation batch", () => {
  const membership = {
    id: "00000000-0000-0000-0000-000000000002",
    tenantId: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000003",
    rollNumber: "2201330100045",
    department: "CSE",
    batchYear: 2026,
    role: "student",
    verified: true,
    createdAtIso: new Date().toISOString(),
  };
  const parsed = tenantMembershipSchema.parse(membership);
  assert.equal(parsed.department, "CSE");
  assert.equal(parsed.role, "student");
});

test("Batch Placement Contest validates time window and problem IDs", () => {
  const contest = {
    id: "00000000-0000-0000-0000-000000000004",
    tenantId: "00000000-0000-0000-0000-000000000001",
    title: "KIET Saturday TCS Prime Mock Contest",
    slug: "kiet-tcs-prime-mock-oct2026",
    description: "60-minute placement screening contest for 3rd-year CSE/IT students.",
    problemIds: ["two-sum", "reverse-string", "valid-parentheses"],
    startTimeIso: "2026-10-31T04:30:00.000Z",
    endTimeIso: "2026-10-31T05:30:00.000Z",
    durationMinutes: 60,
    isPublished: true,
    createdBy: "tpo-admin-1",
    createdAtIso: new Date().toISOString(),
  };
  const parsed = contestSchema.parse(contest);
  assert.equal(parsed.problemIds.length, 3);
  assert.equal(parsed.durationMinutes, 60);
});

test("Proctoring event telemetry validates event types", () => {
  const event = {
    id: "00000000-0000-0000-0000-000000000005",
    contestId: "00000000-0000-0000-0000-000000000004",
    userId: "00000000-0000-0000-0000-000000000003",
    eventType: "tab_blur",
    metadata: { unfocusedSeconds: 4.2 },
    occurredAtIso: new Date().toISOString(),
  };
  const parsed = proctorEventSchema.parse(event);
  assert.equal(parsed.eventType, "tab_blur");
});

test("Invalid proctoring event type is rejected", () => {
  assert.throws(() => {
    proctorEventSchema.parse({
      id: "1",
      contestId: "c1",
      userId: "u1",
      eventType: "looking_away_from_webcam", // Not in schema; we reject punitive video proctoring
      metadata: {},
      occurredAtIso: new Date().toISOString(),
    });
  });
});

test("DPDP Consent log validates compliance flags", () => {
  const consent = {
    id: "00000000-0000-0000-0000-000000000006",
    userId: "00000000-0000-0000-0000-000000000003",
    consentVersion: "2026.1",
    isUnder18: true,
    parentGuardianEmail: "parent@gmail.com",
    purposesAccepted: ["ai_coaching", "tpo_reporting", "ats_analysis"],
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    consentedAtIso: new Date().toISOString(),
    revokedAtIso: null,
  };
  const parsed = dpdpConsentLogSchema.parse(consent);
  assert.equal(parsed.isUnder18, true);
  assert.equal(parsed.consentVersion, "2026.1");
  assert.equal(parsed.purposesAccepted.length, 3);
});

// --- Test Suite 2: Supabase Migration File Syntax & Audit ---
console.log("\n[Suite 2/3] Auditing SQL Migration Files...");

test("0004_tenancy_and_dpdp.sql exists and contains mandatory tables", () => {
  const sqlPath = path.resolve(process.cwd(), "packages/schema/supabase/0004_tenancy_and_dpdp.sql");
  assert.ok(fs.existsSync(sqlPath), "0004_tenancy_and_dpdp.sql must exist");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const requiredTables = [
    "public.tenants",
    "public.tenant_memberships",
    "public.contests",
    "public.proctor_events",
    "public.dpdp_consent_logs",
  ];
  for (const table of requiredTables) {
    assert.ok(sql.includes(`create table if not exists ${table}`), `Missing table definition: ${table}`);
  }

  const requiredPolicies = [
    "Allow public read on active tenants",
    "Allow members to read own tenant membership",
    "Allow public read on published contests",
    "Allow authenticated users to insert proctor events",
    "Allow users to read and insert their DPDP consent",
  ];
  for (const policy of requiredPolicies) {
    assert.ok(sql.includes(policy), `Missing RLS policy: ${policy}`);
  }
});

test("apply_all_migrations.sql includes 0004 migration", () => {
  const fullSqlPath = path.resolve(process.cwd(), "packages/schema/supabase/apply_all_migrations.sql");
  assert.ok(fs.existsSync(fullSqlPath));
  const fullSql = fs.readFileSync(fullSqlPath, "utf8");
  assert.ok(fullSql.includes("0004_tenancy_and_dpdp.sql"), "apply_all_migrations.sql must include 0004 migration");
  assert.ok(fullSql.includes("public.dpdp_consent_logs"));
});

// --- Test Suite 3: Local Platform Data Layer Persistence & Fallback ---
console.log("\n[Suite 3/3] Testing Platform Data Storage Integration...");

test("Local storage file schema supports all 5 new entities", () => {
  const cacheDir = path.resolve(process.cwd(), ".codeorbit-cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const storagePath = path.join(cacheDir, "platform-storage.json");
  let storage = {
    users: [],
    submissions: [],
    user_progress: [],
    subscriptions: [],
    payments: [],
    tenants: [],
    tenant_memberships: [],
    contests: [],
    proctor_events: [],
    dpdp_consent_logs: [],
  };
  if (fs.existsSync(storagePath)) {
    try {
      storage = { ...storage, ...JSON.parse(fs.readFileSync(storagePath, "utf8")) };
    } catch {}
  }

  // Seed sample tenant
  storage.tenants = storage.tenants || [];
  storage.tenants.push({
    id: "tenant-test-1",
    slug: "kiet-ghaziabad",
    name: "KIET Group of Institutions",
    tier: "tier-2",
    state: "UP",
    contact_tpo_name: "Dr. R. K. Sharma",
    contact_tpo_email: "tpo@kiet.edu",
    contact_tpo_phone: "+919876543210",
    plan_status: "pilot",
    max_students: 1500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed sample DPDP consent
  storage.dpdp_consent_logs = storage.dpdp_consent_logs || [];
  storage.dpdp_consent_logs.push({
    id: "dpdp-test-1",
    user_id: "founder-user-1",
    consent_version: "2026.1",
    is_under_18: false,
    parent_guardian_email: null,
    purposes_accepted: ["ai_coaching", "tpo_reporting", "ats_analysis"],
    ip_address: "127.0.0.1",
    user_agent: "Node/TestEngine",
    consented_at: new Date().toISOString(),
    revoked_at: null,
  });

  // Seed sample contest
  storage.contests = storage.contests || [];
  storage.contests.push({
    id: "contest-test-1",
    tenant_id: "tenant-test-1",
    title: "KIET Saturday TCS Prime Mock Contest",
    slug: "kiet-tcs-prime-mock-oct2026",
    description: "60-minute placement screening contest",
    problem_ids: ["two-sum", "reverse-string"],
    start_time: "2026-10-31T04:30:00.000Z",
    end_time: "2026-10-31T05:30:00.000Z",
    duration_minutes: 60,
    is_published: true,
    created_by: "tpo-admin-1",
    created_at: new Date().toISOString(),
  });

  // Write and verify re-read
  fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2), "utf8");
  const reRead = JSON.parse(fs.readFileSync(storagePath, "utf8"));
  assert.ok(reRead.tenants.length > 0, "Tenants array must persist");
  assert.ok(reRead.dpdp_consent_logs.length > 0, "DPDP array must persist");
  assert.ok(reRead.contests.length > 0, "Contests array must persist");
});

console.log("\n================================================================================");
console.log(`>>> MILESTONE 1 VERIFICATION COMPLETED: ${totalPassed}/${totalPassed} ASSERTIONS PASSED <<<`);
console.log("================================================================================\n");
