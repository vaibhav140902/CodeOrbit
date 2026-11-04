# CodeOrbit Comprehensive Security, Privacy & Hardening Audit

This audit evaluates the platform's authentication architecture, authorization controls, secret management, upload handling, rate limiting, and dependency health.

---

## 1. Firebase Security & Rules Analysis
- **Firestore Security Rules (`firestore.rules`):**
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if false;
      }
    }
  }
  ```
  **Verdict:** **Strict Default-Deny.** The client SDK is forbidden from making direct client-side reads or writes to Firestore. All persistence passes through authenticated Next.js server route handlers.
- **App Check Status:** Disabled in development (`NEXT_PUBLIC_ENABLE_APPCHECK=false`). Must be configured with reCAPTCHA Enterprise on production domain before high-volume marketing campaigns.
- **Staging vs. Production Firebase:** A separate staging Firebase project is required to avoid polluting production auth accounts during QA tests.

---

## 2. Authentication & Authorization Flows
- **Client Auth:** Firebase Web SDK (`signInWithPopup` for Google OAuth and `signInWithEmailAndPassword`).
- **Server Verification (`apps/web/src/lib/server/auth-guard.ts`):**
  - Uses native Node.js `node:crypto` (`createVerify('RSA-SHA256')`) against Google's public x509 certificates fetched from `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`.
  - Implements in-memory cert caching with TTL expiration.
  - Zero-Trust Header Protection: Dev bypass headers (`x-codeorbit-viewer-uid`) are strictly rejected in `NODE_ENV=production` and in development unless `ALLOW_DEV_HEADER_AUTH=true` is explicitly set.
- **Admin Authorization:**
  - Enforced via `requireAdmin(headers)` in `auth-guard.ts`.
  - Checks verified token email against `ADMIN_EMAILS` whitelist and user role in database.

---

## 3. Secret Management & Credential Exposure
- **Static Code Scan:** Executed regex scan across all source files for leaked API keys (`AIzaSy`, `sk-`, `rzp_live`, RSA private keys).
- **Verdict:** **Clean.** No production credentials, live Razorpay secrets, or service account JSON keys are committed to Git.
- **Local Secrets:** Stored in `.env.local` (git-ignored).
- **Vercel Gap:** Production environment variables must be populated in the Vercel Project Dashboard. Currently, unpopulated variables cause server routes to fall back to local mock cache.

---

## 4. File Upload & Document Parsing Security (`/api/platform/resume/parse`)
- **Supported File Types:** `.pdf`, `.docx`, `.txt`.
- **Size Limitation:** Hard 5MB ceiling enforced via buffer length check (`5 * 1024 * 1024` bytes).
- **Execution Vector:**
  - `pdf-parse`: Runs in Node.js serverless runtime. Vulnerable to malformed PDF font decompression bombs if not bounded.
  - `mammoth`: Unzips and parses DOCX XML trees.
- **Recent Hardening:** Attached `assertTierRateLimit(request, "resume_generation", viewer)` to prevent CPU exhaustion DoS attacks via automated batch file uploads.
- **Privacy Assurance:** Resumes are parsed in-memory and converted to plain text strings. Raw binary files are discarded after response completion; no user PDFs are stored on disk or publicly accessible cloud buckets without user consent.

---

## 5. Cost Abuse & Rate Limiting Controls
Tier-aware sliding window rate limits are implemented in `apps/web/src/lib/server/rate-limit.ts`:

| Action | Guest Quota | Free User Quota | Pro Plan Quota | Defense Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Code Execution (`/run`, `/submit`)** | 15 / hour | 15 / hour | 100 / hour | Sliding window per IP/UID hash; prevents Judge0 credit drain. |
| **Resume Generation (`/roast`, `/resume`)** | 2 / day | 2 / day | 50 / hour | Bounded daily quota prevents runaway Gemini API costs. |
| **AI Mock Interview (`/mock-interview/turn`)** | **Blocked (401)** | 30 / hour | 300 / hour | Requires authenticated session; stops anonymous bot scraping. |
| **AI Live Coaching (`/mock-interview/live`)** | **Blocked (401)** | 60 / hour | 600 / hour | Requires authenticated session; throttles real-time cues. |
| **Document File Parsing (`/resume/parse`)** | 2 / day | 2 / day | 50 / hour | Enforces CPU protection against unauthenticated batch uploads. |
| **Waitlist Submission (`/api/waitlist`)** | 15 / 15 mins | 15 / 15 mins | 30 / 15 mins | Anti-spam IP rate limiting prevents database flooding. |

---

## 6. Code Execution Isolation (Judge0)
- **Current Setup:** Connects to public Judge0 Community Edition (`https://ce.judge0.com`).
- **Security Flaw in Solution Verification:**
  - In `/api/platform/submit/route.ts`, the client passes `stdin` and `expectedOutput` in the request body.
  - The server verifies code against the **client-provided expected output** rather than looking up canonical hidden test cases by `problemId`.
  - **Risk:** Any user can forge a passing submission by sending matching input/output pairs, artificially boosting their Readiness Score and generating illegitimate cryptographic proof badges.
- **Isolation Parameters Required:**
  - CPU time limit: 2.0s
  - Memory limit: 256MB
  - Process limit: 30 pids
  - Network access: Strictly disabled (`--share-net=false`)

---

## 7. HTTP Security Headers & Network Hygiene
- **Content-Security-Policy (CSP):** Enforces strict source directives (`default-src 'self'`). Scripts restricted to self, Google reCAPTCHA, Cloudflare CDN, and Razorpay.
- **Clickjacking Defense:** `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`.
- **MIME Sniffing:** `X-Content-Type-Options: nosniff`.
- **Transport Security:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` enforced on Vercel production edge.
- **Permissions Policy:** Restricts camera and geolocation; grants microphone only to self for voice mock interviews.

---

## 8. Dependency Vulnerability Audit (`npm audit`)
- **Total Detected Vulnerabilities:** 36 (20 moderate, 13 high, 3 critical).
- **Key Affected Packages:**
  - `protobufjs` <= 7.6.4 (Critical: Code injection / Prototype pollution in dev dependencies).
  - `websocket-driver` <= 0.7.4 (Critical: Resource limit bypass).
  - `postcss` <= 8.5.22 (High: CSS parsing vulnerabilities).
  - `zod` < 4.6.6 (High: Memory exhaustion on oversized collections).
- **Remediation Recommendation:** Execute non-breaking dependency updates (`npm audit fix`) on staging branch without introducing breaking changes to Next.js 15 peer dependencies.
