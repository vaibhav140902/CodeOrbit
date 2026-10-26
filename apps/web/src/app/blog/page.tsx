import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import { resourceItems } from "@/data/hiring-os";
import { buildMetadata } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Resources | CodeOrbit",
  description:
    "Read hiring, resume, readiness, and company-track resources built for India-first developer outcomes.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <AppFrame>
      <div className="app-shell">
        <div className="page-container space-y-6">
          <section className="surface-card p-6 sm:p-8">
            <span className="eyebrow-chip">Resources</span>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Guides for turning prep into stronger hiring signal.</h1>
            <p className="section-copy">
              This hub is intentionally practical: fewer generic tips, more guidance on readiness, recruiter-safe proof,
              resume quality, and company-role alignment.
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {resourceItems.map((resource) => (
              <article key={resource.slug} id={resource.slug} className="surface-card p-6">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{resource.category}</p>
                <h2 className="mt-3 text-2xl font-semibold">{resource.title}</h2>
                <p className="mt-3 text-sm leading-7 text-soft">{resource.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">{resource.readTimeMinutes} min read</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
