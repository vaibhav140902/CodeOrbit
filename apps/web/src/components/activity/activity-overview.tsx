"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivitySummary, DashboardSummary } from "@codeorbit/schema";
import { usePlatformAuth } from "@/lib/auth-context";
import { platformApi } from "@/lib/platform-api";

const emptySummary: ActivitySummary = {
  recentSubmissions: [],
  pendingCount: 0,
  acceptedCount: 0,
  totalAttempts: 0,
};

const emptyDashboard: DashboardSummary = {
  streak: 0,
  solvedCount: 0,
  weakTopics: [],
  recommendedTrack: "Company-first revision",
  premiumActive: false,
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function ActivityOverview() {
  const { user } = usePlatformAuth();
  const [summary, setSummary] = useState<ActivitySummary>(emptySummary);
  const [dashboard, setDashboard] = useState<DashboardSummary>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [activityResponse, dashboardResponse] = await Promise.all([
          platformApi.getActivitySummary(),
          platformApi.getDashboardSummary().catch(() => emptyDashboard),
        ]);
        if (!cancelled) {
          setSummary(activityResponse);
          setDashboard(dashboardResponse);
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Activity summary fallback:", error);
          setSummary(emptySummary);
          setDashboard(emptyDashboard);
          setNotice("Submission analytics will appear here as soon as the secure activity feed is available.");
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

  const handleShare = async () => {
    const baseUrl = typeof window === "undefined" ? "https://codeorbit.app" : window.location.origin;
    const referralCode = user?.uid?.slice(0, 8) ?? "guest";
    const shareUrl = `${baseUrl}/signup?ref=${referralCode}`;
    const shareText = `I'm building my coding streak on CodeOrbit. Join my referral link: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "CodeOrbit referral",
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
      setShareNotice("Referral link ready to share.");
    } catch (error) {
      console.error("Share action failed:", error);
      setShareNotice("Sharing was cancelled. You can try again anytime.");
    }
  };

  return (
    <div className="app-shell">
      <div className="page-container">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Progress</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">Activity</h1>
          <p className="text-muted mt-2 text-base sm:text-lg">Track your latest attempts, accepted runs, and pending submissions.</p>
        </div>

        {notice && (
          <div className="surface-card mb-6 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            {notice}
          </div>
        )}

        {loading && (
          <div className="surface-card mb-6 p-4 text-sm text-muted">
            Loading secure activity feed...
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Recent Attempts</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.totalAttempts}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Accepted</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.acceptedCount}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Pending</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.pendingCount}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Latest Window</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{summary.recentSubmissions.length}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="surface-card p-5">
            <p className="text-muted text-xs uppercase tracking-wide">Current Streak</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.streak}</p>
            <p className="text-muted mt-2 text-sm">Recommended next track: {dashboard.recommendedTrack}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-muted text-xs uppercase tracking-wide">AI Powerups</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/mock-interview" className="btn-secondary text-center text-sm">
                Open mock interview
              </Link>
              <Link href="/resume-builder" className="btn-secondary text-center text-sm">
                Open resume builder
              </Link>
            </div>
          </div>
          <div className="surface-card p-5">
            <p className="text-muted text-xs uppercase tracking-wide">Referral</p>
            <p className="mt-2 text-sm leading-7 text-soft">
              Share your invite link to bring friends into the company-first prep flow and create a viral growth loop.
            </p>
            <button onClick={() => void handleShare()} className="btn-primary mt-4 text-sm">
              Share referral link
            </button>
            {shareNotice && <p className="mt-3 text-sm text-[color:var(--accent)]">{shareNotice}</p>}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-[color:var(--border)] px-5 py-4">
            <h2 className="text-lg font-semibold">Recent Submissions</h2>
            <p className="text-muted mt-1 text-sm">All activity is now streamed through authenticated Cloud Functions.</p>
          </div>

          {summary.recentSubmissions.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-2xl">No submission activity yet.</p>
              <p className="text-muted mt-2">Run and submit solutions to build your activity timeline.</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--border)]">
              {summary.recentSubmissions.map((submission) => (
                <div key={submission.id} className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-4">
                    <p className="font-semibold leading-tight">{submission.problemName}</p>
                    <p className="text-muted mt-1 text-xs">{submission.problemId}</p>
                  </div>
                  <div className="text-sm lg:col-span-2">
                    <p className="text-muted">Language</p>
                    <p className="font-semibold capitalize">{submission.language}</p>
                  </div>
                  <div className="text-sm lg:col-span-2">
                    <p className="text-muted">Status</p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        submission.status === "Accepted"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : submission.status === "PENDING"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <div className="text-sm lg:col-span-4 lg:text-right">
                    <p className="text-muted">Submitted</p>
                    <p className="font-semibold">{formatTimestamp(submission.submittedAtIso)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
