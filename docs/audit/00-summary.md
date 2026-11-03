# CodeOrbit Phase 0: Platform Discovery & Master Architecture Summary

## 1. Master Plan Executive Summary (15 Lines)
1. **Mission:** Build an India-first developer hiring and placement operating system bridging campus engineering talent and tech recruiters.
2. **Target Audience:** 1.5M annual engineering graduates from 3,500+ Indian colleges (focusing heavily on Tier-2/Tier-3 institutions) facing high campus rejection rates.
3. **Core B2C Wedge:** Free AI Resume Roaster & ATS Optimizer generating immediate viral utility on LinkedIn and college WhatsApp groups.
4. **Core Candidate Experience:** Monaco browser IDE, localized hiring tracks (Amazon, Google, TCS, Infosys, Flipkart), and Gemini AI voice/chat mock interviews.
5. **Accredited Output:** A tamper-resistant, verifiable 0–100 Technical Readiness Score and cryptographic proof-of-work profile.
6. **B2B Institutional Product:** Centralized TPO (Training & Placement Officer) command center with batch analytics, OA clearance predictions, and NIRF/NAAC reporting.
7. **Recruiter Marketplace:** Zero-friction search filtering candidates with verified 80+ readiness scores who consented to employer contact under DPDP.
8. **Business Model:** Hybrid B2B2C — B2C one-time placement sprint passes (₹499–₹1,499) + B2B campus annual licenses (₹99,000–₹1,99,000/yr).
9. **Infrastructure Goal:** Ultra-lean operational burn under ₹2,900/month (<$35/mo) leveraging generous cloud tiers and serverless execution.
10. **Frontend Engine:** Next.js 15 App Router on Port 3001 with Tailwind CSS, Server-Side Rendering (SSR), and React 19.
11. **Legacy Decommission:** The old Vite SPA (`frontend/` on port 5173) is obsolete and permanently decommissioned.
12. **AI Engine:** Google Gemini 2.5 Flash for high-speed token generation with local deterministic rubric fallbacks.
13. **Code Execution:** Sandboxed Judge0 runner with strict memory, CPU, and network isolation.
14. **Billing Gateway:** Razorpay India integration supporting UPI Intent, Cards, Netbanking, with HMAC-SHA256 webhook signatures.
15. **Data Protection:** Strict compliance with India's Digital Personal Data Protection (DPDP) Act, 2023.

---

## 2. MVP Scope vs. Post-MVP Roadmap

| Product Pillar | Minimum Viable Product (Phase 1–4) | Post-MVP Expansion (Phase 5–7) |
| :--- | :--- | :--- |
| **Problem IDE & Judge** | 14 original core problems, Monaco editor, sub-200ms Judge0 execution, hidden server-side test case verification, Python/JS/Java/C++. | 250+ original problems, custom memory profilers, multi-file workspaces. |
| **Resume Roaster** | Instant PDF/DOCX parser, 0–100 ATS score, 8 company profiles, LaTeX/PDF export, LinkedIn/WhatsApp share card. | Job Description keyword match comparison, automated line-by-line bullet rewrite engine. |
| **Mock Interviewer** | Socratic text/voice coaching with Gemini 2.5 Flash, 8 company rubrics, 5-dimension scorecard, auth-gated quotas. | Video posture/eye-contact analysis, customized college interview panels. |
| **Readiness Engine** | Deterministic 5-factor verified score (mastery, streak, accuracy, company track, mock interview), cryptographic SHA-256 badges. | Multi-tier percentile ranking across all Indian universities, automated HackerRank test importer. |
| **Campus Portal (TPO)** | Cohort readiness distribution, company OA predictors, batch CSV export with DPDP audit trails, NIRF/NAAC CSV export. | Live proctored mock placement contest runner, bulk student invite emails via SendGrid. |
| **Monetization** | Test-mode and live Razorpay UPI checkout for Sprint Pass (₹499) & Season Pass (₹1,499), webhook idempotency. | Institutional invoicing portal with GST e-invoicing and split-fee college payment plans. |

---

## 3. Repository Architecture & Stack Mapping

