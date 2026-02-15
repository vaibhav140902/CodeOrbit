import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useNavigate } from "react-router-dom";
import { InlineError } from "./system/InlineError";
import { SkeletonCard } from "./system/SkeletonCard";

type Difficulty = "Easy" | "Medium" | "Hard";
type DifficultyFilter = Difficulty | "All";

interface Problem {
  id: string;
  problemName: string;
  tags: string[];
  difficulty: Difficulty;
}

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

const difficultyBadgeClass: Record<Difficulty, string> = {
  Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Hard: "border-rose-500/30 bg-rose-500/10 text-rose-500",
};

export const ProblemList = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [topicFilter, setTopicFilter] = useState("All");

  const normalizeDifficulty = (value: unknown): Difficulty => {
    if (value === "Medium" || value === "Hard") return value;
    return "Easy";
  };

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const querySnapshot = await getDocs(collection(db, "problems"));
      const problemsData = querySnapshot.docs.map((problemDoc) => {
        const data = problemDoc.data();
        const rawDifficulty = data.difficulty ?? data.Difficulty ?? data["Difficulty "];
        const tags = Array.isArray(data.tags)
          ? data.tags
          : Array.isArray(data.tag)
          ? data.tag
          : [];

        return {
          id: problemDoc.id,
          problemName: String(data.problemName ?? data.title ?? "Untitled Problem"),
          tags: tags.map((tag) => String(tag)),
          difficulty: normalizeDifficulty(rawDifficulty),
        } as Problem;
      });

      setProblems(problemsData);
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === "permission-denied") {
        setErrorMessage("Permission denied while reading problems. Deploy rules and sign in again.");
      } else {
        console.error("Error fetching problems:", error);
        setErrorMessage("Failed to load problems.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const availableTopics = useMemo(() => {
    const tagSet = new Set<string>();
    for (const problem of problems) {
      for (const tag of problem.tags) {
        tagSet.add(tag);
      }
    }
    return ["All", ...Array.from(tagSet).sort((a, b) => a.localeCompare(b))];
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSearch = problem.problemName.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
      const matchesTopic = topicFilter === "All" || problem.tags.includes(topicFilter);
      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [problems, search, difficultyFilter, topicFilter]);

  const problemsByDifficulty = useMemo(() => {
    const grouped: Record<Difficulty, Problem[]> = {
      Easy: [],
      Medium: [],
      Hard: [],
    };

    for (const problem of filteredProblems) {
      grouped[problem.difficulty].push(problem);
    }

    return grouped;
  }, [filteredProblems]);

  const totalByDifficulty = useMemo(() => {
    const grouped: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
    for (const problem of problems) {
      grouped[problem.difficulty] += 1;
    }
    return grouped;
  }, [problems]);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="page-container">
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Problem bank</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Problems</h1>
          </div>
          <div className="space-y-4">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-container">
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Problem bank</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Problems</h1>
            <p className="text-muted mt-2 text-sm sm:text-base">
              Solve {problems.length} coding challenges across core interview topics.
            </p>
          </div>
          <button onClick={fetchProblems} className="btn-secondary text-sm">
            Refresh
          </button>
        </section>

        {errorMessage && <InlineError message={errorMessage} onRetry={fetchProblems} className="mb-6" />}

        <section className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Easy</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{totalByDifficulty.Easy}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Medium</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{totalByDifficulty.Medium}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Hard</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{totalByDifficulty.Hard}</p>
          </div>
        </section>

        <section className="surface-card mb-6 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search problem..."
              className="field-input"
            />
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
              className="field-select"
            >
              <option value="All">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              className="field-select"
            >
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic === "All" ? "All topics" : topic}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-4 sm:space-y-6">
          {DIFFICULTY_ORDER.map((difficulty) => (
            <article key={difficulty} className="surface-card overflow-hidden">
              <header className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3 sm:px-5 sm:py-4">
                <h2 className="text-lg font-semibold sm:text-xl">{difficulty}</h2>
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${difficultyBadgeClass[difficulty]}`}>
                  {problemsByDifficulty[difficulty].length}
                </span>
              </header>

              <div className="divide-y divide-[color:var(--border)]">
                {problemsByDifficulty[difficulty].length === 0 ? (
                  <p className="text-muted px-5 py-5 text-sm">No problems for current filters.</p>
                ) : (
                  problemsByDifficulty[difficulty].map((problem, index) => (
                    <button
                      key={problem.id}
                      onClick={() => navigate(`/problems/${problem.id}`)}
                      className="w-full px-4 py-3 text-left transition hover:bg-[color:var(--accent-soft)] sm:px-5 sm:py-4"
                    >
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-center md:gap-3">
                        <div className="font-mono text-xs text-muted md:col-span-1 md:text-sm">{index + 1}.</div>
                        <div className="font-semibold leading-snug md:col-span-4">{problem.problemName}</div>
                        <div className="md:col-span-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficultyBadgeClass[difficulty]}`}>
                            {difficulty}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 md:col-span-5 md:gap-2">
                          {problem.tags.map((tag) => (
                            <span
                              key={`${problem.id}-${tag}`}
                              className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-600 sm:text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};
