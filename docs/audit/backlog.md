# CodeOrbit Ranked Implementation Backlog & Roadmap

This backlog structures all remediation and feature tasks into 7 strictly ordered phases. Each phase contains concrete deliverables, risk reductions, and estimated working days for a solo-engineer pace.

---

### Phase Summary & Timeline Estimate

| Phase | Focus Area | Primary Deliverables | Estimated Working Days |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Truth & Trust** | Truth table zero-false certification, unified marketing config, real catalog counts, demo labeling. | **2 Days** |
| **Phase 2** | **Security & Compliance** | Server-side test case verification, DPDP Act 2023 disclosures, App Check, upload sandboxing. | **3 Days** |
| **Phase 3** | **Product Reliability** | Monaco IDE test runner rigor, 14 original problems verified, readiness score unit test suite. | **3 Days** |
| **Phase 4** | **Payment Gateway** | Live Razorpay UPI integration, webhook idempotency, CA invoice specs, test-mode purchasing. | **2 Days** |
| **Phase 5** | **SEO & Viral Growth** | 1200x630 PNG OpenGraph cards, company landing pages, sitemap, robots, analytics funnel. | **2 Days** |
| **Phase 6** | **B2B2C Campus Pilot** | TPO CSV batch onboarding, cohort analytics verification, recruiter opt-in filters, college pitch kit. | **3 Days** |
| **Phase 7** | **Launch Readiness** | Staging vs Production separation, GitHub Actions CI/CD, uptime probes, rollback runbook. | **2 Days** |
| **TOTAL** | **Full Commercial Launch** | **All 7 Phases Certified for Commercial Scale** | **17 Working Days** |

---

### Detailed Phase Backlog

#### Phase 1: Truth & Trust (Estimated: 2 Days)
- [ ] **Task 1.1:** Create a single source of truth configuration file (`apps/web/src/data/platform-config.ts`) defining plan names, prices, feature quotas, and catalog metrics.
- [ ] **Task 1.2:** Compute problem bank numbers dynamically from the catalog across the homepage, tracks, and prep pages (eliminating "1,200+").
- [ ] **Task 1.3:** Unify the commercial free vs. paid messaging ("Free core practice & ATS scoring · Paid upgrades for unlimited AI mocks & solutions").
- [ ] **Task 1.4:** Reconcile Interview Sprint messaging between homepage and pricing page (unify waitlist vs. instant checkout).
- [ ] **Task 1.5:** Purge developer debug notices from public pricing page.
- [ ] **Task 1.6:** Correct the company profile count from 9 to 8 in Resume Roaster and remove unverified salary claims ("₹7–9 LPA").
- [ ] **Task 1.7:** Add a clear "DEMO / SAMPLE PROFILE" badge to `/proof/aarav-mehta`.
- [ ] **Task 1.8:** Standardize recruiter and campus navigation links.
- [ ] **Done When:** Automated verification script passes with 0 false claims in the Truth Table, and any hardcoded discrepancy fails the build.

#### Phase 2: Security, Privacy & Compliance (Estimated: 3 Days)
- [ ] **Task 2.1:** Refactor `/api/platform/submit` to fetch hidden test cases from the server catalog by `problemId`, preventing client-side test forging.
- [ ] **Task 2.2:** Update bilingual consent banner and legal terms to reference India's Digital Personal Data Protection (DPDP) Act 2023.
- [ ] **Task 2.3:** Add explicit privacy disclosures on `/resume-roaster` regarding in-memory volatile parsing and zero-retention policies for anonymous files.
- [ ] **Task 2.4:** Configure Firebase App Check with reCAPTCHA Enterprise on the production domain.
- [ ] **Task 2.5:** Create a self-serve "Delete My Data / Revoke DPDP Consent" workflow for registered candidates.
- [ ] **Task 2.6:** Fix ESLint configuration (`.eslintignore`) and resolve non-breaking dependency warnings via `npm audit fix`.
- [ ] **Done When:** Security checklist in `security.md` is 100% closed and all verification suites pass without client test-forging loopholes.

