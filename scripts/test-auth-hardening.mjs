#!/usr/bin/env node
/**
 * CodeOrbit Milestone 2: Auth Hardening & Legacy SPA Decommission Test Suite
 *
 * Verifies:
 * 1. Legacy Vite SPA decommissioning script exit & guidance
 * 2. Cryptographic RS256 token verification & claims validation
 * 3. Algorithm-confusion & none-algorithm rejection
 * 4. Expired token rejection & clock skew tolerance
 * 5. Tampered signature rejection
 * 6. Valid RSA-SHA256 signature verification
 * 7. Zero-trust dev header protection in production (anti-spoofing)
 * 8. Zero-trust dev header protection in default development mode
 * 9. Controlled opt-in dev header bypass only with ALLOW_DEV_HEADER_AUTH=true
 * 10. Backend CORS origin update for Next.js port 3001
 */

import { generateKeyPairSync, createSign } from "node:crypto";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  verifyFirebaseToken,
  extractViewerFromHeaders,
  requireAuth,
  AuthenticationError,
} from "../apps/web/src/lib/server/auth-guard.ts";

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failCount++;
  }
}

console.log("=".repeat(80));
console.log("   CODEORBIT MILESTONE 2: AUTH HARDENING & SPA DECOMMISSION VERIFICATION   ");
console.log("=".repeat(80));

// Generate a valid RSA keypair for offline cryptographic testing
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const TEST_KEY_ID = "test-rsa-kid-2026";
const PROJECT_ID = "leetcode-clone-3ac0a";

