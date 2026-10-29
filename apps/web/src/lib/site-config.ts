import type { Metadata } from "next";

export const siteConfig = {
  name: "CodeOrbit",
  shortName: "CodeOrbit",
  tagline: "India-first verified developer hiring OS",
  description:
    "Turn practice into proof, proof into applications, and applications into offers with an India-first verified developer hiring OS.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://codeorbit.app").replace(/\/+$/, ""),
  ogImage: "/brand-mark.svg",
  keywords: [
    "India developer hiring",
    "coding interview preparation India",
    "verified readiness score",
    "developer portfolio proof",
    "company interview tracks",
    "resume ATS India",
    "mock interview practice",
  ],
} as const;

export const absoluteUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalizedPath}`;
};

export const buildMetadata = ({
  title,
  description,
  path = "/",
  keywords = [],
  image,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
}): Metadata => {
  const ogImageUrl = absoluteUrl(image || siteConfig.ogImage);
  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    applicationName: siteConfig.name,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  slogan: siteConfig.tagline,
  description: siteConfig.description,
  areaServed: ["India", "Global"],
  knowsAbout: [
    "developer readiness scoring",
    "interview preparation",
    "resume optimization",
    "mock interviews",
    "technical hiring workflows",
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: ["en-IN", "hi-IN"],
};

export const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});
