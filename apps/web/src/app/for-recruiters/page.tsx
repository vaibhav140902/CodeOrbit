import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "For recruiters | CodeOrbit",
  description:
    "Request recruiter beta access for readiness-based candidate filtering, proof profiles, and India-first hiring workflows.",
  path: "/for-recruiters",
});

export default function RecruitersPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Recruiter beta</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Find candidates with verified technical readiness, not just polished claims.</h1>
            <p className="section-copy">
              CodeOrbit is preparing a recruiter beta built around readiness filtering, company-track alignment, recruiter-safe
              proof profiles, and clearer candidate quality before the first interview.
            </p>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What recruiter beta is designed to solve</h2>
              <ul className="detail-list">
                <li>- Too much resume polish and too little reliable technical signal.</li>
                <li>- Weak alignment between candidate prep and actual role expectations.</li>
                <li>- Little visibility into interview readiness before scheduling screens.</li>
                <li>- Need for privacy-safe proof that candidates can choose to share.</li>
              </ul>
              <div className="mt-6">
                <a href="/recruiter-beta" className="btn-secondary">
                  Preview authenticated beta
                </a>
              </div>
            </article>

            <WaitlistForm
              target="recruiters"
              heading="Request recruiter beta access"
              subheading="Tell us about your hiring team and what signal would make your screening workflow faster."
            />
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
