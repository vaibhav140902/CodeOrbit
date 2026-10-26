import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { jobWorkflowPreview, publicProofProfiles } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Activity and job workflow | CodeOrbit",
  description:
    "Preview how CodeOrbit connects coding activity, readiness changes, resume versions, and job applications into one private workflow.",
  path: "/activity",
});

export default function ActivityPage() {
  const profile = publicProofProfiles[0];

  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Activity preview</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Activity becomes useful when it leads to better applications.</h1>
            <p className="section-copy">
              CodeOrbit’s private activity layer is designed to connect attempts, readiness changes, resume exports,
              interview sessions, and applications into one hiring workflow. Public pages preview the system; signed-in
              users get the private timeline.
            </p>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Private timeline signals</h2>
              <ul className="detail-list">
                <li>- Problem attempts and accepted submissions.</li>
                <li>- Readiness score deltas after focused practice.</li>
                <li>- Resume version exports attached to specific jobs.</li>
                <li>- Mock interview retries and interview tracker history.</li>
                <li>- Ready-to-apply suggestions based on actual role fit.</li>
              </ul>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Example candidate state</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Readiness</p>
                  <p className="mt-2 text-2xl font-semibold">{profile.readiness.overallScore}</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Saved jobs</p>
                  <p className="mt-2 text-2xl font-semibold">{jobWorkflowPreview.length}</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Resume variants</p>
                  <p className="mt-2 text-2xl font-semibold">{profile.resumeVariants.length}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-[color:var(--border)] px-5 py-4">
              <h2 className="text-2xl font-semibold">Job workflow preview</h2>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              {jobWorkflowPreview.map((job) => (
                <div key={job.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {job.company} · {job.role}
                      </h3>
                      <p className="mt-1 text-sm text-soft">{job.nextAction}</p>
                    </div>
                    <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm">{job.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Want the private dashboard mode?</h2>
                <p className="mt-2 text-sm leading-7 text-soft">
                  Create an account to unlock your actual submission history, resume exports, and job tracker.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="btn-primary">
                  Start free
                </Link>
                <Link href="/dashboard" className="btn-secondary">
                  Open dashboard
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
