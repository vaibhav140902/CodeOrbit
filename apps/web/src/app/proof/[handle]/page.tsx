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

  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Public proof profile</span>
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
