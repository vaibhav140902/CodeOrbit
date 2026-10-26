import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/layout/app-frame";
import { StructuredData } from "@/components/site/structured-data";
import { companyDirectory, getCompanyBySlug, getTracksByCompany, roleDirectory } from "@/data/hiring-os";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/site-config";

export function generateStaticParams() {
  return companyDirectory.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) {
    return buildMetadata({
      title: "Company track | CodeOrbit",
      description: "Company-specific readiness tracks for developer hiring.",
      path: `/companies/${slug}`,
    });
  }

  return buildMetadata({
    title: `${company.name} track | CodeOrbit`,
    description: `${company.headline} Explore rounds, roles, freshness, and India-first relevance for ${company.name}.`,
    path: `/companies/${company.slug}`,
  });
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const tracks = getTracksByCompany(company.slug);
  const linkedRoles = roleDirectory.filter((role) => company.roleSlugs.includes(role.slug));

  return (
    <AppFrame>
      <StructuredData
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tracks", path: "/tracks" },
          { name: company.name, path: `/companies/${company.slug}` },
        ])}
      />
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">{company.geographyRelevance}</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">{company.name} interview track</h1>
            <p className="section-copy">{company.headline}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Hiring focus</p>
                <p className="mt-2 text-sm font-semibold text-soft">{company.hiringFocus}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Roles covered</p>
                <p className="mt-2 text-sm font-semibold text-soft">{linkedRoles.length}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Freshness</p>
                <p className="mt-2 text-sm font-semibold text-soft">{company.freshnessNote}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <article className="surface-card p-6">
              <h2 className="text-2xl font-semibold">Why this track exists</h2>
              <p className="mt-4 text-sm leading-7 text-soft">{company.overview}</p>
              <div className="mt-6 space-y-3">
                {linkedRoles.map((role) => (
                  <Link key={role.slug} href={`/roles/${role.slug}`} className="surface-soft block p-4 transition hover:border-[color:var(--accent)]">
                    <p className="text-sm font-semibold">{role.name}</p>
                    <p className="mt-1 text-sm text-soft">{role.summary}</p>
                  </Link>
                ))}
              </div>
            </article>

            <article className="surface-card overflow-hidden">
              <div className="border-b border-[color:var(--border)] px-5 py-4">
                <h2 className="text-2xl font-semibold">Track items</h2>
                <p className="mt-2 text-sm text-soft">Use these to build readiness before you apply.</p>
              </div>
              <div className="divide-y divide-[color:var(--border)]">
                {tracks.map((track) => (
                  <div key={track.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{track.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-soft">{track.explanation}</p>
                      </div>
                      <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm">{track.difficulty}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.roundType}</span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.topic}</span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.sourceConfidence}</span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.signal ?? "high-frequency"}</span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">{track.freshness}</span>
                    </div>
                    {track.problemId ? (
                      <div className="mt-3">
                        <Link href={`/problems/${track.problemId}`} className="link-subtle text-xs">
                          Solve this question
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
