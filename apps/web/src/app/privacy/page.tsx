import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "DPDP Privacy Policy | CodeOrbit",
  description:
    "Learn how CodeOrbit complies with India's Digital Personal Data Protection (DPDP) Act 2023, volatile resume parsing, authenticated telemetry, and data erasure rights.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-8">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">India DPDP Act 2023 Aligned</span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Candidate Data Privacy Policy</h1>
            <p className="section-copy mt-2">
              CodeOrbit operates as a Data Fiduciary under India&apos;s Digital Personal Data Protection (DPDP) Act 2023.
              This policy explains how candidate data is collected, processed in volatile memory, secured in Indian cloud regions, and purged upon request.
            </p>
            <p className="mt-3 text-xs text-muted">
              Effective Date: 1 January 2026 · Last Updated: 5 November 2026
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="surface-card p-6 space-y-3">
              <h2 className="text-xl font-bold">1. What We Collect &amp; Process</h2>
              <ul className="detail-list text-xs space-y-2">
                <li>
                  <strong className="text-[color:var(--text-main)]">Account Basics:</strong> Name, verified email address, and authentication UID provided via Google Sign-In or Firebase Auth.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Code &amp; Execution Telemetry:</strong> Code solutions submitted to the Monaco IDE and verified on Judge0 sandboxes (execution time, test case pass rate).
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">AI Interview Transcripts:</strong> Audio-to-text transcripts generated during mock interview sessions, evaluated by Google Gemini for technical rubrics.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Anonymous Resume Roaster:</strong> When evaluated without an account, resumes are parsed in volatile server RAM only and are <span className="text-emerald-400 font-semibold">never written to persistent disk or databases</span>.
                </li>
              </ul>
            </article>

            <article className="surface-card p-6 space-y-3">
              <h2 className="text-xl font-bold">2. Specific Purpose of Processing</h2>
              <ul className="detail-list text-xs space-y-2">
                <li>
                  <strong className="text-[color:var(--text-main)]">Readiness Scoring:</strong> Computing objective topic mastery and company-track fit (Amazon, Google, TCS Digital, Infosys SP).
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Socratic AI Feedback:</strong> Providing hints, runtime complexity analysis, and behavioral interview coaching.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Verified Proof Badges:</strong> Generating tamper-resistant public candidate badges only when explicitly published by the candidate.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">No Data Sales:</strong> CodeOrbit never sells, rents, or licenses candidate personal data to advertising networks or third-party brokers.
                </li>
              </ul>
            </article>
          </section>

          <section className="surface-card p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold">3. Data Principal Rights (DPDP Act 2023)</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)]">
                <h3 className="text-sm font-semibold text-cyan-400">Right to Access (Sec. 11)</h3>
                <p className="mt-1 text-xs text-soft">
                  View and export all personal telemetry, code submissions, and mock interview reports directly from your dashboard.
                </p>
              </div>

              <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)]">
                <h3 className="text-sm font-semibold text-cyan-400">Right to Erasure (Sec. 12)</h3>
                <p className="mt-1 text-xs text-soft">
                  Instantly purge all account records, submissions, and telemetry using the &quot;Delete My Data &amp; Account&quot; button in your dashboard.
                </p>
              </div>

              <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)]">
                <h3 className="text-sm font-semibold text-cyan-400">Right to Grievance (Sec. 13)</h3>
                <p className="mt-1 text-xs text-soft">
                  Direct inquiries to our Data Protection Grievance Officer at{" "}
                  <a href="mailto:privacy@codeorbit.app" className="underline text-cyan-400">
                    privacy@codeorbit.app
                  </a>.
                </p>
              </div>
            </div>
          </section>

          <section className="surface-card p-6 space-y-4">
            <h2 className="text-xl font-bold">4. Cloud Infrastructure &amp; Security Standards</h2>
            <p className="text-xs text-soft leading-relaxed">
              CodeOrbit hosts services within the Asia-South2 (India) region using Google Cloud / Firebase and Supabase PostgreSQL with Row Level Security (RLS). All network traffic is encrypted via TLS 1.3, and server-side secrets are strictly restricted to authenticated execution environments.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              <Link href="/terms" className="btn-secondary text-xs">
                View Terms of Service →
              </Link>
              <Link href="/signup" className="btn-primary text-xs">
                Create DPDP-Protected Account →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