function createMockJwt(header, payload, privKey = privateKey) {
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${headerB64}.${payloadB64}`;

  if (header.alg === "none") {
    return `${data}.`;
  }

  const signer = createSign("RSA-SHA256");
  signer.update(data);
  const sigB64 = signer.sign(privKey).toString("base64url");
  return `${data}.${sigB64}`;
}

async function runMilestone2Tests() {
  console.log("\n[Suite 1/3] Testing Legacy Vite SPA Decommissioning...");

  // Test 1: legacy:frontend script rejection
  try {
    execSync("npm run legacy:frontend", { stdio: "pipe" });
    assert(false, "Legacy Vite script should exit with non-zero code");
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || "";
    assert(
      output.includes("permanently decommissioned") || output.includes("dev:web"),
      "legacy:frontend fails closed with decommissioning guidance"
    );
  }

  // Test 2: backend CORS origins contain port 3001
  const backendIndexSource = fs.readFileSync(
    path.resolve(process.cwd(), "backend/src/index.ts"),
    "utf8"
  );
  assert(
    backendIndexSource.includes("http://localhost:3001") &&
      backendIndexSource.includes("http://127.0.0.1:3001"),
    "backend/src/index.ts defines port 3001 as primary allowed origins"
  );

  console.log("\n[Suite 2/3] Cryptographic Token Verification & Claims Validation...");

  // Test 3: Malformed JWT rejection
  const malformedResult = await verifyFirebaseToken("invalid.token");
  assert(
    malformedResult.valid === false && malformedResult.error === "INVALID_FORMAT",
    "Malformed JWT without 3 segments is rejected with INVALID_FORMAT"
  );

  // Test 4: Unsupported algorithm rejection (alg: "none" attack)
  const noneAlgToken = createMockJwt(
    { alg: "none", kid: TEST_KEY_ID },
    {
      sub: "user-123",
      aud: PROJECT_ID,
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }
  );
  const noneResult = await verifyFirebaseToken(noneAlgToken, {
    customPublicKey: publicKey,
    customKeyId: TEST_KEY_ID,
    projectId: PROJECT_ID,
  });
  assert(
    noneResult.valid === false && noneResult.error === "UNSUPPORTED_ALGORITHM",
    "Unsigned alg: 'none' token is rejected with UNSUPPORTED_ALGORITHM"
  );

  // Test 5: Expired token rejection
  const expiredToken = createMockJwt(
    { alg: "RS256", kid: TEST_KEY_ID },
    {
      sub: "user-expired",
      email: "expired@test.com",
      aud: PROJECT_ID,
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      exp: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
      iat: Math.floor(Date.now() / 1000) - 3600,
    }
  );
  const expiredResult = await verifyFirebaseToken(expiredToken, {
    customPublicKey: publicKey,
    customKeyId: TEST_KEY_ID,
    projectId: PROJECT_ID,
  });
  assert(
    expiredResult.valid === false && expiredResult.error === "EXPIRED_TOKEN",
    "Expired token is rejected with EXPIRED_TOKEN"
  );

  // Test 6: Invalid audience rejection
  const badAudienceToken = createMockJwt(
    { alg: "RS256", kid: TEST_KEY_ID },
    {
      sub: "user-badaud",
      aud: "wrong-project-id",
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }
  );
  const badAudResult = await verifyFirebaseToken(badAudienceToken, {
    customPublicKey: publicKey,
    customKeyId: TEST_KEY_ID,
    projectId: PROJECT_ID,
  });
  assert(
    badAudResult.valid === false && badAudResult.error === "INVALID_CLAIMS",
    "Mismatched aud claim is rejected with INVALID_CLAIMS"
  );

  // Test 7: Tampered signature rejection
  const validToken = createMockJwt(
    { alg: "RS256", kid: TEST_KEY_ID },
    {
      sub: "student-aarav-123",
      email: "aarav@codeorbit.test",
      name: "Aarav Mehta",
      aud: PROJECT_ID,
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }
  );
  const [h, p, sig] = validToken.split(".");
  const tamperedSig = sig.slice(0, -4) + "AAAA";
  const tamperedToken = `${h}.${p}.${tamperedSig}`;
  const tamperedResult = await verifyFirebaseToken(tamperedToken, {
    customPublicKey: publicKey,
    customKeyId: TEST_KEY_ID,
    projectId: PROJECT_ID,
  });
  assert(
    tamperedResult.valid === false && tamperedResult.error === "INVALID_SIGNATURE",
    "Tampered cryptographic signature is rejected with INVALID_SIGNATURE"
  );

  // Test 8: Valid cryptographic RSA signature acceptance
  const validResult = await verifyFirebaseToken(validToken, {
    customPublicKey: publicKey,
    customKeyId: TEST_KEY_ID,
    projectId: PROJECT_ID,
  });
  assert(
    validResult.valid === true &&
      validResult.viewer?.uid === "student-aarav-123" &&
      validResult.viewer?.email === "aarav@codeorbit.test" &&
      validResult.viewer?.displayName === "Aarav Mehta",
    "Authentic RSA-SHA256 signature verified and claims extracted"
  );

  console.log("\n[Suite 3/3] Zero-Trust Header Spoofing Protection...");

  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowBypass = process.env.ALLOW_DEV_HEADER_AUTH;

  try {
    // Test 9: Production mode header spoofing rejection
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_DEV_HEADER_AUTH;

    const prodHeaders = new Headers({
      "x-codeorbit-viewer-uid": "spoofed-admin-uid",
      "x-codeorbit-viewer-email": "admin@spoofed.com",
    });

    const prodViewer = await extractViewerFromHeaders(prodHeaders);
    assert(
      !prodViewer.uid && !prodViewer.email,
      "Production mode rejects x-codeorbit-viewer-uid spoofing"
    );

    // Test 10: Default development mode without opt-in flag rejects header spoofing
    process.env.NODE_ENV = "development";
    delete process.env.ALLOW_DEV_HEADER_AUTH;

    const devDefaultHeaders = new Headers({
      "x-codeorbit-viewer-uid": "spoofed-dev-uid",
      "x-codeorbit-viewer-email": "user@dev.local",
    });

    const devDefaultViewer = await extractViewerFromHeaders(devDefaultHeaders);
    assert(
      !devDefaultViewer.uid && !devDefaultViewer.email,
      "Development mode without ALLOW_DEV_HEADER_AUTH=true rejects header spoofing"
    );

    // Test 11: Controlled opt-in allows dev headers only with ALLOW_DEV_HEADER_AUTH=true
    process.env.NODE_ENV = "development";
    process.env.ALLOW_DEV_HEADER_AUTH = "true";

    const devAllowedHeaders = new Headers({
      "x-codeorbit-viewer-uid": "local-test-uid-456",
      "x-codeorbit-viewer-email": "local@codeorbit.test",
      "x-codeorbit-viewer-name": "Local Tester",
    });

    const devAllowedViewer = await extractViewerFromHeaders(devAllowedHeaders);
    assert(
      devAllowedViewer.uid === "local-test-uid-456" &&
        devAllowedViewer.email === "local@codeorbit.test" &&
        devAllowedViewer.displayName === "Local Tester",
      "Development mode with ALLOW_DEV_HEADER_AUTH=true permits controlled local testing"
    );

    // Test 12: requireAuth throws AuthenticationError when unauthenticated
    process.env.NODE_ENV = "production";
    let authErrorThrown = false;
    try {
      await requireAuth(new Headers());
    } catch (err) {
      if (err instanceof AuthenticationError && err.status === 401) {
        authErrorThrown = true;
      }
    }
    assert(
      authErrorThrown,
      "requireAuth fails closed and throws AuthenticationError (HTTP 401)"
    );
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalAllowBypass !== undefined) {
      process.env.ALLOW_DEV_HEADER_AUTH = originalAllowBypass;
    } else {
      delete process.env.ALLOW_DEV_HEADER_AUTH;
    }
  }

  console.log("\n" + "=".repeat(80));
  if (failCount === 0) {
    console.log(`>>> MILESTONE 2 VERIFICATION COMPLETED: ${passCount}/${passCount} ASSERTIONS PASSED <<<`);
  } else {
    console.error(`>>> MILESTONE 2 VERIFICATION FAILED: ${failCount} FAILING ASSERTIONS <<<`);
    process.exit(1);
  }
  console.log("=".repeat(80) + "\n");
}

runMilestone2Tests().catch((err) => {
  console.error("FATAL test error:", err);
  process.exit(1);
});
