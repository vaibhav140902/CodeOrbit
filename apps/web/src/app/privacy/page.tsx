import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Privacy | CodeOrbit",
  description:
    "Learn how CodeOrbit approaches privacy, AI processing consent, authenticated access, and public proof sharing.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Privacy</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Privacy-aware by default.</h1>
            <p className="section-copy">
              CodeOrbit is designed so candidates can prepare privately, choose when to share proof publicly, and understand
              when AI-assisted or analytics-related processing is taking place.
            </p>
          </section>
          <section className="grid gap-4 xl:grid-cols-2">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What we store</h2>
              <ul className="detail-list">
                <li>- Authenticated account basics needed to secure the workspace.</li>
                <li>- Practice, interview, resume, and application data needed to provide product features.</li>
                <li>- Consent-aware preference data for locale and privacy controls.</li>
              </ul>
            </article>
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What stays opt-in</h2>
              <ul className="detail-list">
                <li>- Public proof-profile sharing.</li>
                <li>- Any non-essential AI or analytics emphasis beyond core product operation.</li>
                <li>- Recruiter- or campus-facing sharing beyond user intent.</li>
              </ul>
            </article>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