- **Monorepo Manager:** npm workspaces + Turborepo (`turbo 2.8.17`)
- **Web Application (`apps/web`):**
  - Framework: Next.js 15.5.13 App Router (Turbopack compatible)
  - UI Library: React 19.2.0, Tailwind CSS 3.4.19, Framer Motion 12.38.0
  - Code Editor: Monaco Editor 0.55.1 / `@monaco-editor/react` 4.7.0
  - State Management: React Context (`AuthContext`, `PreferencesContext`) + Next.js App Router Server State
- **Shared Packages:**
  - `@codeorbit/schema`: Unified Zod schemas (problems, contests, billing, DPDP logs, rate limits)
  - `@codeorbit/ui`: Shared design system, theme tokens, and mock data catalog
- **Backend & Cloud Services:**
  - **Auth:** Firebase Auth (Client SDK v12.4.0) + Server-side RS256 token verification using Google's public x509 certificates (no heavy `firebase-admin` daemon required).
  - **Database:** Supabase PostgreSQL with PostgREST (`/rest/v1`) + local JSON cache fallback (`.codeorbit-cache/platform-storage.json`).
  - **Code Execution:** Judge0 Community Edition (`ce.judge0.com`) / self-hosted Linux isolate with cgroups.
  - **AI Provider:** Google Gemini API (`gemini-2.5-flash`) via structured JSON output schemas.
  - **Payments:** Razorpay REST API v1 (`orders`, `payments`) with HMAC-SHA256 signature verification.
  - **CI/CD:** GitHub Actions workflows (`code-quality.yml`, `dependabot.yml`) + Vercel Git integration.

### Environment Variables Inventory (Names Only — Zero Secrets)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION`
- `NEXT_PUBLIC_ENABLE_APPCHECK`
- `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`
- `NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `JUDGE0_URL`
- `JUDGE0_KEY`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_ADMIN_EMAILS`
- `ALLOW_DEV_HEADER_AUTH`

---

## 4. Test & Verification Execution Results

| Verification Suite | Target Checked | Status | Details |
| :--- | :--- | :--- | :--- |
| **Typecheck** | `tsc --noEmit` across all workspaces | **PASS (100%)** | Zero TypeScript compilation errors. |
| **Web Build** | `next build` (46 static & dynamic pages) | **PASS (100%)** | 46/46 pages prerendered. First load JS shared: 102 kB. |
| **Milestone 1** | Tenancy, Batch Contests & DPDP Compliance | **PASS (10/10)** | Schemas, SQL migrations, local storage sync. |
| **Milestone 2** | Auth Hardening & Legacy SPA Decommission | **PASS (12/12)** | RS256 token verification, anti-spoofing zero-trust dev headers. |
| **Milestone 3** | Razorpay Payment Convergence & Idempotency | **PASS (15/15)** | HMAC-SHA256 signatures, replay protection, lifecycle refund handling. |
| **Milestone 4** | Submission Pipeline & Readiness Engine | **PASS (10/10)** | Acceptance rate calculation, tier categorization. |
| **Milestone 5** | Tier-Aware Rate Limiting & Sandbox Protection | **PASS (14/14)** | Sliding windows, rate limit response headers, IP hashing. |
| **Milestone 6** | Monaco Workspace & Socratic Hints | **PASS (6/6)** | 3-tier Socratic nudges without answer spoiling. |
| **Milestone 7** | ATS Resume Builder & Resume Roaster | **PASS (8/8)** | PDF/DOCX extraction, LaTeX generator, ATS scoring. |
| **Milestone 8** | AI Voice/Chat Mock Interviewer & Scorecard | **PASS (6/6)** | Company rubrics, turn generation, 5-dimension rubric breakdown. |
| **Milestone 9** | B2B TPO Batch Analytics & Cryptographic Badges | **PASS (5/5)** | SHA-256 tamper checks, DPDP candidate filters. |
| **Phase 2 Growth** | Health Probe, Dynamic OG, NIRF Reporting | **PASS (11/11)** | Health metrics, NIRF CSV/JSON exports. |
| **ESLint (`lint:web`)** | Static code analysis | **WARNING / FAIL** | 2 errors (ESLint attempted to scan `.next.nosync` build artifacts; invalid disable comment in resume parser). Needs `.eslintignore` update. |
| **Dependency Audit** | `npm audit` | **36 Issues** | 20 moderate, 13 high, 3 critical in dev dependencies (`turbo`, `protobufjs`, `postcss`, `sharp`). |

---

## 5. Route-by-Route Live Audit (All 29 Pages + 26 API Endpoints)

