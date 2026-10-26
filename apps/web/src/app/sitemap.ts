import type { MetadataRoute } from "next";
import { companyDirectory, publicProofProfiles, resourceItems, roleDirectory } from "@/data/hiring-os";
import { absoluteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: Array<{
    path: string;
    changeFrequency: "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/problems", changeFrequency: "monthly", priority: 0.7 },
    { path: "/tracks", changeFrequency: "weekly", priority: 0.8 },
    { path: "/leaderboard", changeFrequency: "monthly", priority: 0.6 },
    { path: "/activity", changeFrequency: "monthly", priority: 0.6 },
    { path: "/mock-interview", changeFrequency: "monthly", priority: 0.7 },
    { path: "/resume", changeFrequency: "monthly", priority: 0.7 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.5 },
    { path: "/blog", changeFrequency: "monthly", priority: 0.6 },
    { path: "/readiness-score", changeFrequency: "monthly", priority: 0.7 },
    { path: "/for-recruiters", changeFrequency: "monthly", priority: 0.7 },
    { path: "/for-campuses", changeFrequency: "monthly", priority: 0.7 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...companyDirectory.map((company) => ({
      url: absoluteUrl(`/companies/${company.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...roleDirectory.map((role) => ({
      url: absoluteUrl(`/roles/${role.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...publicProofProfiles.map((profile) => ({
      url: absoluteUrl(`/proof/${profile.handle}`),
      lastModified: new Date(profile.updatedAtIso),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...resourceItems.map((resource) => ({
      url: absoluteUrl(`/blog#${resource.slug}`),
      lastModified: new Date(resource.updatedAtIso),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
