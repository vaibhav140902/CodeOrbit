import type { Metadata } from "next";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { companyDirectory, roleDirectory, trackItems } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Company tracks | CodeOrbit",
  description:
    "Explore company and role interview tracks built for India-first hiring, with round types, freshness, and source confidence visible by default.",
  path: "/tracks",
});

export default function TracksPage() {
  const trackGroups = companyDirectory.map((company) => ({
    company,
    tracks: trackItems.filter((track) => track.companySlug === company.slug).slice(0, 3),
  }));

  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card hero-orbit overflow-hidden p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <span className="eyebrow-chip">Curated company tracks</span>
                <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Most important company questions, with role and round context attached.</h1>
                <p className="section-copy">
                  Instead of random lists, every question here is tagged by company, role, round type, freshness, and signal level so you can practice the right problems in the right order.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/problems" className="btn-primary">
                    Start solving
                  </Link>
                  <Link href="/readiness-score" className="btn-secondary">
                    See scoring model
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Companies</p>
                  <p className="mt-2 text-3xl font-bold">{companyDirectory.length}</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Tracked questions</p>
                  <p className="mt-2 text-3xl font-bold">{trackItems.length}</p>
                </div>
                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Roles covered</p>
                  <p className="mt-2 text-3xl font-bold">{roleDirectory.length}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Companies</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {companyDirectory.map((company) => (
                  <Link key={company.slug} href={`/companies/${company.slug}`} className="surface-soft p-5 transition hover:border-[color:var(--accent)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{company.name}</h3>
                        <p className="mt-2 text-sm leading-7 text-soft">{company.headline}</p>
                      </div>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs">
                        {company.geographyRelevance}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Roles</h2>
              <div className="mt-5 space-y-3">
                {roleDirectory.map((role) => (
                  <Link key={role.slug} href={`/roles/${role.slug}`} className="surface-soft block p-5 transition hover:border-[color:var(--accent)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">{role.name}</h3>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs">{role.level}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-soft">{role.summary}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                      Focus: {role.focusSkills.join(" · ")}
                    </p>
                  </Link>
                ))}
              </div>
            </article>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Company-wise must-do questions</h2>
              <p className="mt-2 text-sm text-soft">
                These are the highest-signal questions we currently surface first for each company track.
              </p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {trackGroups.map(({ company, tracks }) => (
                <article key={company.slug} className="surface-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{company.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-soft">{company.hiringFocus}</p>
                    </div>
                    <Link href={`/companies/${company.slug}`} className="link-subtle text-xs">
                      Open track
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {tracks.map((track) => (
                      <div key={track.id} className="rounded-2xl border border-[color:var(--border)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{track.title}</p>
                            <p className="mt-1 text-xs text-muted">{track.roleSlug.replace(/-/g, " ")} • {track.roundType} • {track.signal ?? "high-frequency"}</p>
                          </div>
                          {track.problemId ? (
                            <Link href={`/problems/${track.problemId}`} className="link-subtle text-xs">
                              Solve question
                            </Link>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-soft">{track.explanation}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-[color:var(--border)] px-5 py-4">
              <h2 className="text-2xl font-semibold">Track preview</h2>
              <p className="mt-2 text-sm text-soft">
                Every item below carries explicit difficulty, round type, freshness, and source-confidence metadata.
              </p>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              {trackItems.map((track) => (
                <div key={track.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_0.7fr] lg:items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{track.title}</h3>
                    <p className="mt-1 text-sm text-soft">{track.explanation}</p>
                    {track.problemId ? (
                      <Link href={`/problems/${track.problemId}`} className="mt-2 inline-flex text-xs font-semibold text-[color:var(--accent)] hover:underline">
                        Open problem preview
                      </Link>
                    ) : null}
                  </div>
                  <div className="text-sm">
                    <p className="text-muted">Role</p>
                    <p className="font-semibold">{track.roleSlug.replace(/-/g, " ")}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted">Round</p>
                    <p className="font-semibold">{track.roundType}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted">Signal</p>
                    <p className="font-semibold">{track.signal ?? "high-frequency"}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted">Freshness</p>
                    <p className="font-semibold">{track.freshness}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
