"use client";

import { BRAND } from "@codeorbit/ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { usePlatformAuth } from "@/lib/auth-context";
import { useAppPreferences } from "@/lib/preferences-context";

interface NavItem {
  href: string;
  label: string;
  match?: (pathname: string) => boolean;
}

const isTracksPath = (pathname: string) =>
  pathname === "/tracks" || pathname.startsWith("/companies/") || pathname.startsWith("/roles/");

export function Topbar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { profile, signOutCurrentUser, user } = usePlatformAuth();
  const { locale, setLocale } = useAppPreferences();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: "/", label: "Home" },
      { href: "/problems", label: "Problems", match: (value) => value === "/problems" || value.startsWith("/problems/") },
      { href: "/tracks", label: "Tracks", match: isTracksPath },
      { href: "/resume-roaster", label: "Resume Roaster" },
      { href: "/mock-interview", label: "AI Interview" },
      { href: "/readiness-score", label: "Readiness" },
      { href: "/pricing", label: "Pricing" },
      { href: "/for-recruiters", label: "Recruiters" },
      { href: "/about", label: "About" },
      ...(profile?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    ],
    [profile?.isAdmin]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (item: NavItem) => (item.match ? item.match(pathname) : pathname === item.href);
  const themeLabel = mounted && resolvedTheme === "dark" ? "Switch to light" : "Switch to dark";

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg-elevated)]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={BRAND.markPath}
              alt={`${BRAND.name} logo`}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full border border-[color:var(--border)]"
            />
            <div>
              <p className="text-sm font-extrabold tracking-tight">{BRAND.name}</p>
              <p className="hidden text-[11px] text-muted sm:block">{BRAND.tagline}</p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]/90 px-2 py-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                isActive(item)
                  ? "bg-[color:var(--accent-soft)] text-[color:var(--text-main)]"
                  : "text-muted hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text-main)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Link href="/dashboard" className="btn-secondary text-sm">
              Dashboard
            </Link>
          ) : null}

          <button
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className="btn-ghost text-sm"
            title={locale === "en" ? "Switch to Hindi" : "Switch to English"}
          >
            {locale === "en" ? "हिंदी" : "English"}
          </button>

          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="btn-ghost text-sm"
            title={themeLabel}
          >
            {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-xs text-muted xl:block">
                {profile?.displayName ?? user.email}
              </span>
              <button
                onClick={() => {
                  void signOutCurrentUser();
                }}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                Login
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Start free
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((current) => !current)}
          className="btn-ghost px-3 py-2 text-sm lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[color:var(--border)] px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  isActive(item) ? "bg-[color:var(--accent-soft)]" : "surface-soft"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <Link href="/dashboard" className="btn-secondary mt-2 text-center text-sm">
                Dashboard
              </Link>
            ) : null}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setLocale(locale === "en" ? "hi" : "en")}
                className="btn-ghost text-sm"
              >
                {locale === "en" ? "हिंदी" : "English"}
              </button>
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="btn-ghost text-sm"
                title={themeLabel}
              >
                {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>

            {user ? (
              <button
                onClick={() => {
                  void signOutCurrentUser();
                }}
                className="btn-secondary mt-2 text-sm"
              >
                Logout
              </button>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" className="btn-ghost text-center text-sm">
                  Login
                </Link>
                <Link href="/signup" className="btn-primary text-center text-sm">
                  Start free
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
