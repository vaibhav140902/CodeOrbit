"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { AppPreferencesProvider } from "@/lib/preferences-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
