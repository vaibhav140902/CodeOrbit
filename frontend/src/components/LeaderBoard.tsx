import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";

interface LeaderboardRow {
  uid: string;
  displayName: string;
  email: string;
  avatarSeed: string;
  score: number;
  solvedCount: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissions: number;
  totalAccepted: number;
  acceptanceRate: number;
}

interface RankedRow extends LeaderboardRow {
  rank: number;
}

const badgeClassByRank = (rank: number): string => {
  if (rank === 1) return "border-yellow-500/40 bg-yellow-500/10";
  if (rank === 2) return "border-slate-400/40 bg-slate-400/10";
  if (rank === 3) return "border-orange-500/40 bg-orange-500/10";
  return "border-[color:var(--border)] bg-[color:var(--bg-surface)]";
};

const safeNumber = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

export const Leaderboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<RankedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setErrorMessage(null);
        const snapshot = await getDocs(collection(db, "leaderboard"));

        const mapped = snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            uid: String(data.uid ?? entry.id),
            displayName: String(data.displayName ?? "User"),
            email: String(data.email ?? ""),
            avatarSeed: String(data.avatarSeed ?? entry.id),
            score: safeNumber(data.score),
            solvedCount: safeNumber(data.solvedCount),
            easySolved: safeNumber(data.easySolved),
            mediumSolved: safeNumber(data.mediumSolved),
            hardSolved: safeNumber(data.hardSolved),
            totalSubmissions: safeNumber(data.totalSubmissions),
            totalAccepted: safeNumber(data.totalAccepted),
            acceptanceRate: safeNumber(data.acceptanceRate),
          } as LeaderboardRow;
        });

        mapped.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
          if (b.acceptanceRate !== a.acceptanceRate) return b.acceptanceRate - a.acceptanceRate;
          if (b.totalAccepted !== a.totalAccepted) return b.totalAccepted - a.totalAccepted;
          return a.displayName.localeCompare(b.displayName);
        });

        const ranked = mapped.map((entry, index) => ({ ...entry, rank: index + 1 }));
        setRows(ranked);
      } catch (error: unknown) {
        const errorCode = (error as { code?: string }).code;
        if (errorCode === "permission-denied") {
          setErrorMessage(
            "Permission denied while loading leaderboard. Deploy updated Firestore rules and sign in again."
          );
        } else {
          console.error("Error loading leaderboard:", error);
          setErrorMessage("Could not load leaderboard right now.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const currentUserRow = useMemo(() => {
    if (!user) return null;
    return rows.find((entry) => entry.uid === user.uid) ?? null;
  }, [rows, user]);

  const percentile = useMemo(() => {
    if (!currentUserRow || rows.length <= 1) return 0;
    return Number((((rows.length - currentUserRow.rank) / (rows.length - 1)) * 100).toFixed(1));
  }, [currentUserRow, rows.length]);

  const totalScore = rows.reduce((sum, row) => sum + row.score, 0);
  const averageScore = rows.length > 0 ? Math.round(totalScore / rows.length) : 0;

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-[color:var(--accent)]" />
          <p className="text-muted">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-container">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Competition</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">Leaderboard</h1>
          <p className="text-muted mt-2 text-base sm:text-lg">Track rank, solved problems, and acceptance efficiency.</p>
          {errorMessage && (
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Total Competitors</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{rows.length}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Total Score</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{totalScore}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Average Score</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{averageScore}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase tracking-wide">Your Percentile</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{currentUserRow ? `${percentile}%` : "--"}</p>
          </div>
        </div>

        {currentUserRow && (
          <div className="surface-card mb-8 p-5">
            <h2 className="text-lg font-semibold mb-3">Your Standing</h2>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
              <div className="surface-soft p-3">
                <p className="text-muted">Rank</p>
                <p className="text-2xl font-bold">#{currentUserRow.rank}</p>
              </div>
              <div className="surface-soft p-3">
                <p className="text-muted">Score</p>
                <p className="text-2xl font-bold">{currentUserRow.score}</p>
              </div>
              <div className="surface-soft p-3">
                <p className="text-muted">Solved</p>
                <p className="text-2xl font-bold">{currentUserRow.solvedCount}</p>
              </div>
              <div className="surface-soft p-3">
                <p className="text-muted">Acceptance</p>
                <p className="text-2xl font-bold">{currentUserRow.acceptanceRate.toFixed(1)}%</p>
              </div>
              <div className="surface-soft p-3">
                <p className="text-muted">Accepted</p>
                <p className="text-2xl font-bold">{currentUserRow.totalAccepted}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rows.length === 0 ? (
            <div className="surface-card py-16 text-center">
              <p className="text-2xl">No leaderboard data yet.</p>
              <p className="text-muted mt-2">Submit accepted solutions to appear here.</p>
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.uid}
                className={`rounded-xl border px-4 py-4 transition-all sm:px-5 ${badgeClassByRank(row.rank)} ${
                  user?.uid === row.uid ? "ring-2 ring-[color:var(--ring)]" : ""
                }`}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
                  <div className="text-lg font-bold lg:col-span-1">#{row.rank}</div>
                  <div className="flex items-center gap-3 lg:col-span-4">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.avatarSeed}`}
                      alt={row.displayName}
                      className="w-10 h-10 rounded-full border border-slate-500"
                    />
                    <div>
                      <p className="font-semibold leading-tight">{row.displayName}</p>
                      <p className="text-muted text-xs">{row.email || row.uid}</p>
                    </div>
                  </div>
                  <div className="text-sm lg:col-span-2">
                    <p className="text-muted">Solved</p>
                    <p className="font-semibold">
                      {row.solvedCount} <span className="text-muted text-xs">(E{row.easySolved}/M{row.mediumSolved}/H{row.hardSolved})</span>
                    </p>
                  </div>
                  <div className="text-sm lg:col-span-2">
                    <p className="text-muted">Acceptance</p>
                    <p className="font-semibold">{row.acceptanceRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-sm lg:col-span-1">
                    <p className="text-muted">Accepted</p>
                    <p className="font-semibold">{row.totalAccepted}</p>
                  </div>
                  <div className="text-left lg:col-span-2 lg:text-right">
                    <p className="text-muted text-xs uppercase tracking-wide">Score</p>
                    <p className="text-2xl font-bold text-[color:var(--accent)]">{row.score}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
