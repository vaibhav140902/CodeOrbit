import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { PricingOverview } from "@/components/pricing/pricing-overview";
import { WaitlistForm } from "@/components/site/waitlist-form";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Pricing | CodeOrbit",
  description:
    "Choose a trustworthy pricing path for verified readiness, resume variants, interview practice, and recruiter or campus beta access.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Pricing</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Pricing built around hiring outcomes, not throwaway unlocks.</h1>
            <p className="section-copy">
              CodeOrbit is priced as a system for verified readiness, recruiter-safe applications, and interview workflows.
              No fabricated placements, no fake urgency, and no confusing add-on maze.
            </p>
          </section>

          <div id="secure-pricing">
            <PricingOverview />
          </div>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What you are paying for</h2>
              <ul className="detail-list">
                <li>- Company and role tracks with freshness, round type, and source confidence.</li>
                <li>- A readiness model that connects solving quality with application quality.</li>
                <li>- Resume variants, proof profiles, mock interviews, and job workflow support.</li>
                <li>- Foundations for recruiter and campus products without forcing candidate oversharing.</li>
              </ul>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Trust notes</h2>
              <ul className="detail-list">
                <li>- CodeOrbit does not fabricate placements, salary outcomes, or employer endorsements.</li>
                <li>- Recruiter and campus plans are beta-access routes and are clearly labeled that way.</li>
                <li>- Public proof sharing is opt-in. Private preparation remains the default mode.</li>
              </ul>
            </article>
          </section>

          <div id="secure-pricing">
            <PricingOverview />
          </div>

          <div id="interview-sprint-form">
            <WaitlistForm
              target="interview-sprint"
              heading="Interview Sprint waitlist"
              subheading="Tell us when your interview season starts and what kind of sprint support would make the biggest difference."
            />
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
