import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Terms | CodeOrbit",
  description:
    "Review the current CodeOrbit product and beta-access terms for developer, recruiter, and campus usage.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Terms</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Clear terms for candidates and beta partners.</h1>
            <p className="section-copy">
              CodeOrbit is a software product that helps candidates prepare, generate proof, and manage hiring workflows.
              Beta recruiter and campus features may evolve, but they remain governed by the same core expectations:
              truthful usage, lawful access, and respect for privacy choices.
            </p>
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Usage expectations</h2>
              <ul className="detail-list">
                <li>- Do not use the product to misrepresent your experience or another person’s work.</li>
                <li>- Do not attempt to bypass access controls, billing checks, or secure product boundaries.</li>
                <li>- Beta workflows may change as recruiter and campus products mature.</li>
              </ul>
            </article>
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Service notes</h2>
              <ul className="detail-list">
                <li>- Company tracks are editorially curated and do not imply employer endorsement.</li>
                <li>- Product access may depend on valid credentials, environment configuration, or beta approval.</li>
                <li>- Exported or shared candidate materials remain the candidate’s responsibility to review before submission.</li>
              </ul>
            </article>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
