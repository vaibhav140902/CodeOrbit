import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { buildMetadata } from "@/lib/site-config";
import { COMMERCIAL_PLANS } from "@/data/platform-config";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service | CodeOrbit",
  description:
    "Review CodeOrbit's terms of service, billing policies, user code intellectual property, and candidate placement disclaimer.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-8">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Terms of Service</span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Platform Agreement &amp; Billing Terms</h1>
            <p className="section-copy mt-2">
              Welcome to CodeOrbit. By accessing our Monaco coding IDE, Resume Roaster, or AI Mock Interview features,
              you agree to these Terms of Service.
            </p>
            <p className="mt-3 text-xs text-muted">
              Effective Date: 1 January 2026 · Last Updated: 5 November 2026
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="surface-card p-6 space-y-3">
              <h2 className="text-xl font-bold">1. Candidate Code &amp; Intellectual Property</h2>
              <ul className="detail-list text-xs space-y-2">
                <li>
                  <strong className="text-[color:var(--text-main)]">User Ownership:</strong> You retain 100% intellectual property ownership of all code, algorithms, and resume text you write or submit on CodeOrbit.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Platform Evaluation License:</strong> You grant CodeOrbit a limited license solely to compile, execute on Judge0 sandboxes, and evaluate your submissions for readiness scoring.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Copyright Compliance:</strong> Curated editorial tracks are created for educational preparation. Company names and trademarks belong to their respective holders and do not indicate official company affiliation.
                </li>
              </ul>
            </article>

            <article className="surface-card p-6 space-y-3">
              <h2 className="text-xl font-bold">2. Billing &amp; Subscription Terms</h2>
              <ul className="detail-list text-xs space-y-2">
                <li>
                  <strong className="text-[color:var(--text-main)]">Commercial Pricing:</strong> CodeOrbit offers optional paid tiers including {COMMERCIAL_PLANS.pro.title} ({COMMERCIAL_PLANS.pro.priceLabel} {COMMERCIAL_PLANS.pro.cadence}) and {COMMERCIAL_PLANS.interviewSprint.title} ({COMMERCIAL_PLANS.interviewSprint.priceLabel}).
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Payment Processing:</strong> Transactions are securely handled in Indian Rupees (INR) via Razorpay with encrypted payment verification.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Cancellation &amp; Refunds:</strong> Monthly recurring subscriptions can be canceled anytime with immediate effect. Refund requests for technical service failures can be submitted to billing@codeorbit.app within 48 hours of purchase.
                </li>
              </ul>
            </article>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="surface-card p-6 space-y-3">
              <h2 className="text-xl font-bold">3. Acceptable Use &amp; Prohibited Conduct</h2>
              <ul className="detail-list text-xs space-y-2">
                <li>
                  <strong className="text-[color:var(--text-main)]">No Sandbox Exploitation:</strong> You must not attempt to escape Judge0 container sandboxes, perform denial-of-service attacks, or bypass API rate limits.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Authentication Integrity:</strong> Account sharing, automated token spoofing, or submitting plagiarized code on proctored assessments is strictly prohibited.
                </li>
                <li>
                  <strong className="text-[color:var(--text-main)]">Account Termination:</strong> CodeOrbit reserves the right to suspend accounts found engaging in fraudulent submissions or security evasion.
                </li>
              </ul>
            </article>

            <article className="surface-card p-6 space-y-3">
              <h2 className="text-xl font-bold">4. Placement Disclaimer</h2>
              <p className="text-xs text-soft leading-relaxed">
                CodeOrbit provides technical preparation, objective readiness scoring, and interview practice tools.
                While designed to maximize campus placement readiness for Tier-1/2/3 colleges, CodeOrbit does not guarantee employment, offer letters, or interview calls from specific third-party companies.
              </p>
              <div className="pt-3">
                <Link href="/privacy" className="text-xs text-cyan-400 underline hover:text-cyan-300">
                  Read our DPDP Act 2023 Privacy Policy →
                </Link>
              </div>
            </article>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
