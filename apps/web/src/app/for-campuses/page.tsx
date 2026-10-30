import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "For campuses | CodeOrbit",
  description:
    "Request campus beta access for placement teams that want readiness visibility, proof profiles, and stronger candidate alignment.",
  path: "/for-campuses",
});

export default function CampusesPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Campus beta</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Give placement teams a better way to identify ready candidates.</h1>
            <p className="section-copy">
              CodeOrbit’s campus beta is designed for colleges and placement cells that want structured readiness, role
              alignment, and recruiter-safe proof without forcing students into manual tracking spreadsheets.
            </p>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Campus workflow goals</h2>
              <ul className="detail-list">
                <li>- Surface students who are actually ready for specific company and role patterns.</li>
                <li>- Reduce noisy self-reporting with clearer readiness and proof-profile signals.</li>
                <li>- Support bilingual English and Hindi candidate workflows where useful.</li>
                <li>- Build a bridge from preparation to applications, interviews, and outcomes.</li>
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="/for-campuses/demo" className="btn-primary text-xs font-semibold py-2 px-4">
                  Launch Interactive TPO Demo ↗
                </a>
                <a href="/campus-beta" className="btn-secondary text-xs font-semibold py-2 px-4">
                  Authenticated Portal
                </a>
              </div>
            </article>

            <WaitlistForm
              target="campuses"
              heading="Request campus beta access"
              subheading="Share your placement workflow and where better technical-readiness visibility would help."
            />
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
