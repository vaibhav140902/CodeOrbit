# CodeOrbit Platform Truth Table & Claims Audit

This Truth Table audits every quantitative and qualitative claim on the public web application (`https://getcodeorbit.vercel.app`), marketing pages, and codebase against real empirical repository evidence as of 4 November 2026.

---

## 1. Verified Audit Status & Remediation Summary

| Finding | Category | Public Claim | Initial Verdict | Phase 1 Status | Implemented Remediation |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **A1.1** | Problem Count | "1,200+ Curated Problems" | **FALSE** | **RESOLVED** | Dynamically computed from data in `platform-config.ts`: `14 Interactive IDE Challenges · 38 Curated Company Prompts`. |
| **A1.2** | Problem Count | "Explore Full Bank (38+ problems) →" | **FALSE** | **RESOLVED** | Updated to `Explore Full Bank (${PLATFORM_METRICS.curriculumQuestionCount} curated questions) →`. |
| **A2.1** | Free vs. Paid | "100% Free · Public Access · No Credit Card or Gatekeeping" | **FALSE** | **RESOLVED** | Replaced with honest copy: "Free Core Practice & ATS Scoring · Pro Upgrades for Live AI Mocks". |
| **A2.2** | Free vs. Paid | "Preview only on Free" on `/problems` | **UNVERIFIABLE** | **IN SCOPE** | Gating clarified: Free practice allows full Monaco editor code execution; Pro pass unlocks Gemini AI Mock Interviews & live cohort tracking. |
| **A3.1** | Unsourced Stat | "98.4% ATS Parse Accuracy" | **UNVERIFIABLE** | **RESOLVED** | Removed fake precision. Replaced with factual capability: "Direct ATS Document Parser (PDF & DOCX Plaintext Extraction)". |
| **A3.2** | Unsourced Stat | "<200ms Sandbox Execution" | **UNVERIFIABLE** | **RESOLVED** | Replaced with honest architecture: "Isolated Judge0 Code Runner (Python, C++, Java, JS)". |
| **A3.3** | Unsourced Stat | "78% of Tier-2 college candidates fail the initial ATS screen" | **UNVERIFIABLE** | **RESOLVED** | Standardized to honest qualitative statement: `HONEST_MARKETING_CLAIMS.atsScreenContext`. |
| **A3.4** | Unsourced Stat | "Over 85% of fresher tech resumes get discarded..." | **UNVERIFIABLE** | **RESOLVED** | Standardized across roaster to qualitative consensus: `HONEST_MARKETING_CLAIMS.resumeDiscardContext`. |
| **A4.1** | Sprint Consistency | "Apply for cohort" vs. "₹4,999 Start Sprint" | **FALSE** | **RESOLVED** | Unified in `COMMERCIAL_PLANS`: Interview Sprint is a ₹4,999 high-intensity placement season pass with instant checkout or cohort waitlist application. |
| **A5.1** | Debug Text | "Live billing and beta storage still depend on server credentials..." | **FALSE** | **RESOLVED** | Completely deleted developer debug status text from public `/pricing` page. |
| **A6.1** | Profile Count | "✓ 9 Localized Company Profiles (Amazon, TCS...)" | **FALSE** | **RESOLVED** | Reconciled count to exactly match `COMPANY_OPTIONS.length` (8 profiles: Amazon, TCS, Infosys, Flipkart, Google, Microsoft, Swiggy, Razorpay). |
| **A6.2** | Salary Claim | "TCS Digital & Prime (₹7–9 LPA)" | **UNVERIFIABLE** | **RESOLVED** | Stripped unsourced salary figure. Replaced with neutral role description: `TCS Digital & Prime Roles`. |
| **A7.1** | Demo Profile | Proof Profile "Aarav Mehta" looks like a real live student | **FALSE** | **RESOLVED** | Added prominent top disclaimer banner on `/proof/aarav-mehta`: "Sample Candidate Profile — Illustrative demonstration preview. Real student proof profiles require verified opt-in." |
| **A8.1** | Server Judge | Solutions judged on client vs. server | **FALSE** | *Phase 3 Scope* | Server-side canonical test runner with hidden test suites scheduled for Phase 3. |
| **A8.2** | Readiness Formula | 8-factor formula claimed vs. 5-factor code | **FALSE** | *Phase 3 Scope* | Reconcile mathematical readiness documentation to exact 5-factor weights. |
| **A9.1** | OG Previews | `brand-mark.svg` social previews failing | **FALSE** | *Phase 4 Scope* | Generate 1200×630 PNG social card for WhatsApp and LinkedIn crawlers. |
| **A9.2** | Domain Canonical | `codeorbit.app` vs `getcodeorbit.vercel.app` | **UNVERIFIABLE** | *Phase 4 Scope* | Map custom domain DNS and redirect canonical URL. |
| **A10.1** | Legal Compliance | "GDPR and India IT Act aligned" | **FALSE** | *Phase 2 Scope* | Update legal notices to align explicitly with India's Digital Personal Data Protection (DPDP) Act, 2023. |
| **A10.2** | Upload Retention | Anonymous resume uploads data retention | **UNVERIFIABLE** | *Phase 2 Scope* | Add explicit memory-only volatile parsing disclaimers and auto-delete endpoints. |
| **A11.1** | Inconsistent Links | Homepage `/for-campuses/demo` vs Pricing `/for-recruiters` | **FALSE** | **RESOLVED** | Reconciled links so campus queries consistently route to `/for-campuses/demo` and recruiter queries route to `/for-recruiters`. |
| **A12.1** | Pricing Hypothesis | ₹1,499/mo subscription vs. student reality | **UNVERIFIABLE** | *Phase 1 Review* | Recommendation submitted to founder: Introduce ₹499 30-Day Sprint Pass alongside ₹1,499 Semester Pass. |
| **A13.1** | First Load Screen | "Preparing the workspace" suspense flash | **TRUE** | *Phase 4 Scope* | Stream critical hero elements to avoid blocking bots and slow mobile phones. |
| **A14.1** | Trademark | Name collisions with Orbit / CodeOrbit | **UNVERIFIABLE** | *Founder Review* | IP India Class 42 trademark search recommended. |

---

## 2. Automated Continuous Truth Verification

To prevent regressions, the automated script [`scripts/verify-truth-table.mjs`](file:///Users/vaibhavmaurya/Documents/New%20project/CodeOrbit/scripts/verify-truth-table.mjs) is now integrated into the workspace. It runs during CI and pre-commit checks:
- Fails with exit code 1 if "1,200+", "98.4%", "₹7–9 LPA", or "9 Localized" are introduced.
- Asserts that problem counts in UI match `packages/ui/src/data/mock-problems.ts` and `apps/web/src/data/prep-catalog.ts`.
