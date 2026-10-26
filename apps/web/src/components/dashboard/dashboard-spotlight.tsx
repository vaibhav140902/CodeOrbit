"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BillingSummary, DashboardSummary } from "@codeorbit/schema";
import { Button } from "@codeorbit/ui";
import { usePlatformAuth } from "@/lib/auth-context";
import { platformApi } from "@/lib/platform-api";

const emptySummary: DashboardSummary = {
  streak: 0,
  solvedCount: 0,
  weakTopics: [],
  recommendedTrack: "Verified readiness sprint",
  premiumActive: false,
};

const freeBilling: BillingSummary = {
  planId: "free",
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

export function DashboardSpotlight() {
  const { user } = usePlatformAuth();
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [billing, setBilling] = useState<BillingSummary>(freeBilling);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setSummary(emptySummary);
      setBilling(freeBilling);
      setNotice(null);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const [dashboardSummary, billingSummary] = await Promise.all([
          platformApi.getDashboardSummary(),
          platformApi.getBillingSummary().catch(() => freeBilling),
        ]);

        if (!cancelled) {
          setSummary(dashboardSummary);
          setBilling(billingSummary);
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Dashboard spotlight fallback:", error);
          setSummary(emptySummary);
          setBilling(freeBilling);
          setNotice("Personalized progress cards will fill in as soon as the secure dashboard feed finishes syncing.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const weakTopics = summary.weakTopics.length > 0 ? summary.weakTopics.slice(0, 3) : ["Arrays", "DP", "Graphs"];

  return (
    <section className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Personalized Dashboard</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {user ? "Your hiring momentum in one place." : "Sign in to unlock your private hiring dashboard."}
            </h2>
            <p className="text-muted mt-3 max-w-2xl text-sm leading-7 sm:text-base">
              Track readiness-building practice, weak topics, premium access, and what to improve before you apply.
            </p>
          </div>

          <div className="surface-soft min-w-[180px] p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Recommended Track</p>
            <p className="mt-2 text-lg font-semibold">{summary.recommendedTrack}</p>
            <p className="mt-2 text-sm text-[color:var(--accent)]">
              {billing.premiumActive ? "Pro workflow unlocked" : "Free plan with upgrade path"}
            </p>
          </div>
        </div>

        {notice && (
          <div className="surface-soft mt-4 border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
            {notice}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-soft p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Streak</p>
            <p className="mt-2 text-2xl font-bold">{summary.streak}</p>
          </div>
          <div className="surface-soft p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Solved</p>
            <p className="mt-2 text-2xl font-bold">{summary.solvedCount}</p>
          </div>
          <div className="surface-soft p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Weak Topics</p>
            <p className="mt-2 text-lg font-semibold">{weakTopics[0]}</p>
          </div>
          <div className="surface-soft p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Plan</p>
            <p className="mt-2 text-lg font-semibold">{billing.planName}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild variant="primary">
            <Link href="/problems">Continue solving</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/tracks">Review next track</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/mock-interview">Start mock interview</Link>
          </Button>
        </div>
      </div>

      <div className="surface-card p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Weak Topic Watch</p>
        <div className="mt-4 space-y-3">
          {weakTopics.map((topic, index) => (
            <div key={topic} className="surface-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{topic}</p>
                  <p className="text-muted mt-1 text-sm">
                    {index === 0 ? "Highest AI attention needed" : "Recommended for revision this week"}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold">
                  {index === 0 ? "Priority" : "Queued"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-soft">
          Company and role tracks help convert problem solving into readiness, proof, and better application timing.
        </div>
      </div>
    </section>
  );
}
