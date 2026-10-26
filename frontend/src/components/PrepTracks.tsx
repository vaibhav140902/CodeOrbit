import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { PREP_QUESTIONS, TOPIC_ORDER, COMPANY_ORDER, type PrepDifficulty } from "../data/prepCatalog";
import { InlineError } from "./system/InlineError";
import { SkeletonCard } from "./system/SkeletonCard";

type Mode = "topic" | "company";
type DifficultyFilter = PrepDifficulty | "All";

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const difficultyBadge: Record<PrepDifficulty, string> = {
  Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Hard: "border-rose-500/30 bg-rose-500/10 text-rose-500",
};

export const PrepTracks = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("topic");
  const [selected, setSelected] = useState("Array");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [search, setSearch] = useState("");

  const [availableProblemIds, setAvailableProblemIds] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblemIndex = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const snapshot = await getDocs(collection(db, "problems"));
        const index = new Map<string, string>();
        snapshot.forEach((entry) => {
          const data = entry.data() as { problemName?: string; title?: string };
          const title = String(data.problemName ?? data.title ?? "").trim();
          if (title) {
            index.set(normalize(title), entry.id);
          }
        });
        setAvailableProblemIds(index);
      } catch (error: unknown) {
        const code = (error as { code?: string }).code;
        if (code === "permission-denied") {
          setErrorMessage("Permission denied while loading problem index. Sign in again and deploy Firestore rules.");
        } else {
          console.error("Error loading prep index:", error);
          setErrorMessage("Could not load prep tracks right now.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProblemIndex();
  }, []);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const question of PREP_QUESTIONS) {
      question.topics.forEach((topic) => set.add(topic));
    }
    const ordered = TOPIC_ORDER.filter((topic) => set.has(topic));
    const extra = Array.from(set).filter((topic) => !ordered.includes(topic)).sort((a, b) => a.localeCompare(b));
    return [...ordered, ...extra];
  }, []);

  const companies = useMemo(() => {
    const set = new Set<string>();
    for (const question of PREP_QUESTIONS) {
      question.companies.forEach((company) => set.add(company));
    }
    const ordered = COMPANY_ORDER.filter((company) => set.has(company));
    const extra = Array.from(set).filter((company) => !ordered.includes(company)).sort((a, b) => a.localeCompare(b));
    return [...ordered, ...extra];
  }, []);

  useEffect(() => {
    if (mode === "topic" && !topics.includes(selected)) {
      setSelected(topics[0] ?? "Array");
    }
    if (mode === "company" && !companies.includes(selected)) {
      setSelected(companies[0] ?? "Amazon");
    }
  }, [mode, selected, topics, companies]);

  const filteredQuestions = useMemo(() => {
    return PREP_QUESTIONS.filter((question) => {
      const matchesMode = mode === "topic" ? question.topics.includes(selected) : question.companies.includes(selected);
      const matchesDifficulty = difficulty === "All" || question.difficulty === difficulty;
      const matchesSearch = question.title.toLowerCase().includes(search.toLowerCase());
      return matchesMode && matchesDifficulty && matchesSearch;
    });
  }, [mode, selected, difficulty, search]);

  const counters = useMemo(() => {
    const easy = filteredQuestions.filter((question) => question.difficulty === "Easy").length;
    const medium = filteredQuestions.filter((question) => question.difficulty === "Medium").length;
    const hard = filteredQuestions.filter((question) => question.difficulty === "Hard").length;
    return { easy, medium, hard };
  }, [filteredQuestions]);

  const handleOpenQuestion = (title: string) => {
    const problemId = availableProblemIds.get(normalize(title));
    if (problemId) {
      navigate(`/problems/${problemId}`);
      return;
    }
    alert("This question is in the prep track but not seeded in your problem bank yet. Add it from Admin.");
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="page-container space-y-4">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-container">
        <header className="surface-card mb-6 p-5 sm:mb-8 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Structured Interview Prep</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Prep Tracks</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Study by topic first, then switch to company-focused revision before interviews.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="surface-soft p-3">
              <p className="text-muted text-xs uppercase">Track Questions</p>
              <p className="text-2xl font-bold">{filteredQuestions.length}</p>
            </div>
            <div className="surface-soft p-3">
              <p className="text-muted text-xs uppercase">Topics</p>
              <p className="text-2xl font-bold">{topics.length}</p>
            </div>
            <div className="surface-soft p-3">
              <p className="text-muted text-xs uppercase">Companies</p>
              <p className="text-2xl font-bold">{companies.length}</p>
            </div>
          </div>
        </header>

        {errorMessage && <InlineError message={errorMessage} className="mb-6" />}

        <section className="surface-card mb-6 p-4 sm:p-5">
          <div className="mb-3 grid grid-cols-2 gap-2 sm:w-[280px]">
            <button
              onClick={() => setMode("topic")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                mode === "topic" ? "bg-[color:var(--accent-soft)]" : "text-muted"
              }`}
            >
              Topic Wise
            </button>
            <button
              onClick={() => setMode("company")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                mode === "company" ? "bg-[color:var(--accent-soft)]" : "text-muted"
              }`}
            >
              Company Wise
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="field-select"
            >
              {(mode === "topic" ? topics : companies).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
              className="field-select"
            >
              <option value="All">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field-input lg:col-span-2"
              placeholder="Search question..."
            />
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Easy</p>
            <p className="mt-1 text-2xl font-bold">{counters.easy}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Medium</p>
            <p className="mt-1 text-2xl font-bold">{counters.medium}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-muted text-xs uppercase">Hard</p>
            <p className="mt-1 text-2xl font-bold">{counters.hard}</p>
          </div>
        </section>

        <section className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="surface-card p-8 text-center">
              <p className="text-lg font-semibold">No questions match current filters.</p>
              <p className="text-muted mt-2 text-sm">Try changing difficulty or search terms.</p>
            </div>
          ) : (
            filteredQuestions.map((question) => {
              const problemId = availableProblemIds.get(normalize(question.title));
              const available = Boolean(problemId);

              return (
                <article key={question.slug} className="surface-card p-4 sm:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold sm:text-xl">{question.title}</h3>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyBadge[question.difficulty]}`}>
                          {question.difficulty}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-400">
                          {question.priority}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {question.topics.map((topic) => (
                          <span key={`${question.slug}-topic-${topic}`} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {question.companies.map((company) => (
                          <span key={`${question.slug}-company-${company}`} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300">
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      <button
                        onClick={() => handleOpenQuestion(question.title)}
                        className={available ? "btn-primary text-sm" : "btn-secondary text-sm"}
                      >
                        {available ? "Solve Now" : "Add in Admin"}
                      </button>
                      <span className={`text-xs ${available ? "text-emerald-400" : "text-amber-400"}`}>
                        {available ? "Available in your question bank" : "Track item not seeded yet"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
};

