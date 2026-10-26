import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { StructuredData } from "@/components/site/structured-data";
import {
  companyDirectory,
  faqItems,
  publicPricingTiers,
  publicProofProfiles,
  readinessDimensions,
  trackItems,
  trustPrinciples,
} from "@/data/hiring-os";
import { organizationJsonLd, websiteJsonLd } from "@/lib/site-config";

const howItWorks = [
  "Practice with structured company and role tracks.",
  "Convert performance into a verified readiness score.",
  "Turn that score into recruiter-safe resumes and proof profiles.",
  "Run mock interviews and track improvement over time.",
  "Apply with readiness-matched jobs instead of guessing.",
  "Give recruiters and campuses a cleaner proof layer to review.",
];

export default function HomePage() {
  return (
    <AppFrame>
      <StructuredData data={[organizationJsonLd, websiteJsonLd]} />
      <div className="app-shell">
        <div className="page-container space-y-6 sm:space-y-8">
          <section className="surface-card hero-orbit overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <span className="eyebrow-chip">India-first verified developer hiring OS</span>
                <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Turn practice into proof, proof into applications, and applications into offers.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-soft sm:text-lg">
                  CodeOrbit helps developers show technical readiness, build recruiter-safe applications, and convert prep
                  into real hiring outcomes across India-first and global roles.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="btn-primary">
                    Start readiness assessment
                  </Link>
                  <Link href="/tracks" className="btn-secondary">
                    Explore company tracks
                  </Link>
                  <Link href="/proof/aarav-mehta" className="btn-ghost">
                    View proof profile
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="surface-soft p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Verified readiness</p>
                  <p className="mt-3 text-4xl font-bold">82</p>
                  <p className="mt-2 text-sm leading-7 text-soft">
                    A hiring score built from topic mastery, mock interviews, resume fit, and project evidence.
                  </p>
                </div>
                <div className="surface-soft p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Recruiter-safe proof</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-soft">
                    <li>- Public profile links are opt-in and privacy-aware.</li>
                    <li>- Resume variants stay tied to role and company intent.</li>
                    <li>- Applications are matched against readiness, not hype.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            {trustPrinciples.map((item) => (
              <article key={item.title} className="surface-card p-5">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Trust signal</p>
                <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-soft">{item.description}</p>
              </article>
            ))}
          </section>

          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">How it works</span>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {howItWorks.map((item, index) => (
                <article key={item} className="surface-soft p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Step {index + 1}</p>
                  <p className="mt-3 text-base leading-7 text-soft">{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <article className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Company tracks 2.0</span>
              <h2 className="section-heading mt-5">Role, round, freshness, and India relevance in one view.</h2>
              <p className="section-copy">
                Instead of random question sets, tracks are organized by company, role, round type, topic, source
                confidence, and freshness. That gives candidates a tighter loop and gives future recruiter products a
                cleaner readiness signal.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {companyDirectory.slice(0, 8).map((company) => (
                  <Link key={company.slug} href={`/companies/${company.slug}`} className="metric-pill text-sm font-semibold">
                    {company.name}
                  </Link>
                ))}
              </div>
            </article>

            <div className="grid gap-3">
              {trackItems.slice(0, 4).map((track) => (
                <article key={track.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{track.companySlug.replace(/-/g, " ")}</span>
                    <span>-</span>
                    <span>{track.roleSlug.replace(/-/g, " ")}</span>
                    <span>-</span>
                    <span>{track.roundType}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{track.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-soft">{track.explanation}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.topic}</span>
                    <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">
                      {track.sourceConfidence}
                    </span>
                    <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">
                      {track.signal ?? "high-frequency"}
                    </span>
                    <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">
                      {track.geographyRelevance}
                    </span>
                  </div>
                  {track.problemId ? (
                    <div className="mt-4">
                      <Link href={`/problems/${track.problemId}`} className="link-subtle text-xs">
                        Open question
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <article className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Verified readiness</span>
              <h2 className="section-heading mt-5">A score recruiters can interpret and candidates can improve.</h2>
              <p className="section-copy">
                CodeOrbit turns practice quality, interview performance, resume fit, and project evidence into one
                readiness graph. It is designed to explain why a candidate is ready, not just whether they solved enough problems.
              </p>
              <div className="mt-6 space-y-4">
                {readinessDimensions.map((dimension) => (
                  <div key={dimension.key}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{dimension.label}</p>
                      <p className="text-xs text-muted">{dimension.weight}% weight</p>
                    </div>
                    <p className="mt-1 text-sm leading-7 text-soft">{dimension.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/readiness-score" className="btn-secondary">
                  See readiness model
                </Link>
              </div>
            </article>

            <article className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Proof profile</span>
              <h2 className="section-heading mt-5">Portfolios built from real prep, not vanity pages.</h2>
              <p className="section-copy">
                The public proof layer shows solved volume, readiness scores, top topics, interview streak, projects,
                and downloadable resumes in one recruiter-safe view.
              </p>
              <div className="mt-6 space-y-3">
                {publicProofProfiles.map((profile) => (
                  <div key={profile.handle} className="surface-soft p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{profile.fullName}</h3>
                        <p className="mt-1 text-sm text-soft">{profile.headline}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted">Readiness</p>
                        <p className="text-2xl font-bold">{profile.readiness.overallScore}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="surface-card p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted">Solved</p>
                        <p className="mt-2 text-xl font-semibold">{profile.solvedCount}</p>
                      </div>
                      <div className="surface-card p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted">Best topics</p>
                        <p className="mt-2 text-sm font-semibold">{profile.topTopics.slice(0, 2).join(", ")}</p>
                      </div>
                      <div className="surface-card p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted">Streak</p>
                        <p className="mt-2 text-xl font-semibold">{profile.streakDays} days</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href={`/proof/${profile.handle}`} className="link-subtle">
                        Open public profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Resume and portfolio OS</span>
              <h2 className="section-heading mt-5">Build role-specific resumes from real work signals.</h2>
              <p className="section-copy">
                Import a JD, create recruiter-safe resume variants, score ATS fit, generate LaTeX, and turn project plus interview data into
                better application assets. Built for India-first fresher and early-career hiring, not generic templates.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/resume" className="btn-secondary">
                  Explore resume OS
                </Link>
                <Link href="/signup" className="btn-ghost">
                  Create your first variant
                </Link>
              </div>
            </article>
            <article className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Interview OS</span>
              <h2 className="section-heading mt-5">Practice technical and behavioral rounds with memory.</h2>
              <p className="section-copy">
                Mock interviews track transcripts, structure, filler words, clarity, score trends, and retry history so
                candidates can compare sessions over time rather than rehearse in isolation.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/mock-interview" className="btn-secondary">
                  Explore interview OS
                </Link>
                <Link href="/pricing" className="btn-ghost">
                  Compare plans
                </Link>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">For recruiters</span>
              <h2 className="section-heading mt-5">Filter candidates by verified readiness, not just polished resumes.</h2>
              <p className="section-copy">
                Recruiter beta pages are designed around verified proof profiles, role alignment, readiness filtering, and
                privacy-safe candidate sharing.
              </p>
              <div className="mt-6">
                <Link href="/for-recruiters" className="btn-secondary">
                  Recruiter beta
                </Link>
              </div>
            </article>
            <article className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">For campuses</span>
              <h2 className="section-heading mt-5">Give placement teams a cleaner way to surface ready candidates.</h2>
              <p className="section-copy">
                Campus beta flows are designed for placement cells that want stronger readiness visibility without forcing
                students into manual reporting.
              </p>
              <div className="mt-6">
                <Link href="/for-campuses" className="btn-secondary">
                  Campus beta
                </Link>
              </div>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            {publicPricingTiers.map((tier) => (
              <article
                key={tier.id}
                className={`surface-card p-6 ${tier.spotlight ? "border-[color:var(--accent)]" : ""}`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{tier.cadence}</p>
                <h2 className="mt-3 text-2xl font-semibold">{tier.title}</h2>
                <p className="mt-3 text-xl font-bold">{tier.priceLabel}</p>
                <p className="mt-3 text-sm leading-7 text-soft">{tier.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-soft">
                  {tier.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href={
                      tier.id === "free"
                        ? "/signup"
                        : tier.id === "pro"
                          ? "/pricing"
                          : tier.id === "interview-sprint"
                            ? "/pricing#interview-sprint"
                            : "/for-recruiters"
                    }
                    className={tier.spotlight ? "btn-primary" : "btn-secondary"}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </article>
            ))}
          </section>

          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">FAQ</span>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {faqItems.map((item) => (
                <article key={item.question} className="surface-soft p-5">
                  <h2 className="text-lg font-semibold">{item.question}</h2>
                  <p className="mt-3 text-sm leading-7 text-soft">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
