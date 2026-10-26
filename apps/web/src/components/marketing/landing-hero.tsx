import { BRAND, Button, SectionReveal, SurfaceCard } from "@codeorbit/ui";
import Link from "next/link";

const stats = [
  { label: "Problems", value: "50+" },
  { label: "AI Flows", value: "5+" },
  { label: "Metrics", value: "Live" },
];

export function LandingHero() {
  return (
    <SectionReveal>
      <SurfaceCard className="mb-6 overflow-hidden p-5 sm:p-6 md:mb-8 md:p-10" animated={true}>
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              {BRAND.tagline}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Build interview confidence with <span className="brand-gradient">{BRAND.name}</span>
            </h1>
            <p className="text-muted mt-4 max-w-xl text-base sm:text-lg">
              Welcome Coder. Follow curated company-first tracks, unlock AI coaching, and move from practice to job-ready execution.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <Button asChild variant="primary">
                <Link href="/problems">Start solving</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/prep">Explore prep tracks</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/mock-interview">Start mock interview</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/resume-builder">Build resume</Link>
              </Button>
            </div>
          </div>

          <div className="surface-soft p-4 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              Snapshot
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-xl border border-[color:var(--border)] p-3">
                  <p className="text-muted text-xs">{item.label}</p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-muted mt-4 text-sm">Keep submitting to improve score, rank, streak, interview readiness, and ATS resume quality.</p>
          </div>
        </div>
      </SurfaceCard>
    </SectionReveal>
  );
}
