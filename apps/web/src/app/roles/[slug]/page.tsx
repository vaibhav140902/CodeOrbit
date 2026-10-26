import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/layout/app-frame";
import { StructuredData } from "@/components/site/structured-data";
import { companyDirectory, getRoleBySlug, getTracksByRole, roleDirectory } from "@/data/hiring-os";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/site-config";

export function generateStaticParams() {
  return roleDirectory.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const role = getRoleBySlug(slug);
  if (!role) {
    return buildMetadata({
      title: "Role track | CodeOrbit",
      description: "Role-specific readiness tracks for developer hiring.",
      path: `/roles/${slug}`,
    });
  }

  return buildMetadata({
    title: `${role.name} track | CodeOrbit`,
    description: role.summary,
    path: `/roles/${role.slug}`,
  });
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = getRoleBySlug(slug);

  if (!role) {
    notFound();
  }

  const tracks = getTracksByRole(role.slug);
  const companies = companyDirectory.filter((company) => company.roleSlugs.includes(role.slug));

  return (
    <AppFrame>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tracks", path: "/tracks" },
          { name: role.name, path: `/roles/${role.slug}` },
        ])}
      />
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">{role.level}</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">{role.name} readiness track</h1>
            <p className="section-copy">{role.summary}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="surface-soft p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Focus skills</p>
                <p className="mt-3 text-sm leading-7 text-soft">{role.focusSkills.join(" · ")}</p>
              </div>
              <div className="surface-soft p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Interview signals</p>
                <p className="mt-3 text-sm leading-7 text-soft">{role.interviewSignals.join(" · ")}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Best-fit companies</h2>
              <div className="mt-5 space-y-3">
                {companies.map((company) => (
                  <Link key={company.slug} href={`/companies/${company.slug}`} className="surface-soft block p-4 transition hover:border-[color:var(--accent)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{company.name}</p>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs">
                        {company.geographyRelevance}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-soft">{company.headline}</p>
                  </Link>
                ))}
              </div>
            </article>

            <article className="surface-card overflow-hidden">
              <div className="border-b border-[color:var(--border)] px-5 py-4">
                <h2 className="text-2xl font-semibold">Role-specific track items</h2>
                <p className="mt-2 text-sm text-soft">This view groups track work by actual role intent, not just topic buckets.</p>
              </div>
              <div className="divide-y divide-[color:var(--border)]">
                {tracks.map((track) => (
                  <div key={track.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{track.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-soft">{track.explanation}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted">Ideal time</p>
                        <p className="font-semibold">{track.idealTimeMinutes} min</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.companySlug}</span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.roundType}</span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.difficulty}</span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.signal ?? "high-frequency"}</span>
                    </div>
                    {track.problemId ? (
                      <div className="mt-3">
                        <Link href={`/problems/${track.problemId}`} className="link-subtle text-xs">
                          Open problem preview
                        </Link>
                      </div>
                    ) : null}
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
