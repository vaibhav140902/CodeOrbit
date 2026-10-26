import type { Metadata } from "next";
import Link from "next/link";
import { mockProblems } from "@codeorbit/ui";
import { AppFrame } from "@/components/layout/app-frame";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Problem library | CodeOrbit",
  description:
    "Explore an indexable coding problem library built for readiness scoring, company-track alignment, and recruiter-safe technical proof.",
  path: "/problems",
});

const topicCount = Array.from(new Set(mockProblems.flatMap((problem) => problem.tags))).length;

export default function ProblemsPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Problem library</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Coding problems tied to readiness, not random streaks.</h1>
            <p className="section-copy">
              CodeOrbit keeps the problem layer public and indexable so candidates can understand the depth of the system
              before they sign in. The actual solving workspace stays authenticated for privacy, submissions, AI usage,
              and score integrity.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Preview problems</p>
                <p className="mt-2 text-2xl font-semibold">{mockProblems.length}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Core topics</p>
                <p className="mt-2 text-2xl font-semibold">{topicCount}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Readiness use</p>
                <p className="mt-2 text-lg font-semibold">Score + proof layer</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What makes these problems different?</h2>
              <ul className="detail-list">
                <li>- Each solve contributes to a broader readiness model, not just a raw solved counter.</li>
                <li>- Tracks are connected to company, role, round type, freshness, and geography relevance.</li>
                <li>- Resume and proof-profile layers can turn work here into recruiter-safe evidence.</li>
                <li>- Interview and application workflows connect this practice to real hiring action.</li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="btn-primary">
                  Start readiness assessment
                </Link>
                <Link href="/tracks" className="btn-secondary">
                  Browse tracks
                </Link>
              </div>
            </article>

            <div className="surface-card overflow-hidden">
              <div className="border-b border-[color:var(--border)] px-5 py-4">
                <h2 className="text-2xl font-semibold">Public preview</h2>
                <p className="mt-2 text-sm text-soft">
                  The authenticated workspace adds code execution, submissions, AI assist, and score tracking.
                </p>
              </div>
              <div className="divide-y divide-[color:var(--border)]">
                {mockProblems.map((problem) => (
                  <Link
                    key={problem.id}
                    href={`/problems/${problem.id}`}
                    className="block px-5 py-4 transition hover:bg-[color:var(--accent-soft)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{problem.problemName}</h3>
                        <p className="mt-1 text-sm text-soft">{problem.tags.join(" · ")}</p>
                      </div>
                      <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm">
                        {problem.difficulty}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
