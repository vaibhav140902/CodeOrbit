import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { StructuredData } from "@/components/site/structured-data";
import {
  companyDirectory,
  faqItems,
  publicPricingTiers,
  publicProofProfiles,
  readinessDimensions,
  trustPrinciples,
} from "@/data/hiring-os";
import { PREP_QUESTIONS } from "@/data/prep-catalog";
import { PLATFORM_METRICS, HONEST_MARKETING_CLAIMS } from "@/data/platform-config";
import { organizationJsonLd, websiteJsonLd } from "@/lib/site-config";

const featuredProblems = PREP_QUESTIONS.slice(0, 4);

const pillars = [
  {
    icon: "⚡",
    badge: "Monaco DSA Studio",
    title: "Multi-Language Coding IDE",
    description:
      "Full Monaco code editor with real-time test execution, multi-language support (Python, JS, C++, Java), and Socratic AI hints that guide without spoiling solutions.",
    cta: "Solve Problems Now",
    href: "/problems",
    pillColor: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  },
  {
    icon: "🔥",
    badge: "Free Viral Tool",
    title: "AI Resume Roaster & ATS Scorer",
    description:
      "Instant drag-and-drop parsing for PDF & DOCX. Get a brutal 0–100 ATS readiness score, buzzword redlining, and quantifiable bullet rewrites in 3 seconds.",
    cta: "Roast Your Resume Free",
    href: "/resume-roaster",
    pillColor: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
  {
    icon: "🎙️",
    badge: "Voice & Speech",
    title: "Socratic AI Mock Interviews",
    description:
      "Simulate high-pressure technical and behavioral rounds. Tracks transcripts, filler words, technical depth, and provides actionable rubric feedback with memory.",
    cta: "Start Voice Interview",
    href: "/mock-interview",
    pillColor: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  },
  {
    icon: "🏫",
    badge: "B2B Campus Portal",
    title: "Institutional TPO Command Center",
    description:
      "Automated batch analytics, proctored campus placement contests, AI anti-cheat shields, and verified proof profiles that eliminate fraudulent resumes.",
    cta: "Explore Campus Demo",
    href: "/for-campuses/demo",
    pillColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
];

const platformStats = [
  {
    value: `${PLATFORM_METRICS.interactiveProblemCount}`,
    label: "Interactive Challenges",
    sub: `${PLATFORM_METRICS.curriculumQuestionCount} Company Prompts`,
  },
  {
    value: "Isolated",
    label: "Judge0 Code Runner",
    sub: `${PLATFORM_METRICS.supportedLanguages.join(", ")}`,
  },
  {
    value: "Direct",
    label: "ATS Document Parser",
    sub: "PDF & DOCX Plaintext Extraction",
  },
  {
    value: "Free Core",
    label: "Public Practice",
    sub: "Pro Upgrades for Live AI Mocks",
  },
];

export default function HomePage() {
  return (
    <AppFrame>
      <StructuredData data={[organizationJsonLd, websiteJsonLd]} />
      <div className="app-shell">
        <div className="page-container space-y-12 sm:space-y-16">
          {/* HERO SECTION */}
          <section className="surface-card hero-orbit relative overflow-hidden rounded-3xl border border-[color:var(--border)] p-6 sm:p-10 lg:p-14 shadow-2xl">
            <div className="relative z-10 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Next-Gen Technical Career & Placement OS</span>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-[1.08] text-[color:var(--text-main)]">
                Crack SDE-1 Drives &amp; Campus Placements with{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                  Verified Proof.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-soft sm:text-lg">
                Stop applying with blind hope and generic templates. CodeOrbit combines a full Monaco DSA IDE, an instant
                AI Resume Roaster with ATS scoring, Socratic AI voice mocks, and campus placement portals into one seamless platform.
              </p>

              {/* ACTION BUTTONS */}
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/resume-roaster"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110 active:scale-95"
                >
                  <span>🔥 Roast My Resume Free</span>
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-mono uppercase">ATS Score</span>
                </Link>

                <Link
                  href="/problems/two-sum"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-6 py-3.5 text-sm font-bold text-[color:var(--text-main)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] active:scale-95"
                >
                  <span>⚡ Solve Two Sum in IDE</span>
                </Link>

                <Link
                  href="/for-campuses/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[color:var(--border)] px-5 py-3.5 text-sm font-medium text-muted transition hover:text-[color:var(--text-main)]"
                >
                  <span>🏫 Campus TPO Demo</span>
                </Link>
              </div>

              {/* STATS STRIP */}
              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[color:var(--border)]/60 pt-8 sm:grid-cols-4">
                {platformStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-black tracking-tight sm:text-3xl text-[color:var(--text-main)]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-soft">{stat.label}</p>
                    <p className="text-[11px] text-muted">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4 CORE PILLARS SHOWCASE */}
          <section className="space-y-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <span className="eyebrow-chip">Platform Capabilities</span>
                <h2 className="section-heading mt-3 text-3xl font-bold">Everything you need to get hired.</h2>
              </div>
              <p className="text-sm text-muted sm:max-w-md">
                Designed specifically for Indian engineering freshers, tier-2/3 college drives, and off-campus SDE-1 sprints.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {pillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="surface-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[color:var(--border)] p-6 sm:p-8 transition hover:border-[color:var(--accent)] hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-3xl">{pillar.icon}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${pillar.pillColor}`}>
                        {pillar.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-[color:var(--text-main)]">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-soft">{pillar.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[color:var(--border)]/50">
                    <Link
                      href={pillar.href}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)] group-hover:underline"
                    >
                      <span>{pillar.cta}</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* FEATURED PROBLEMS QUICK-START */}
          <section className="surface-card rounded-2xl border border-[color:var(--border)] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-[color:var(--border)] pb-6">
              <div>
                <span className="eyebrow-chip">Live Practice Sandbox</span>
                <h2 className="section-heading mt-2 text-2xl font-bold">Featured DSA Problems</h2>
                <p className="text-sm text-soft mt-1">
                  Jump straight into the Monaco editor with preloaded starter templates and unit test suites.
                </p>
              </div>
              <Link href="/problems" className="btn-secondary text-xs sm:text-sm self-start sm:self-auto">
                Explore Full Bank ({PLATFORM_METRICS.curriculumQuestionCount} curated questions) →
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {featuredProblems.map((prob) => (
                <div
                  key={prob.slug}
                  className="surface-soft flex flex-col justify-between rounded-xl p-5 border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          prob.difficulty === "Easy"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : prob.difficulty === "Medium"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                      <div className="flex gap-1.5">
                        {prob.companies.slice(0, 3).map((comp) => (
                          <span
                            key={comp}
                            className="rounded-md border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-2 py-0.5 text-[10px] text-muted font-medium"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-[color:var(--text-main)]">{prob.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {prob.topics.map((t) => (
                        <span key={t} className="text-xs text-soft">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[color:var(--border)]/40 flex items-center justify-between">
                    <span className="text-xs text-muted font-mono">0ms Local Eval</span>
                    <Link
                      href={`/problems/${prob.slug}`}
                      className="rounded-lg bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[color:var(--text-main)] hover:bg-[color:var(--accent)] hover:text-black transition"
                    >
                      Solve in IDE ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TARGETED COMPANY TRACKS */}
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="surface-card rounded-2xl border border-[color:var(--border)] p-6 sm:p-8">
              <span className="eyebrow-chip">Targeted Company Tracks</span>
              <h2 className="section-heading mt-4 text-2xl font-bold">
                Company-Specific Hiring Blueprints for India &amp; Global SDE.
              </h2>
              <p className="section-copy mt-2 text-sm leading-7 text-soft">
                Stop solving random problems blindly. CodeOrbit curates questions based on exact patterns tested in
                recent online assessments (OA) and technical rounds at top product companies and tier-1 Indian drives.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {companyDirectory.slice(0, 10).map((company) => (
                  <Link
                    key={company.slug}
                    href={`/companies/${company.slug}`}
                    className="metric-pill text-xs font-semibold hover:border-[color:var(--accent)] transition"
                  >
                    🏢 {company.name}
                  </Link>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-main)]">
                      Did You Know?
                    </p>
                    <p className="text-xs text-soft mt-0.5">
                      {HONEST_MARKETING_CLAIMS.atsScreenContext}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Link href="/resume-roaster" className="btn-secondary text-xs w-full text-center block">
                    Check Your ATS Match Score Now Free →
                  </Link>
                </div>
              </div>
            </article>

            {/* PUBLIC PROOF LAYER */}
            <article className="surface-card rounded-2xl border border-[color:var(--border)] p-6 sm:p-8">
              <span className="eyebrow-chip">Verified Proof Layer</span>
              <h2 className="section-heading mt-4 text-2xl font-bold">
                Portfolios Built from Real Code, Not Vanity Claims.
              </h2>
              <p className="section-copy mt-2 text-sm leading-7 text-soft">
                Recruiters are fatigued by exaggerated resumes. CodeOrbit gives candidates a verifiable proof profile
                linking directly to their authenticated problem solutions, interview transcripts, and ATS scores.
              </p>

              <div className="mt-6 space-y-3">
                {publicProofProfiles.slice(0, 2).map((profile) => (
                  <div key={profile.handle} className="surface-soft rounded-xl p-4 border border-[color:var(--border)]/50">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[color:var(--text-main)]">{profile.fullName}</h3>
                        <p className="text-xs text-soft">{profile.headline}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          {profile.readiness.overallScore} Readiness
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted pt-2 border-t border-[color:var(--border)]/30">
                      <span>{profile.solvedCount} Solved</span>
                      <span>{profile.streakDays}-day streak</span>
                      <Link href={`/proof/${profile.handle}`} className="link-subtle text-xs font-bold">
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* TRUST PRINCIPLES */}
          <section className="grid gap-4 lg:grid-cols-3">
            {trustPrinciples.map((item) => (
              <article key={item.title} className="surface-card rounded-2xl border border-[color:var(--border)] p-6">
                <span className="font-mono text-xs uppercase tracking-wider text-muted font-bold">Trust Principle</span>
                <h3 className="mt-3 text-lg font-bold text-[color:var(--text-main)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soft">{item.description}</p>
              </article>
            ))}
          </section>

          {/* PRICING PREVIEW */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="eyebrow-chip">Transparent Pricing</span>
              <h2 className="section-heading mt-3 text-3xl font-bold">Simple, honest plans for every stage.</h2>
              <p className="text-sm text-soft mt-2">
                Start 100% free with core problems and resume roasting. Upgrade when you need advanced AI voice mocks and campus placement cohorts.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {publicPricingTiers.map((tier) => (
                <article
                  key={tier.id}
                  className={`surface-card flex flex-col justify-between rounded-2xl border p-6 ${
                    tier.spotlight
                      ? "border-emerald-500/60 shadow-xl shadow-emerald-500/5 bg-[color:var(--bg-elevated)]"
                      : "border-[color:var(--border)]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
                        {tier.cadence}
                      </span>
                      {tier.spotlight && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-xl font-bold">{tier.title}</h3>
                    <p className="mt-2 text-2xl font-black text-[color:var(--text-main)]">{tier.priceLabel}</p>
                    <p className="mt-2 text-xs leading-relaxed text-soft">{tier.description}</p>
                    <ul className="mt-4 space-y-2 text-xs text-soft border-t border-[color:var(--border)]/40 pt-4">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4">
                    <Link
                      href={
                        tier.id === "free"
                          ? "/signup"
                          : tier.id === "pro"
                            ? "/pricing"
                            : tier.id === "interview-sprint"
                              ? "/pricing#interview-sprint"
                              : "/for-campuses/demo"
                      }
                      className={`w-full block text-center py-2.5 rounded-xl text-xs font-bold transition ${
                        tier.spotlight ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="surface-card rounded-2xl border border-[color:var(--border)] p-6 sm:p-8">
            <span className="eyebrow-chip">Frequently Asked Questions</span>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {faqItems.map((item) => (
                <article key={item.question} className="surface-soft rounded-xl p-5 border border-[color:var(--border)]/40">
                  <h3 className="text-base font-bold text-[color:var(--text-main)]">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-soft">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