| URL Route | Category | HTTP Status | Auth Required | Implementation Status | Mobile Responsive |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Landing | 200 OK | No | Real (contains contradictory marketing claims A1–A3) | Yes |
| `/about` | Static Info | 200 OK | No | Real | Yes |
| `/activity` | Private User | 200 OK | Yes (AuthGuard) | Real | Yes |
| `/admin` | Administration | 200 OK | Yes (Admin Whitelist) | Real | Yes |
| `/admin/dpdp` | Compliance Audit | 200 OK | Yes (Admin Whitelist) | Real | Yes |
| `/blog` | Content Hub | 200 OK | No | Real | Yes |
| `/campus-beta` | B2B Lead Gen | 200 OK | No | Real | Yes |
| `/companies/[slug]` | Dynamic Track | 200 OK | No | Real (Amazon, Google, TCS, Flipkart, Infosys, Microsoft) | Yes |
| `/dashboard` | User Workspace | 200 OK | Yes (AuthGuard) | Real | Yes |
| `/for-campuses` | B2B Landing | 200 OK | No | Real | Yes |
| `/for-campuses/demo`| B2B Demo | 200 OK | No (Self-serve) | Real interactive TPO dashboard (140 students) | Yes |
| `/for-recruiters` | B2B Landing | 200 OK | No | Real | Yes |
| `/leaderboard` | Community | 200 OK | No | Real (synced with platform storage) | Yes |
| `/login` | Auth | 200 OK | No | Real (Firebase email/password + Google OAuth) | Yes |
| `/mock-interview` | AI Career Coach | 200 OK | Yes (Session Start) | Real (Gemini 2.5 + Web Speech API + 8 company rubrics) | Yes |
| `/prep` | Practice Track | 200 OK | No | Real | Yes |
| `/pricing` | Billing & Plans | 200 OK | No (Checkout needs Auth) | Real (contains developer status disclaimer A5) | Yes |
| `/privacy` | Legal | 200 OK | No | Real (mentions outdated GDPR/IT Act wording A10) | Yes |
| `/problems` | Catalog | 200 OK | No | Real (14 mock catalog problems) | Yes |
| `/problems/[id]` | IDE Workspace | 200 OK | No (Guests allowed) | Real (Monaco editor + Judge0 execution) | Yes (3-tab responsive) |
| `/proof/[handle]` | Proof Profile | 200 OK | No | Real (Demo profile `aarav-mehta` presented as real A7) | Yes |
| `/readiness-score` | Analytics | 200 OK | Yes (AuthGuard) | Real (5-factor formula) | Yes |
| `/recruiter-beta` | B2B Search | 200 OK | No | Real (search & candidate filters) | Yes |
| `/resume` | Career Hub | 200 OK | No | Real | Yes |
| `/resume-builder` | Career Tool | 200 OK | Yes (AuthGuard) | Real (ATS score, LaTeX, PDF compiler) | Yes |
| `/resume-roaster` | Viral Tool | 200 OK | No | Real (PDF/DOCX upload, brutal ATS roast, OG card) | Yes |
| `/roles/[slug]` | Career Tracks | 200 OK | No | Real (SDE Intern, Fresher SDE, Frontend, Backend) | Yes |
| `/signup` | Auth | 200 OK | No | Real | Yes |
| `/terms` | Legal | 200 OK | No | Real | Yes |
| `/tracks` | Curricula | 200 OK | No | Real | Yes |
| `/api/health` | Monitoring | 200 OK | No | Real (process uptime, memory RSS) | N/A |
| `/api/platform/run` | Code Execution | 200 OK | No (Rate-limited) | Real (Judge0 remote proxy) | N/A |
| `/api/platform/submit`| Code Submission | 200 OK | No (Rate-limited) | Real (Client currently sends expectedOutput) | N/A |
| `/api/platform/billing/*`| Payments | 200/401 | Yes | Real (Razorpay orders, verification, webhooks) | N/A |
| `/api/ai/resume/*` | AI Resumes | 200/401 | Yes | Real (Gemini structured extraction) | N/A |
| `/api/ai/mock-interview/*`| AI Interviews | 401 (Auth Guard) | Yes | Real (Gemini 2.5 voice coaching) | N/A |
| `/api/og/roaster` | Social Engine | 200 OK | No | Real (Dynamic 1200x630 Edge OpenGraph) | N/A |
