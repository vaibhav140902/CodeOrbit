import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { publicProofProfiles, resumeTemplates } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Resume OS | CodeOrbit",
  description:
    "Create recruiter-safe resume variants, score JD fit, export PDFs, generate LaTeX, and connect application materials to verified readiness.",
  path: "/resume",
});

export default function ResumePage() {
  const profile = publicProofProfiles[0];
  const variant = profile.resumeVariants[0];

  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card hero-orbit overflow-hidden p-6 sm:p-8">
            <span className="eyebrow-chip">Resume OS</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Resume variants tied to hiring intent, not one generic PDF.</h1>
            <p className="section-copy">
              Build a master profile, select a recruiter-safe template, paste a JD for ATS checking, and export both PDF and LaTeX from the same verified readiness workflow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/resume-builder" className="btn-primary">
                Open builder
              </Link>
              <Link href="/pricing" className="btn-secondary">
                See access plans
              </Link>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">What Resume OS covers</h2>
              <ul className="detail-list">
                <li>- Master profile plus role-specific resume variants.</li>
                <li>- JD import or paste with ATS-style scoring and missing-keyword feedback.</li>
                <li>- Bullet generation from coding work, interview history, and project evidence.</li>
                <li>- Recruiter-safe templates for India-first fresher and early-career roles.</li>
                <li>- PDF export plus LaTeX source for users who want full control.</li>
              </ul>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Live variant snapshot</h2>
              <div className="surface-soft mt-5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Variant</p>
                <h3 className="mt-3 text-xl font-semibold">{variant.name}</h3>
                <p className="mt-2 text-sm leading-7 text-soft">{variant.summary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="surface-card p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">ATS score</p>
                    <p className="mt-2 text-2xl font-semibold">{variant.atsScore}</p>
                  </div>
                  <div className="surface-card p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Role</p>
                    <p className="mt-2 text-sm font-semibold">{variant.roleSlug.replace(/-/g, " ")}</p>
                  </div>
                  <div className="surface-card p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Template</p>
                    <p className="mt-2 text-sm font-semibold">{variant.templateKey}</p>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">Template gallery</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {resumeTemplates.map((template) => (
                <article key={template.key} className="surface-soft p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{template.key}</p>
                  <h3 className="mt-3 text-lg font-semibold">{template.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-soft">{template.description}</p>
                  <p className="mt-3 text-sm text-soft">Best for: {template.bestFor.join(" • ")}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
