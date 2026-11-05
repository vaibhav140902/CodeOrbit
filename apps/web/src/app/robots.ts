import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og", "/api/og/*"],
        disallow: ["/api/", "/admin"],
      },
      {
        userAgent: ["Twitterbot", "facebookexternalhit", "LinkedInBot", "WhatsApp"],
        allow: ["/api/og", "/api/og/*"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
