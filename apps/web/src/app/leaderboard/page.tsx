import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { publicProofProfiles } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Leaderboard | CodeOrbit",
  description:
    "See how CodeOrbit frames leaderboard signal around verified readiness, consistency, and recruiter-safe proof rather than vanity alone.",
  path: "/leaderboard",
});

export default function LeaderboardPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Leaderboard preview</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Competition is useful only when it improves hiring readiness.</h1>
            <p className="section-copy">
              CodeOrbit keeps ranking visible, but it is not the product moat. The real moat is verified proof: readiness,
              projects, interview improvement, and application quality.
            </p>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-[color:var(--border)] px-5 py-4">
              <h2 className="text-2xl font-semibold">Public proof sample</h2>
              <p className="mt-2 text-sm text-soft">Representative of the signal we want rankings to support, not replace.</p>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              {publicProofProfiles.map((profile, index) => (
                <div key={profile.handle} className="grid gap-3 px-5 py-4 lg:grid-cols-[0.5fr_1.4fr_0.7fr_0.7fr] lg:items-center">
                  <div className="text-2xl font-bold">#{index + 1}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{profile.fullName}</h3>
                    <p className="mt-1 text-sm text-soft">{profile.headline}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted">Readiness</p>
                    <p className="font-semibold">{profile.readiness.overallScore}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted">Solved</p>
                    <p className="font-semibold">{profile.solvedCount}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <h2 className="text-2xl font-semibold">Want your real dashboard?</h2>
            <p className="section-copy mt-3">
              Sign in to view your private leaderboard rank, submission history, and readiness-linked activity.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary">
                Create account
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                Open dashboard
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
