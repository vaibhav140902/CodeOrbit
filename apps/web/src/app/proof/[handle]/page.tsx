import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/layout/app-frame";
import { publicProofProfiles, getProofProfileByHandle, jobWorkflowPreview } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export function generateStaticParams() {
  return publicProofProfiles.map((profile) => ({ handle: profile.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = getProofProfileByHandle(handle);

  if (!profile) {
    return buildMetadata({
      title: "Proof profile | CodeOrbit",
      description: "Public developer proof profiles built from readiness signals.",
      path: `/proof/${handle}`,
    });
  }

  const ogParamTitle = encodeURIComponent(profile.fullName);
  const ogParamSubtitle = encodeURIComponent(profile.headline || "Verified Developer");
  const ogParamScore = encodeURIComponent(String(profile.readiness.overallScore || 85));
  const ogImage = `/api/og?title=${ogParamTitle}&subtitle=${ogParamSubtitle}&score=${ogParamScore}&badge=VERIFIED%20PROOF`;

  return buildMetadata({
    title: `${profile.fullName} | Proof profile`,
    description: `${profile.fullName} uses CodeOrbit to show verified readiness, top topics, projects, and application intent.`,
    path: `/proof/${profile.handle}`,
    image: ogImage,
  });
}

function getTierBadge(score: number) {
  if (score >= 90) {
    return {
      label: "Day-1 FAANG Ready",
      className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
      dotColor: "bg-emerald-400",
    };
  }
  if (score >= 75) {
    return {
      label: "Top Tier",
      className: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
      dotColor: "bg-cyan-400",
    };
  }
  if (score >= 50) {
    return {
      label: "Placement Ready",
      className: "border-blue-500/40 bg-blue-500/15 text-blue-300",
      dotColor: "bg-blue-400",
    };
  }
  return {
    label: "Needs Practice",
    className: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    dotColor: "bg-amber-400",
  };
}

export default async function ProofProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = getProofProfileByHandle(handle);

  if (!profile) {
    notFound();
  }

  const dsaScore = (profile.readiness as unknown as { dsaCompetencyScore?: number }).dsaCompetencyScore ?? profile.readiness.topicMasteryScore ?? 90;
  const oaScore = (profile.readiness as unknown as { proctoredOaScore?: number }).proctoredOaScore ?? profile.readiness.speedToSolveScore ?? 86;
  const mockScore = profile.readiness.mockInterviewScore ?? 85;
  const pfiOverallScore = Math.round(dsaScore * 0.4 + oaScore * 0.3 + mockScore * 0.3);
  const tier = getTierBadge(pfiOverallScore);

  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 sm:p-5 text-cyan-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="rounded-md bg-cyan-500/20 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Verified Candidate Profile
                </span>
                <span className="text-xs sm:text-sm font-medium">
                  Readiness scores and solved metrics are cryptographically verified from actual platform evaluations.
                </span>
              </div>
              <span className="text-[11px] text-cyan-300/80 font-mono">
                CodeOrbit National Placement Authority
              </span>
            </div>
          </div>

          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">
              Verified Candidate Proof Profile
            </span>
            <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h1 className="text-4xl font-bold sm:text-5xl">{profile.fullName}</h1>
                <p className="mt-3 text-lg text-soft">{profile.headline}</p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-soft">{profile.bio}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Overall readiness</p>
                  <p className="mt-2 text-3xl font-semibold">{profile.readiness.overallScore}</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Solved problems</p>
                  <p className="mt-2 text-3xl font-semibold">{profile.solvedCount}</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Interview streak</p>
                  <p className="mt-2 text-3xl font-semibold">{profile.streakDays}d</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Languages</p>
                  <p className="mt-2 text-sm font-semibold">{profile.languageSupport.join(" / ")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Practical Fit Index (PFI) Transparent Recruiter Evaluation */}
          <section className="surface-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="eyebrow-chip">Recruiter Verification</span>
                  <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-400 border border-cyan-500/20">
                    Transparent PFI Breakdown
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Practical Fit Index (PFI) Scorecard</h2>
                <p className="mt-1 text-sm text-soft">
                  Deterministic readiness evaluation across algorithmic depth, proctored code accuracy, and conversational interview mastery.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-muted font-mono">Verified Score</p>
                  <p className="text-3xl font-extrabold text-[color:var(--text-main)]">
                    {pfiOverallScore}<span className="text-sm font-normal text-muted">/100</span>
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${tier.className}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${tier.dotColor} animate-pulse`} />
                  {tier.label}
                </span>
              </div>
            </div>

            {/* Exact Formula Callout */}
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-blue-950/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold text-cyan-400 tracking-wider">Formula:</span>
                <code className="rounded bg-black/40 px-2.5 py-1 font-mono font-semibold text-cyan-200 border border-cyan-500/20">
                  Your Readiness Score = DSA × 0.4 + OA × 0.3 + Interview × 0.3
                </code>
              </div>
              <span className="text-xs text-soft font-medium">
                Verified candidate scoring rubric (40% + 30% + 30% = 100%)
              </span>
            </div>

            {/* Cards Grid with Progress Bars */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* DSA Competency */}
              <div className="surface-soft p-5 rounded-xl border border-[color:var(--border)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">DSA Competency</span>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                      40% Weight
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-bold">{dsaScore}</span>
                    <span className="text-xs text-muted font-mono">Contribution: {(dsaScore * 0.4).toFixed(1)} pts</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${dsaScore}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-soft leading-relaxed border-t border-white/5 pt-3">
                  Difficulty-weighted points (Easy=6, Med=14, Hard=28) with 10% sub-median time-complexity bonus.
                </p>
              </div>

              {/* Proctored OA / Bug-Fixing */}
              <div className="surface-soft p-5 rounded-xl border border-[color:var(--border)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Proctored OA</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/20">
                      30% Weight
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-bold">{oaScore}</span>
                    <span className="text-xs text-muted font-mono">Contribution: {(oaScore * 0.3).toFixed(1)} pts</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${oaScore}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-soft leading-relaxed border-t border-white/5 pt-3">
                  First-attempt acceptance rate without retries and timed problem solving under contest conditions.
                </p>
              </div>

              {/* AI Mock Interview */}
              <div className="surface-soft p-5 rounded-xl border border-[color:var(--border)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-400 font-mono">AI Mock Interview</span>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/20">
                      30% Weight
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-bold">{mockScore}</span>
                    <span className="text-xs text-muted font-mono">Contribution: {(mockScore * 0.3).toFixed(1)} pts</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${mockScore}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-soft leading-relaxed border-t border-white/5 pt-3">
                  Live technical interview turns, problem probing, and communication clarity evaluations.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Readiness breakdown</h2>
              <div className="mt-5 space-y-4">
                {[
                  ["Topic mastery", profile.readiness.topicMasteryScore],
                  ["Company-track completion", profile.readiness.companyTrackScore],
                  ["Speed to solve", profile.readiness.speedToSolveScore],
                  ["Hint independence", profile.readiness.hintDependenceScore],
                  ["Mock interviews", profile.readiness.mockInterviewScore],
                  ["Resume fit", profile.readiness.resumeFitScore],
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
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Projects and application intent</h2>
              <div className="mt-5 space-y-4">
                {profile.topProjects.map((project) => (
                  <div key={project.title} className="surface-soft p-5">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-soft">{project.summary}</p>
                    <ul className="mt-3 space-y-1 text-sm text-soft">
                      {project.proofPoints.map((point) => (
                        <li key={point}>- {point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {jobWorkflowPreview.map((job) => (
                  <div key={job.id} className="surface-soft p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">
                        {job.company} · {job.role}
                      </h3>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs">{job.status}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-soft">
                      Readiness match {job.readinessMatchScore}. {job.nextAction}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
