import type { Metadata } from "next";
import "@codeorbit/ui/styles.css";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { PrivacyBanner } from "@/components/system/privacy-banner";
import { PwaRegister } from "@/components/system/pwa-register";
import { buildMetadata, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  ...buildMetadata({
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    path: "/",
  }),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand-mark.svg",
    apple: "/brand-mark.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <AppProviders>
          {children}
          <PrivacyBanner />
          <PwaRegister />
        </AppProviders>
      </body>
    </html>
  );
}
