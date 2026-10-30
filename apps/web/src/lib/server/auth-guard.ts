import { createVerify } from "node:crypto";

export interface ViewerContext {
  uid?: string;
  email?: string;
  displayName?: string;
}

export type AuthErrorCode =
  | "NO_TOKEN"
  | "INVALID_FORMAT"
  | "UNSUPPORTED_ALGORITHM"
  | "EXPIRED_TOKEN"
  | "INVALID_CLAIMS"
  | "INVALID_SIGNATURE"
  | "UNKNOWN_KEY_ID"
  | "UNAUTHORIZED";

export class AuthenticationError extends Error {
  readonly status: number;
  readonly code: AuthErrorCode;

  constructor(
    message: string,
    status: number = 401,
    code: AuthErrorCode = "UNAUTHORIZED"
  ) {
    super(message);
    this.name = "AuthenticationError";
    this.status = status;
    this.code = code;
  }
}

export interface AuthVerificationResult {
  valid: boolean;
  viewer?: ViewerContext;
  payload?: Record<string, unknown>;
  error?: AuthErrorCode;
  message?: string;
}

interface GoogleCertCache {
  certs: Record<string, string>;
  expiresAt: number;
}

let googleCertCache: GoogleCertCache | null = null;

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export const getGooglePublicCerts = async (): Promise<Record<string, string>> => {
  const now = Date.now();
  if (googleCertCache && googleCertCache.expiresAt > now) {
    return googleCertCache.certs;
  }

  try {
    const res = await fetch(GOOGLE_CERTS_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google certs: HTTP ${res.status}`);
    }

    const certs = (await res.json()) as Record<string, string>;
    const cacheControl = res.headers.get("cache-control") || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

    googleCertCache = {
      certs,
      expiresAt: now + maxAgeSec * 1000,
    };
    return certs;
  } catch (error) {
    if (googleCertCache) {
      return googleCertCache.certs;
    }
    console.warn("Could not retrieve Google certificates for JWT verification:", error);
    return {};
  }
};

/**
 * Resets certificate cache. Primarily used in unit tests.
 */
export const resetGoogleCertCache = () => {
  googleCertCache = null;
};

/**
 * Cryptographically verifies an incoming Firebase ID token using Google public certificates.
 * Validates token structure, header algorithm, claims (exp, iat, aud, iss, sub), and RS256 signature.
 */
export const verifyFirebaseToken = async (
  token: string,
  options?: {
    customPublicKey?: string;
    customKeyId?: string;
    projectId?: string;
  }
): Promise<AuthVerificationResult> => {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "NO_TOKEN", message: "Token is empty or non-string." };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "INVALID_FORMAT", message: "JWT must have exactly 3 parts." };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string; kid?: string };
  try {
    const headerJson = Buffer.from(headerB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    header = JSON.parse(headerJson);
  } catch {
    return { valid: false, error: "INVALID_FORMAT", message: "Malformed JWT header encoding." };
  }

  if (header.alg !== "RS256" || !header.kid) {
    return {
      valid: false,
      error: "UNSUPPORTED_ALGORITHM",
      message: `Invalid algorithm or missing key ID (alg: ${header.alg}).`,
    };
  }

  let payload: Record<string, unknown>;
  try {
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    payload = JSON.parse(payloadJson);
  } catch {
    return { valid: false, error: "INVALID_FORMAT", message: "Malformed JWT payload encoding." };
  }

  const projectId = (
    options?.projectId ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "leetcode-clone-3ac0a"
  ).trim();

  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Expiration check with 300s clock skew tolerance
  if (typeof payload.exp !== "number" || payload.exp < nowSec - 300) {
    return { valid: false, error: "EXPIRED_TOKEN", message: "Token has expired." };
  }

  // 2. Issued-at check with 300s future tolerance
  if (typeof payload.iat !== "number" || payload.iat > nowSec + 300) {
    return { valid: false, error: "INVALID_CLAIMS", message: "Token iat claim is in the future." };
  }

  // 3. Audience check
  if (payload.aud !== projectId) {
    return {
      valid: false,
      error: "INVALID_CLAIMS",
      message: `Token aud claim '${payload.aud}' does not match expected project '${projectId}'.`,
    };
  }

  // 4. Issuer check
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIssuer) {
    return {
      valid: false,
      error: "INVALID_CLAIMS",
      message: `Token iss claim '${payload.iss}' does not match expected issuer '${expectedIssuer}'.`,
    };
  }

  // 5. Subject check
  if (typeof payload.sub !== "string" || payload.sub.trim() === "") {
    return { valid: false, error: "INVALID_CLAIMS", message: "Token sub claim is missing or empty." };
  }

  // 6. Cryptographic RS256 signature verification
  let publicKey: string | undefined;

  if (options?.customPublicKey) {
    publicKey = options.customPublicKey;
  } else {
    const certs = await getGooglePublicCerts();
    publicKey = certs[header.kid];
  }

  if (!publicKey) {
    return {
      valid: false,
      error: "UNKNOWN_KEY_ID",
      message: `Public certificate not found for key ID: ${header.kid}`,
    };
  }

  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    const signatureBuffer = Buffer.from(signatureB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const isSignatureValid = verifier.verify(publicKey, signatureBuffer);

    if (!isSignatureValid) {
      return { valid: false, error: "INVALID_SIGNATURE", message: "Cryptographic signature mismatch." };
    }
  } catch (verifyError) {
    return {
      valid: false,
      error: "INVALID_SIGNATURE",
      message: (verifyError as Error).message || "Signature verification failed.",
    };
  }

  const uid = String(payload.user_id || payload.sub);
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const displayName = typeof payload.name === "string" ? payload.name : undefined;

  return {
    valid: true,
    payload,
    viewer: { uid, email, displayName },
  };
};

/**
 * Extracts and cryptographically verifies the ViewerContext from incoming request headers.
 * 
 * Boundary Security Policy:
 * 1. Bearer token present: Cryptographically verified against Google public certs.
 *    Invalid tokens fail closed immediately and return an empty viewer.
 * 2. No Bearer token:
 *    Dev debug headers (x-codeorbit-viewer-uid) are ONLY accepted if:
 *    NODE_ENV === "development" AND ALLOW_DEV_HEADER_AUTH === "true".
 *    In any other environment or configuration, debug headers are strictly rejected.
 */
export const extractViewerFromHeaders = async (headers: Headers): Promise<ViewerContext> => {
  const authHeader = headers.get("authorization") ?? headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const result = await verifyFirebaseToken(token);
    if (result.valid && result.viewer) {
      return result.viewer;
    }
    // Any invalid/expired Bearer token fails closed immediately
    return {};
  }

  // Strict zero-trust guard for dev headers:
  // Must be explicitly in development AND have the ALLOW_DEV_HEADER_AUTH opt-in flag.
  const isDevelopment = process.env.NODE_ENV === "development";
  const allowDevBypass = process.env.ALLOW_DEV_HEADER_AUTH === "true";

  if (isDevelopment && allowDevBypass) {
    const devUid = headers.get("x-codeorbit-viewer-uid");
    if (devUid && devUid.trim()) {
      return {
        uid: devUid.trim(),
        email: headers.get("x-codeorbit-viewer-email")?.trim() || undefined,
        displayName: headers.get("x-codeorbit-viewer-name")?.trim() || undefined,
      };
    }
  }

  return {};
};

/**
 * Enforces authenticated viewer access on sensitive endpoints.
 * Throws an AuthenticationError with HTTP 401 if viewer is unauthenticated.
 */
export const requireAuth = async (headers: Headers): Promise<ViewerContext> => {
  const viewer = await extractViewerFromHeaders(headers);
  if (!viewer.uid || !viewer.email) {
    throw new AuthenticationError("Authentication required.", 401, "UNAUTHORIZED");
  }
  return viewer;
};

const getAdminEmailList = (): Set<string> => {
  const envAdmins = process.env.ADMIN_EMAILS || "vaibhavmaurya.1409@gmail.com";
  return new Set(
    envAdmins
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
};

/**
 * Enforces administrator role on administrative routes.
 * Throws 401 if unauthenticated, 403 if authenticated but non-admin.
 */
export const requireAdmin = async (
  headers: Headers,
  profileResolver?: (viewer: ViewerContext) => Promise<{ isAdmin?: boolean; role?: string } | null>
): Promise<ViewerContext> => {
  const viewer = await requireAuth(headers);
  const adminEmails = getAdminEmailList();

  const isEmailAdmin = viewer.email ? adminEmails.has(viewer.email.toLowerCase()) : false;
  if (isEmailAdmin) {
    return viewer;
  }

  if (profileResolver) {
    const profile = await profileResolver(viewer);
    if (profile?.isAdmin === true || profile?.role === "admin") {
      return viewer;
    }
  }

  throw new AuthenticationError("Access forbidden. Admin role required.", 403, "UNAUTHORIZED");
};
