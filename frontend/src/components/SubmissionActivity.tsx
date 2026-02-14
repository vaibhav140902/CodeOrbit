import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, registerables, ChartConfiguration } from "chart.js";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";

Chart.register(...registerables);

type Difficulty = "Easy" | "Medium" | "Hard";

interface SubmissionRecord {
  id: string;
  problemId: string;
  problemName: string;
  status: string;
  submitDate: Date;
  difficulty: Difficulty;
}

interface ProblemRecord {
  id: string;
  difficulty: Difficulty;
}

interface DailyPoint {
  label: string;
  count: number;
}

const normalizeDifficulty = (value: unknown): Difficulty => {
  if (value === "Medium" || value === "Hard") return value;
  return "Easy";
};

const dayKey = (date: Date): string => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString();
};

const buildLastNDays = (totalDays: number): Date[] => {
  const dates: Date[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates;
};

const calculateStreaks = (acceptedDays: Set<string>): { current: number; longest: number } => {
  if (acceptedDays.size === 0) {
    return { current: 0, longest: 0 };
  }

  const sortedDays = Array.from(acceptedDays)
    .map((entry) => new Date(entry))
    .sort((a, b) => a.getTime() - b.getTime());

  let longest = 1;
  let running = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const diffInDays = Math.round(
      (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diffInDays === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString();
    if (acceptedDays.has(key)) {
      current += 1;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  return { current, longest };
};

const cellClassForCount = (count: number): string => {
  if (count >= 6) return "bg-emerald-400";
  if (count >= 4) return "bg-emerald-500/80";
  if (count >= 2) return "bg-emerald-700/80";
  if (count >= 1) return "bg-emerald-900";
  return "bg-slate-800";
};

const SubmissionActivity = () => {
  const { user } = useAuth();
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user?.uid) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      try {
        setErrorMessage(null);

        const [problemsSnapshot, submissionsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "problems"), limit(500))),
          getDocs(query(collection(db, "submissions"), where("userId", "==", user.uid), limit(1000))),
        ]);

        const problemsById = new Map<string, ProblemRecord>();
        problemsSnapshot.forEach((problemDoc) => {
          const data = problemDoc.data();
          const difficulty = normalizeDifficulty(
            data.difficulty ?? data.Difficulty ?? data["Difficulty "]
          );
          problemsById.set(problemDoc.id, {
            id: problemDoc.id,
            difficulty,
          });
        });

        const mappedSubmissions: SubmissionRecord[] = submissionsSnapshot.docs
          .map((submissionDoc) => {
            const data = submissionDoc.data() as Record<string, unknown>;
            const timestampCandidate = (data.submitTime ?? data.timestamp) as {
              toDate?: () => Date;
            };

            if (!timestampCandidate || typeof timestampCandidate.toDate !== "function") {
              return null;
            }

            const problemId = String(data.problemId ?? "");
            const fallbackDifficulty = problemsById.get(problemId)?.difficulty ?? "Easy";
            const difficulty = normalizeDifficulty(data.problemDifficulty ?? fallbackDifficulty);

            return {
              id: submissionDoc.id,
              problemId,
              problemName: String(data.problemName ?? "Untitled Problem"),
              status: String(data.status ?? "Submitted"),
              submitDate: timestampCandidate.toDate(),
              difficulty,
            } as SubmissionRecord;
          })
          .filter((entry): entry is SubmissionRecord => entry !== null)
          .sort((a, b) => b.submitDate.getTime() - a.submitDate.getTime());

        setSubmissions(mappedSubmissions);
      } catch (error: unknown) {
        const errorCode = (error as { code?: string }).code;
        if (errorCode === "permission-denied") {
          setErrorMessage(
            "Permission denied while reading activity data. Deploy rules and sign in again."
          );
        } else {
          console.error("Error loading activity:", error);
          setErrorMessage("Could not load activity right now.");
        }
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user?.uid]);

  const acceptedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.status === "Accepted"),
    [submissions]
  );

  const uniqueSolvedByProblem = useMemo(() => {
    const map = new Map<string, SubmissionRecord>();
    for (const submission of acceptedSubmissions) {
      if (!map.has(submission.problemId)) {
        map.set(submission.problemId, submission);
      }
    }
    return map;
  }, [acceptedSubmissions]);

  const solvedCounts = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;

    uniqueSolvedByProblem.forEach((record) => {
      if (record.difficulty === "Easy") easy += 1;
      if (record.difficulty === "Medium") medium += 1;
      if (record.difficulty === "Hard") hard += 1;
    });

    return { easy, medium, hard };
  }, [uniqueSolvedByProblem]);

  const acceptanceRate = useMemo(() => {
    if (submissions.length === 0) return 0;
    return Number(((acceptedSubmissions.length / submissions.length) * 100).toFixed(1));
  }, [acceptedSubmissions.length, submissions.length]);

  const streaks = useMemo(() => {
    const acceptedDays = new Set<string>();
    for (const submission of acceptedSubmissions) {
      acceptedDays.add(dayKey(submission.submitDate));
    }
    return calculateStreaks(acceptedDays);
  }, [acceptedSubmissions]);

  const chartData = useMemo<DailyPoint[]>(() => {
    const counts = new Map<string, number>();
    for (const submission of submissions) {
      const key = dayKey(submission.submitDate);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return buildLastNDays(30).map((date) => {
      const key = dayKey(date);
      return {
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: counts.get(key) || 0,
      };
    });
  }, [submissions]);

  const heatmapWeeks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const submission of submissions) {
      const key = dayKey(submission.submitDate);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const days = buildLastNDays(84);
    const weeks: { date: Date; count: number }[][] = [];

    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7).map((date) => ({
        date,
        count: counts.get(dayKey(date)) || 0,
      }));
      weeks.push(week);
    }

    return weeks;
  }, [submissions]);

  const recentAccepted = useMemo(
    () => acceptedSubmissions.slice(0, 8),
    [acceptedSubmissions]
  );

  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, "rgba(34, 211, 238, 0.45)");
    gradient.addColorStop(1, "rgba(34, 211, 238, 0.0)");

    const config: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels: chartData.map((entry) => entry.label),
        datasets: [
          {
            label: "Submissions",
            data: chartData.map((entry) => entry.count),
            borderColor: "rgb(34, 211, 238)",
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "rgb(34, 211, 238)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            borderColor: "rgba(34, 211, 238, 0.5)",
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.parsed.y} submissions`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#94a3b8", stepSize: 2 },
            grid: { color: "rgba(100, 116, 139, 0.15)" },
          },
          x: {
            ticks: { color: "#94a3b8", maxRotation: 50, minRotation: 50 },
            grid: { display: false },
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-[color:var(--accent)]" />
          <p className="text-muted">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-container max-w-7xl">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Performance</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            Activity Dashboard
          </h1>
          <p className="text-muted mt-2">Submission trends, solved progress, and coding consistency.</p>
          {errorMessage && (
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Total Submissions</p>
            <p className="text-3xl font-bold">{submissions.length}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Accepted</p>
            <p className="text-3xl font-bold">{acceptedSubmissions.length}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Acceptance Rate</p>
            <p className="text-3xl font-bold">{acceptanceRate}%</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Current Streak</p>
            <p className="text-3xl font-bold">{streaks.current}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Longest Streak</p>
            <p className="text-3xl font-bold">{streaks.longest}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
          <div className="surface-card xl:col-span-8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Submission Trend (Last 30 Days)</h2>
              <span className="text-muted text-xs">Daily attempts</span>
            </div>
            <div className="h-80">
              <canvas ref={canvasRef} />
            </div>
          </div>

          <div className="surface-card xl:col-span-4 p-5">
            <h2 className="text-lg font-semibold mb-4">Solved by Difficulty</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-200">Easy</span>
                  <span className="text-2xl font-bold">{solvedCounts.easy}</span>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-amber-200">Medium</span>
                  <span className="text-2xl font-bold">{solvedCounts.medium}</span>
                </div>
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-rose-200">Hard</span>
                  <span className="text-2xl font-bold">{solvedCounts.hard}</span>
                </div>
              </div>
              <div className="surface-soft p-3">
                <div className="flex items-center justify-between">
                  <span className="text-soft">Unique Solved</span>
                  <span className="text-2xl font-bold">{uniqueSolvedByProblem.size}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="surface-card xl:col-span-7 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Consistency Heatmap</h2>
              <span className="text-muted text-xs">Last 12 weeks</span>
            </div>

            <div className="overflow-x-auto">
              <div className="inline-flex gap-1">
                {heatmapWeeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((entry) => (
                      <div
                        key={entry.date.toISOString()}
                        title={`${entry.date.toDateString()} • ${entry.count} submissions`}
                        className={`h-4 w-4 rounded-sm border border-[color:var(--border)] ${cellClassForCount(entry.count)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-muted mt-3 flex items-center gap-3 text-xs">
              <span>Less</span>
              <div className="h-3 w-3 rounded-sm border border-[color:var(--border)] bg-slate-800" />
              <div className="h-3 w-3 rounded-sm border border-[color:var(--border)] bg-emerald-900" />
              <div className="h-3 w-3 rounded-sm border border-[color:var(--border)] bg-emerald-700/80" />
              <div className="h-3 w-3 rounded-sm border border-[color:var(--border)] bg-emerald-500/80" />
              <div className="h-3 w-3 rounded-sm border border-[color:var(--border)] bg-emerald-400" />
              <span>More</span>
            </div>
          </div>

          <div className="surface-card xl:col-span-5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Accepted</h2>
              <span className="text-muted text-xs">Latest 8</span>
            </div>

            {recentAccepted.length === 0 ? (
              <p className="text-muted text-sm">No accepted submissions yet. Solve one problem to start your streak.</p>
            ) : (
              <div className="space-y-2">
                {recentAccepted.map((submission) => (
                  <div key={submission.id} className="surface-soft p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-sm line-clamp-1">{submission.problemName}</p>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          submission.difficulty === "Easy"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : submission.difficulty === "Medium"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {submission.difficulty}
                      </span>
                    </div>
                    <p className="text-muted mt-1 text-xs">{submission.submitDate.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionActivity;
