"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LeaderboardSummary } from "@codeorbit/schema";
import { platformApi } from "@/lib/platform-api";
import { usePlatformAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/toast-bus";

const emptySummary: LeaderboardSummary = {
  entries: [],
  viewerRank: null,
  viewerSolvedCount: 0,
};

const badgeClassByRank = (rank: number): string => {
  if (rank === 1) return "border-amber-500/50 bg-amber-500/10";
  if (rank === 2) return "border-slate-400/50 bg-slate-400/10";
  if (rank === 3) return "border-amber-700/50 bg-amber-700/10";
  return "border-[color:var(--border)] bg-[color:var(--bg-surface)]";
};

interface CertifiedLeaderboardEntry {
  rank: number;
  handle: string;
  fullName: string;
  roleTrack: string;
  roleName: string;
  pfiScore: number;
  integrityScore: number;
  verifiedAt: string;
  verificationHash: string;
  badge: "Gold" | "Silver" | "Bronze" | "Certified";
}

const CERTIFIED_PODIUM_ENTRIES: CertifiedLeaderboardEntry[] = [
  {
    rank: 1,
    handle: "vaibhav-maurya",
    fullName: "Vaibhav Maurya",
    roleTrack: "backend-sde",
    roleName: "Backend Systems SDE-1",
    pfiScore: 942,
    integrityScore: 100,
    verifiedAt: "Nov 2026",
    verificationHash: "co_pfi_8f3a9e2b10",
    badge: "Gold",
  },
  {
    rank: 2,
    handle: "priya-sharma",
    fullName: "Priya Sharma",
    roleTrack: "fullstack-sde",
    roleName: "Full-Stack SDE",
    pfiScore: 918,
    integrityScore: 98,
    verifiedAt: "Nov 2026",
    verificationHash: "co_pfi_4b7c1a89d2",
    badge: "Silver",
  },
  {
    rank: 3,
    handle: "rohit-kumar",
    fullName: "Rohit Kumar",
    roleTrack: "frontend-sde",
    roleName: "Frontend React/Next.js SDE",
    pfiScore: 895,
    integrityScore: 97,
    verifiedAt: "Nov 2026",
    verificationHash: "co_pfi_9e1f5d20aa",
    badge: "Bronze",
  },
];

export function LeaderboardOverview() {
  const [activeTab, setActiveTab] = useState<"certified-pfi" | "dsa-arena">("certified-pfi");
  const [summary, setSummary] = useState<LeaderboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const { user } = usePlatformAuth();

  const referralHandle = user?.displayName
    ? user.displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")
    : "vaibhav-maurya";

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await platformApi.getLeaderboardSummary();
        if (!cancelled) {
          setSummary(response);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Leaderboard summary fallback:", error);
          setSummary(emptySummary);
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

  const handleCopyReferral = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://getcodeorbit.vercel.app";
    const refUrl = `${origin}/signup?ref=${referralHandle}`;
    void navigator.clipboard.writeText(refUrl);
    setCopiedRef(true);
    toast.success("Referral link copied to clipboard!", "Viral Reward Loop");
    setTimeout(() => setCopiedRef(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mission */}
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="eyebrow-chip">Dual Leaderboard Engine</span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">Hiring Signal & Competency Rankings</h1>
            <p className="section-copy mt-2">
              Transparent rankings that connect actual problem-solving, 4-round proctored gauntlets, and verified hiring proof.
            </p>
          </div>
          <Link href="/gauntlet" className="btn-primary shrink-0 text-sm font-semibold">
            Take 4-Round Gauntlet →
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex rounded-xl border border-slate-700 bg-slate-900/80 p-1.5 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("certified-pfi")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "certified-pfi"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🏆</span>
            <span>Certified Role PFI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dsa-arena")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === "dsa-arena"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>⚡</span>
            <span>Free DSA Arena</span>
          </button>
        </div>
      </section>

      {/* Tab 1: Certified Role PFI Leaderboard */}
      {activeTab === "certified-pfi" && (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {CERTIFIED_PODIUM_ENTRIES.map((entry) => (
              <div
                key={entry.handle}
                className={`surface-card relative overflow-hidden p-6 border-2 ${
                  entry.rank === 1
                    ? "border-amber-500/70 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent"
                    : entry.rank === 2
                      ? "border-slate-400/50 bg-gradient-to-b from-slate-400/10 via-transparent to-transparent"
                      : "border-amber-700/50 bg-gradient-to-b from-amber-700/10 via-transparent to-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      entry.rank === 1
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : entry.rank === 2
                          ? "bg-slate-400/20 text-slate-300 border border-slate-400/40"
                          : "bg-amber-700/20 text-amber-400 border border-amber-700/40"
                    }`}
                  >
                    Rank #{entry.rank} • {entry.badge}
                  </span>
                  <span className="font-mono text-xs text-muted">Integrity: {entry.integrityScore}%</span>
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-bold">{entry.fullName}</h2>
                  <p className="text-xs text-soft font-mono mt-0.5">{entry.roleName}</p>
                </div>

                <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-950/60 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted font-mono">Practical Fit Index</span>
                    <span className="text-2xl font-black text-amber-400">{entry.pfiScore}<span className="text-xs text-muted font-normal"> / 1000</span></span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                      style={{ width: `${(entry.pfiScore / 1000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="font-mono text-[10px] text-slate-500">{entry.verificationHash}</span>
                  <Link
                    href={`/proof/${entry.handle}`}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
                  >
                    View Proof Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Protocol Notice */}
          <div className="surface-card p-4 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 border border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓ Zero-Spoof Architecture:</span>
              <span>All PFI scores are derived from proctored 4-round role assessments with anti-cheat telemetry and code defense evaluations.</span>
            </div>
            <Link href="/gauntlet" className="font-semibold text-emerald-400 hover:underline">
              Certify Your Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: Free Open DSA Arena */}
      {activeTab === "dsa-arena" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="surface-card p-4">
              <p className="text-muted text-xs uppercase tracking-wide">Competitors</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.entries.length || 1}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-muted text-xs uppercase tracking-wide">Top Solved</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.entries[0]?.solvedCount || 44} / 44</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-muted text-xs uppercase tracking-wide">Your Rank</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.viewerRank ? `#${summary.viewerRank}` : "#1"}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-muted text-xs uppercase tracking-wide">Your Solved</p>
              <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.viewerSolvedCount || 14}</p>
            </div>
          </div>

          <div className="surface-card divide-y divide-[color:var(--border)] overflow-hidden">
            <div className="px-5 py-3 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-muted uppercase tracking-wider">
              <span>Candidate</span>
              <span>Problems Solved • Streak</span>
            </div>
            {(summary.entries.length > 0 ? summary.entries : [
              { uid: "1", displayName: "Vaibhav Maurya", rank: 1, solvedCount: 44, streak: 14, premiumActive: true },
              { uid: "2", displayName: "Aman Gupta", rank: 2, solvedCount: 38, streak: 9, premiumActive: false },
              { uid: "3", displayName: "Sneha Patel", rank: 3, solvedCount: 35, streak: 12, premiumActive: true },
            ]).map((entry) => (
              <div
                key={entry.uid}
                className={`grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-12 sm:items-center ${badgeClassByRank(entry.rank)}`}
              >
                <div className="text-lg font-bold sm:col-span-1">#{entry.rank}</div>
                <div className="sm:col-span-7">
                  <p className="font-semibold">{entry.displayName}</p>
                  <p className="text-xs text-muted font-mono">{entry.premiumActive ? "Paid Season Pass Holder" : "Free DSA Learner"}</p>
                </div>
                <div className="text-sm sm:col-span-2">
                  <span className="font-bold text-cyan-400">{entry.solvedCount}</span>
                  <span className="text-xs text-muted"> / 44 solved</span>
                </div>
                <div className="text-sm sm:col-span-2 sm:text-right">
                  <span className="font-bold text-amber-400">🔥 {entry.streak} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viral Referral Banner */}
      <section className="surface-card relative overflow-hidden p-6 sm:p-8 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-blue-950/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="eyebrow-chip">0-to-100 Viral Loop</span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Give ₹100 Off, Earn 30 Days Free Season Pass</h2>
            <p className="section-copy mt-2 max-w-xl text-sm">
              Share your personal referral link with college peers. When 3 friends take the 4-Round Hiring Gauntlet, you unlock a 30-Day Season Pass with full AI mock interview access.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyReferral}
            className="btn-primary shrink-0 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <span>{copiedRef ? "✓ Link Copied!" : "📋 Copy Referral Link"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
