import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { roleDirectory, trackItems } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Interview OS | CodeOrbit",
  description:
    "Practice role-specific mock interviews with transcripts, scoring rubrics, clarity feedback, and progress over time.",
  path: "/mock-interview",
});

export default function MockInterviewPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Interview OS</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Mock interviews that create memory, not just one-off scores.</h1>
            <p className="section-copy">
              CodeOrbit stores transcripts, scoring rubrics, clarity feedback, filler-word trends, and retry history so
              candidates can compare sessions and actually improve.
            </p>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What gets measured</h2>
              <ul className="detail-list">
                <li>- Role-specific technical questioning and company-specific practice sets.</li>
                <li>- Communication structure, clarity, and filler-word awareness.</li>
                <li>- STAR-style behavioral coaching for fresher and early-career interviews.</li>
                <li>- Retry-and-compare session history so progress is visible over time.</li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="btn-primary">
                  Start interview prep
                </Link>
                <Link href="/tracks" className="btn-secondary">
                  Choose a role track
                </Link>
              </div>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Role coverage</h2>
              <div className="mt-5 space-y-3">
                {roleDirectory.map((role) => (
                  <div key={role.slug} className="surface-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">{role.name}</h3>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs">{role.level}</span>
                    </div>
                    <p className="mt-2 text-sm text-soft">{role.interviewSignals.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-[color:var(--border)] px-5 py-4">
              <h2 className="text-2xl font-semibold">Interview-style track examples</h2>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              {trackItems.slice(0, 5).map((track) => (
                <div key={track.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{track.title}</h3>
                    <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm">{track.roundType}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-soft">{track.explanation}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
