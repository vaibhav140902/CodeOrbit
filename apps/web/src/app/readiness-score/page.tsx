import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { publicProofProfiles, readinessDimensions } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Readiness score | CodeOrbit",
  description:
    "See how CodeOrbit combines topic mastery, track completion, mock interviews, resume fit, and project evidence into a verified readiness score.",
  path: "/readiness-score",
});

export default function ReadinessScorePage() {
  const profile = publicProofProfiles[0];

  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Verified readiness graph</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">A readiness score that explains what to improve next.</h1>
            <p className="section-copy">
              Most prep tools stop at solved counts. CodeOrbit is designed to show what a recruiter or hiring team would
              want to understand next: role fit, company alignment, consistency, interview performance, and real evidence.
            </p>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Score dimensions</h2>
              <div className="mt-5 space-y-4">
                {readinessDimensions.map((dimension) => (
                  <div key={dimension.key} className="surface-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">{dimension.label}</h3>
                      <span className="text-xs text-muted">{dimension.weight}%</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-soft">{dimension.description}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Example profile signal</h2>
              <div className="mt-5 space-y-4">
                {[
                  ["Overall readiness", profile.readiness.overallScore],
                  ["Topic mastery", profile.readiness.topicMasteryScore],
                  ["Company-track completion", profile.readiness.companyTrackScore],
                  ["Mock interview score", profile.readiness.mockInterviewScore],
                  ["Resume fit score", profile.readiness.resumeFitScore],
                  ["Project evidence", profile.readiness.projectEvidenceScore],
                ].map(([label, score]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{label}</span>
                      <span className="text-muted">{score}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[color:var(--border)]">
                      <div
                        className="h-2 rounded-full bg-[color:var(--accent)]"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href={`/proof/${profile.handle}`} className="btn-secondary">
                  View public proof profile
                </Link>
              </div>
            </article>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
