"use client";

import { useEffect, useState } from "react";
import type { LeaderboardSummary } from "@codeorbit/schema";
import { platformApi } from "@/lib/platform-api";

const emptySummary: LeaderboardSummary = {
  entries: [],
  viewerRank: null,
  viewerSolvedCount: 0,
};

const badgeClassByRank = (rank: number): string => {
  if (rank === 1) return "border-yellow-500/40 bg-yellow-500/10";
  if (rank === 2) return "border-slate-400/40 bg-slate-400/10";
  if (rank === 3) return "border-orange-500/40 bg-orange-500/10";
  return "border-[color:var(--border)] bg-[color:var(--bg-surface)]";
};

export function LeaderboardOverview() {
  const [summary, setSummary] = useState<LeaderboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await platformApi.getLeaderboardSummary();
        if (!cancelled) {
          setSummary(response);
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Leaderboard summary fallback:", error);
          setSummary(emptySummary);
          setNotice("Leaderboard ranks will appear here after the secure scoring feed finishes syncing.");
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

  const topSolved = summary.entries[0]?.solvedCount ?? 0;

  return (
    <div className="app-shell">
      <div className="page-container">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Competition</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">Leaderboard</h1>
          <p className="text-muted mt-2 text-base sm:text-lg">Track rank, solved problems, and streak momentum from the secure backend.</p>
        </div>

        {notice && (
          <div className="surface-card mb-6 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            {notice}
          </div>
        )}

        {loading && (
          <div className="surface-card mb-6 p-4 text-sm text-muted">
            Loading secure leaderboard...
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Total Competitors</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.entries.length}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Top Solved</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{topSolved}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Your Rank</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.viewerRank ? `#${summary.viewerRank}` : "--"}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Your Solved</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.viewerSolvedCount}</p>
          </div>
        </div>

        <div className="space-y-3">
          {summary.entries.length === 0 ? (
            <div className="surface-card py-16 text-center">
              <p className="text-2xl">No leaderboard data yet.</p>
              <p className="text-muted mt-2">Accepted solutions will place users here automatically.</p>
            </div>
          ) : (
            summary.entries.map((entry) => (
              <div
                key={entry.uid}
                className={`rounded-xl border px-4 py-4 transition-all sm:px-5 ${badgeClassByRank(entry.rank)}`}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
                  <div className="text-lg font-bold lg:col-span-1">#{entry.rank}</div>
                  <div className="lg:col-span-5">
                    <p className="font-semibold leading-tight">{entry.displayName}</p>
                    <p className="text-muted mt-1 text-xs">{entry.premiumActive ? "Premium member" : "Free member"}</p>
                  </div>
                  <div className="text-sm lg:col-span-2">
                    <p className="text-muted">Solved</p>
                    <p className="font-semibold">{entry.solvedCount}</p>
                  </div>
                  <div className="text-sm lg:col-span-2">
                    <p className="text-muted">Streak</p>
                    <p className="font-semibold">{entry.streak} days</p>
                  </div>
                  <div className="text-left lg:col-span-2 lg:text-right">
                    <p className="text-muted text-xs uppercase tracking-wide">Tier</p>
                    <p className="text-lg font-bold text-[color:var(--accent)]">
                      {entry.premiumActive ? "Premium" : "Free"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
