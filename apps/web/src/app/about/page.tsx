import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { trustPrinciples } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "About | CodeOrbit",
  description:
    "Learn why CodeOrbit is being built as an India-first verified developer hiring OS rather than a generic coding practice site.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">About CodeOrbit</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">We are building a hiring system, not another prep catalog.</h1>
            <p className="section-copy">
              CodeOrbit starts with practice because practice is still the clearest technical signal for many candidates.
              But the real product thesis is larger: turn that work into verified readiness, recruiter-safe applications,
              and better hiring outcomes for developers across India-first and global roles.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {trustPrinciples.map((item) => (
              <article key={item.title} className="surface-card p-5">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-soft">{item.description}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What we will not do</h2>
              <ul className="detail-list">
                <li>- We will not fabricate testimonials, employer logos, placement numbers, or guarantees.</li>
                <li>- We will not treat user data as default marketing collateral.</li>
                <li>- We will not confuse product depth with a bundle of disconnected tools.</li>
              </ul>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What we are building toward</h2>
              <ul className="detail-list">
                <li>- Better candidate proof through readiness graphs and public proof profiles.</li>
                <li>- Recruiter and campus filtering based on verified technical readiness.</li>
                <li>- Stronger links between practice, resumes, interviews, and applications.</li>
              </ul>
            </article>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
