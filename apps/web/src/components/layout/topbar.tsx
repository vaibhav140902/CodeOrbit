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
      { href: "/problems", label: "Problems", match: (value) => value === "/problems" || value.startsWith("/problems/") },
      { href: "/resume-roaster", label: "Resume Roaster" },
      { href: "/mock-interview", label: "AI Interview" },
      { href: "/for-campuses/demo", label: "For Campuses" },
      { href: "/pricing", label: "Pricing" },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src={BRAND.markPath}
              alt={`${BRAND.name} logo`}
              width={30}
              height={30}
              className="h-7 w-7 rounded-lg border border-[color:var(--border)] transition-transform group-hover:scale-105"
            />
            <div>
              <p className="text-sm font-extrabold tracking-tight text-[color:var(--text-main)]">{BRAND.name}</p>
              <p className="hidden text-[10px] text-muted sm:block uppercase tracking-wider font-semibold">Career Readiness OS</p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]/90 px-3 py-1 xl:flex shadow-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive(item)
                  ? "bg-[color:var(--accent-soft)] text-[color:var(--text-main)] font-bold shadow-xs"
                  : "text-muted hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text-main)]"
              }`}
            >
              <span>{item.label}</span>
              {item.href === "/resume-roaster" && (
                <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 text-[9px] font-bold text-rose-500 dark:text-rose-300 uppercase">
                  Free
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/15 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300 transition hover:border-amber-400 hover:from-amber-500/25 hover:to-orange-500/25 shadow-xs"
          >
            <span>⚡</span>
            <span>Upgrade</span>
          </Link>

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
              <span className="hidden max-w-[180px] truncate text-xs text-muted 2xl:block">
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
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold xl:hidden rounded-lg border border-[color:var(--border)]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span className="text-sm font-mono">{mobileOpen ? "✕" : "☰"}</span>
          <span>{mobileOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[color:var(--border)] bg-[color:var(--bg-elevated)]/98 px-4 py-4 xl:hidden shadow-xl backdrop-blur-2xl animate-in slide-in-from-top-2">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-2">
            <Link
              href="/pricing"
              className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-300 shadow-sm transition hover:border-amber-400"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span>Placement Sprint Pass / Pro</span>
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-200">
                Unlock Pro
              </span>
            </Link>

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center justify-between ${
                  isActive(item)
                    ? "bg-[color:var(--accent-soft)] text-[color:var(--text-main)] border border-[color:var(--accent)]/30 font-extrabold"
                    : "surface-soft text-[color:var(--text-soft)] hover:text-[color:var(--text-main)]"
                }`}
              >
                <span>{item.label}</span>
                {item.href === "/resume-roaster" && (
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-500 dark:text-rose-300 uppercase">
                    Free
                  </span>
                )}
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