#### Phase 3: Core Product Reliability (Estimated: 3 Days)
- [ ] **Task 3.1:** Audit all 14 Monaco IDE problems: verify original problem descriptions, boundary constraints, and reference solutions (Python, C++, Java, JS).
- [ ] **Task 3.2:** Write automated unit tests for the deterministic 5-factor Readiness Score calculation engine (`calculateReadinessScore`).
- [ ] **Task 3.3:** Standardize AI Mock Interview turn generation: add strict 10-turn limits for free users, graceful fallback when Gemini reaches rate limits.
- [ ] **Task 3.4:** Validate Resume Roaster against 20 synthetic sample resumes (10 PDF, 10 DOCX) to ensure score stability and intelligible feedback.
- [ ] **Task 3.5:** Mobile QA pass on low-end Android viewport (360x640), verifying touch targets, Monaco read-only fallback on mobile, and Hindi font rendering.
- [ ] **Done When:** All automated unit tests pass and a manual QA pass is completed on desktop and mobile viewports.

#### Phase 4: Payments & Monetization (Estimated: 2 Days)
- [ ] **Task 4.1:** Verify Razorpay India credentials in test mode, testing UPI Intent, QR, and Card payment flows end to end.
- [ ] **Task 4.2:** Harden webhook handler with replay protection and automatic entitlement sync to Supabase `subscriptions`.
- [ ] **Task 4.3:** Draft student-friendly refund and cancellation policy text for legal review.
- [ ] **Task 4.4:** Compile GST and invoicing requirements (HSN/SAC codes, reverse charge, B2C tax breakdowns) for CA consultation.
- [ ] **Done When:** Complete end-to-end test checkout activates Pro access in local/staging database, and webhook verification passes timing-safe checks.

#### Phase 5: SEO & Viral Growth (Estimated: 2 Days)
- [ ] **Task 5.1:** Replace SVG open-graph images with static 1200x630 PNG images for WhatsApp, LinkedIn, and Twitter card crawlers.
- [ ] **Task 5.2:** Ensure public pages (`/`, `/about`, `/pricing`, `/tracks`, `/roles/*`, `/companies/*`) are statically prerendered with proper meta tags.
- [ ] **Task 5.3:** Generate dynamic `sitemap.xml` and `robots.txt` indexing company tracks and public roles.
- [ ] **Task 5.4:** Optimize `/loading.tsx` to prevent full-screen suspense blocking on initial mobile crawl.
- [ ] **Done When:** OpenGraph previews render cleanly in social debuggers (LinkedIn Post Inspector, Twitter Card Validator) and sitemap indexes all public routes.

#### Phase 6: B2B2C Campus & Recruiter Expansion (Estimated: 3 Days)
- [ ] **Task 6.1:** Build self-serve TPO batch onboarding: allow college placement officers to upload student email CSVs and create a college cohort.
- [ ] **Task 6.2:** Verify that candidate search on `/for-recruiters` strictly filters for students who opted in via the DPDP recruiter-sharing consent toggle.
- [ ] **Task 6.3:** Assemble a 1-page institutional pilot kit for college principals and TPOs (demo data, mock placement drive overview, NIRF placement metrics).
- [ ] **Done When:** A simulated college cohort of 50 students can be onboarded and displayed on the TPO dashboard with accurate readiness analytics.

#### Phase 7: Launch Readiness & Observability (Estimated: 2 Days)
- [ ] **Task 7.1:** Separate staging and production environments: connect Supabase production PostgreSQL and verify table migrations.
- [ ] **Task 7.2:** Set up uptime probes and error monitoring that store zero personal data.
- [ ] **Task 7.3:** Configure Gemini API and Judge0 cost alerts in Google Cloud and server dashboards.
- [ ] **Task 7.4:** Document rollback runbooks and backup/restore procedures for disaster recovery.
- [ ] **Done When:** Complete launch checklist is green and signed off by the solo founder.
