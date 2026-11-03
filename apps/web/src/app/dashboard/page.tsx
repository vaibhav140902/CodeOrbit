import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardSpotlight } from "@/components/dashboard/dashboard-spotlight";
import { AppFrame } from "@/components/layout/app-frame";
import { jobWorkflowPreview, publicProofProfiles } from "@/data/hiring-os";

const quickActions = [
  {
    title: "Solve from tracks",
    href: "/tracks",
    description: "Pick a company or role path and move your readiness score with intent.",
  },
  {
    title: "Update resume variant",
    href: "/resume-builder",
    description: "Generate recruiter-safe resume variants mapped to a specific role or company.",
  },
  {
    title: "Run mock interview",
    href: "/mock-interview",
    description: "Capture a new session and compare the score against your previous attempts.",
  },
];

export default function DashboardPage() {
  const profile = publicProofProfiles[0];

  return (
    <AppFrame>
      <AuthGuard>
        <div className="app-shell">
          <div className="page-container space-y-6">
            <section className="surface-card p-6 sm:p-8">
              <span className="eyebrow-chip">Private dashboard</span>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Your hiring command center.</h1>
              <p className="section-copy">
                This is where readiness, track progress, resume variants, interview sessions, and application workflows meet.
              </p>
            </section>

            {/* Placement Sprint Pass & Pro Callout */}
            <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 p-6 sm:p-7 shadow-lg shadow-cyan-950/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> Placement Season Sprint 2026
                    </span>
                    <span className="text-xs text-amber-400 font-semibold">⚡ Day-1 Hiring Drives Active</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[color:var(--text-main)]">
                    Upgrade to CodeOrbit Pro: 100+ Monaco Runs & Unlimited AI Mock Turns
                  </h2>
                  <p className="text-xs sm:text-sm text-soft leading-relaxed">
                    Crack technical OA rounds with real-time Gemini Socratic code assistance, company hiring rubrics (Amazon, Google, TCS), and accredited placement proof scorecards. Starting at ₹499.
                  </p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                  <Link
                    href="/pricing"
                    className="btn-primary whitespace-nowrap bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    ⚡ View Placement Pass (From ₹499) →
                  </Link>
                </div>
              </div>
            </section>

            <DashboardSpotlight />

            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <article className="surface-card p-6">
                <h2 className="text-2xl font-semibold">Suggested next actions</h2>
                <div className="mt-5 space-y-3">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href} className="surface-soft block p-5 transition hover:border-[color:var(--accent)]">
                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-soft">{action.description}</p>
                    </Link>
                  ))}
                </div>
              </article>

              <article className="surface-card p-6">
                <h2 className="text-2xl font-semibold">Proof profile snapshot</h2>
                <div className="surface-soft mt-5 p-5">
                  <p className="text-sm font-semibold">{profile.fullName}</p>
                  <p className="mt-2 text-sm text-soft">{profile.headline}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="surface-card p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Readiness</p>
                      <p className="mt-2 text-2xl font-semibold">{profile.readiness.overallScore}</p>
                    </div>
                    <div className="surface-card p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Solved</p>
                      <p className="mt-2 text-2xl font-semibold">{profile.solvedCount}</p>
                    </div>
                    <div className="surface-card p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Best fit</p>
                      <p className="mt-2 text-sm font-semibold">{profile.companyTrackProgress[0]?.label}</p>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="surface-card overflow-hidden">
              <div className="border-b border-[color:var(--border)] px-5 py-4">
                <h2 className="text-2xl font-semibold">Application workflow</h2>
              </div>
              <div className="divide-y divide-[color:var(--border)]">
                {jobWorkflowPreview.map((job) => (
                  <div key={job.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_0.7fr_0.8fr] lg:items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {job.company} · {job.role}
                      </h3>
                      <p className="mt-1 text-sm text-soft">{job.nextAction}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted">Readiness match</p>
                      <p className="font-semibold">{job.readinessMatchScore}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted">Status</p>
                      <p className="font-semibold">{job.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </AuthGuard>
    </AppFrame>
  );
}
