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
