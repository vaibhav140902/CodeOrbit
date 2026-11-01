"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { AppPreferencesProvider } from "@/lib/preferences-context";
import { ToastProvider } from "@/components/ui/toast-bus";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AppPreferencesProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
