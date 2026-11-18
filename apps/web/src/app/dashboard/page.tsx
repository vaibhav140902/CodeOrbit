import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardSpotlight } from "@/components/dashboard/dashboard-spotlight";
import { AccountPrivacySettings } from "@/components/dashboard/account-privacy-settings";
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

export default function DashboardPage() {
  const profile = publicProofProfiles[0];
  const dsaScore = (profile.readiness as unknown as { dsaCompetencyScore?: number }).dsaCompetencyScore ?? profile.readiness.topicMasteryScore ?? 90;
  const oaScore = (profile.readiness as unknown as { proctoredOaScore?: number }).proctoredOaScore ?? profile.readiness.speedToSolveScore ?? 86;
  const mockScore = profile.readiness.mockInterviewScore ?? 85;
  const pfiOverallScore = Math.round(dsaScore * 0.4 + oaScore * 0.3 + mockScore * 0.3);
  const tier = getTierBadge(pfiOverallScore);

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

            {/* Practical Fit Index (PFI) Transparency Section */}
            <section className="surface-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow-chip">Scoring Transparency</span>
                    <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-400 border border-cyan-500/20">
                      PFI Engine
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Practical Fit Index (PFI) Breakdown</h2>
                  <p className="mt-1 text-sm text-soft">
                    Zero black-box scoring. Every point is deterministically evaluated from verified DSA, proctored OA runs, and AI mock sessions.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted font-mono">Readiness Score</p>
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
                  Verified deterministic rubric (40% + 30% + 30% = 100%)
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
                      <span className="text-xs text-muted font-mono">Weighted: {(dsaScore * 0.4).toFixed(1)} pts</span>
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
                      <span className="text-xs text-muted font-mono">Weighted: {(oaScore * 0.3).toFixed(1)} pts</span>
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
                      <span className="text-xs text-muted font-mono">Weighted: {(mockScore * 0.3).toFixed(1)} pts</span>
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

            {/* DPDP Act 2023 Account Privacy & Data Erasure */}
            <AccountPrivacySettings />
          </div>
        </div>
      </AuthGuard>
    </AppFrame>
  );
}
