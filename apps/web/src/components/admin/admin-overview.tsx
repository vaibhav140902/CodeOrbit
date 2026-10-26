"use client";

import { useEffect, useState } from "react";
import type { AdminSummary } from "@codeorbit/schema";
import { adminContentQueue, featureFlags, publicPricingTiers } from "@/data/hiring-os";
import { platformApi } from "@/lib/platform-api";

const emptySummary: AdminSummary = {
  totalUsers: 0,
  activeSubscriptions: 0,
  publishedProblems: 0,
  totalRevenuePaise: 0,
  aiUsageToday: 0,
};

const formatCurrency = (amountPaise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);

export function AdminOverview() {
  const [summary, setSummary] = useState<AdminSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [roleEmail, setRoleEmail] = useState("");
  const [roleValue, setRoleValue] = useState<"recruiter_beta" | "campus_beta" | "user">("recruiter_beta");
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await platformApi.getAdminSummary();
        if (!cancelled) {
          setSummary(response);
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Admin summary fallback:", error);
          setSummary(emptySummary);
          setNotice("Admin analytics will fill in as soon as the secure data sources are connected in this environment.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRoleAssign = async () => {
    setRoleSaving(true);
    setNotice(null);

    try {
      const profile = await platformApi.setWorkspaceRole({
        targetEmail: roleEmail,
        role: roleValue,
      });
      setNotice(`Updated ${profile.email} to role ${profile.role}.`);
      setRoleEmail("");
    } catch (error) {
      console.error("Role assignment failed:", error);
      setNotice((error as { message?: string })?.message ?? "Unable to update workspace role.");
    } finally {
      setRoleSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page-container">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Admin</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">Admin Dashboard</h1>
          <p className="text-muted mt-2 text-base sm:text-lg">Monitor users, premium growth, content readiness, and revenue from the secure backend.</p>
        </div>

        {notice && (
          <div className="surface-card mb-6 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            {notice}
          </div>
        )}

        {loading && (
          <div className="surface-card mb-6 p-4 text-sm text-muted">
            Loading secure admin analytics...
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Users</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.totalUsers}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Active Premium</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.activeSubscriptions}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Published Problems</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.publishedProblems}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Revenue</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{formatCurrency(summary.totalRevenuePaise)}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">AI Calls Today</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.aiUsageToday}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Monetization Snapshot</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="surface-soft p-4">
                <p className="text-muted text-xs uppercase tracking-wide">Conversion Base</p>
                <p className="mt-2 text-2xl font-bold">{summary.totalUsers}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-muted text-xs uppercase tracking-wide">Premium Active</p>
                <p className="mt-2 text-2xl font-bold">{summary.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Content Readiness</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="surface-soft p-4">
                <p className="text-muted text-xs uppercase tracking-wide">Published Bank</p>
                <p className="mt-2 text-2xl font-bold">{summary.publishedProblems}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-muted text-xs uppercase tracking-wide">AI Traffic Today</p>
                <p className="mt-2 text-2xl font-bold">{summary.aiUsageToday}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Content Queue</h2>
            <div className="mt-4 space-y-3">
              {adminContentQueue.map((item) => (
                <div key={item.id} className="surface-soft p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                        {item.type} · {item.owner}
                      </p>
                    </div>
                    <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Feature Flags</h2>
            <div className="mt-4 space-y-3">
              {featureFlags.map((flag) => (
                <div key={flag.key} className="surface-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{flag.label}</p>
                      <p className="mt-1 text-sm text-soft">{flag.description}</p>
                    </div>
                    <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs">
                      {flag.enabledDefault ? "on" : "off"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 surface-card p-5">
          <h2 className="text-lg font-semibold">Pricing Config</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {publicPricingTiers.map((tier) => (
              <div key={tier.id} className="surface-soft p-4">
                <p className="font-semibold">{tier.title}</p>
                <p className="mt-1 text-sm text-soft">{tier.priceLabel}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{tier.availability}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 surface-card p-5">
          <h2 className="text-lg font-semibold">Workspace Role Access</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto]">
            <input
              className="field-input"
              type="email"
              placeholder="candidate-or-partner@example.com"
              value={roleEmail}
              onChange={(event) => setRoleEmail(event.target.value)}
            />
            <select
              className="field-select"
              value={roleValue}
              onChange={(event) => setRoleValue(event.target.value as "recruiter_beta" | "campus_beta" | "user")}
            >
              <option value="recruiter_beta">Recruiter beta</option>
              <option value="campus_beta">Campus beta</option>
              <option value="user">Standard user</option>
            </select>
            <button
              onClick={() => void handleRoleAssign()}
              className="btn-primary"
              disabled={roleSaving || !roleEmail}
            >
              {roleSaving ? "Saving..." : "Update role"}
            </button>
          </div>
          <p className="mt-3 text-sm text-soft">
            Role assignment updates the authenticated workspace profile used by beta access guards.
          </p>
        </div>
      </div>
    </div>
  );
}
