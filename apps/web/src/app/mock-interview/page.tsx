import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { InteractiveMockInterview } from "@/components/interview/interactive-mock-interview";
import { roleDirectory, trackItems } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "AI Voice & Chat Mock Interviewer | CodeOrbit",
  description:
    "Practice real-time technical and behavioral mock interviews with company-specific rubrics, Socratic hints, and accredited 5-dimension placement scoring.",
  path: "/mock-interview",
});

export default function MockInterviewPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-8">
          {/* Interactive Multi-Turn Mock Interview Workspace */}
          <InteractiveMockInterview />

          {/* Role Coverage & Practice Sets */}
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="surface-card p-6">
              <h2 className="text-xl font-semibold">What gets measured</h2>
              <ul className="detail-list mt-3">
                <li>• Problem Solving & Algorithmic Optimality (DSA, Invariants, Edge Cases)</li>
                <li>• System Architecture & High-Concurrency Resilience (P99, Caching, DB Sharding)</li>
                <li>• Communication Clarity & Structured Reasoning (Context → Tradeoff → Outcome)</li>
                <li>• Behavioral & Leadership Principles (STAR Format, Customer Focus, Ownership)</li>
                <li>• Proactive Time & Auxiliary Space Complexity Awareness</li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/resume-roaster" className="btn-primary text-xs">
                  Roast My Resume (Free ATS)
                </Link>
                <Link href="/problems" className="btn-secondary text-xs">
                  Practice Monaco DSA Workspace
                </Link>
              </div>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-xl font-semibold">Campus Role Tracks</h2>
              <div className="mt-4 space-y-3">
                {roleDirectory.map((role) => (
                  <div key={role.slug} className="surface-soft p-3.5 rounded-lg border border-[color:var(--border)]">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">{role.name}</h3>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-0.5 text-xs text-muted">
                        {role.level}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-soft">{role.interviewSignals.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* Company Track Real Interview Questions */}
          <section className="surface-card overflow-hidden">
            <div className="border-b border-[color:var(--border)] px-6 py-4">
              <h2 className="text-xl font-semibold">Recent Campus Placement Rounds</h2>
              <p className="text-xs text-soft mt-0.5">High-frequency problems asked in 2025–2026 drives across Tier-1/2/3 colleges.</p>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              {trackItems.slice(0, 5).map((track) => (
                <div key={track.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[color:var(--surface-soft)]/40 transition-colors">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{track.title}</h3>
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px]">
                        {track.roundType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-soft">{track.explanation}</p>
                  </div>
                  <Link href="/problems" className="text-xs font-semibold text-cyan-400 hover:underline">
                    Solve in IDE →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
