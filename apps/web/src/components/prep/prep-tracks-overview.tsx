"use client";

import type { BillingSummary, ProblemListItem } from "@codeorbit/schema";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_ORDER, PREP_QUESTIONS, TOPIC_ORDER, type PrepDifficulty } from "@/data/prep-catalog";
import { platformApi } from "@/lib/platform-api";

type Mode = "topic" | "company";
type DifficultyFilter = PrepDifficulty | "All";

const difficultyBadge: Record<PrepDifficulty, string> = {
  Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Hard: "border-rose-500/30 bg-rose-500/10 text-rose-500",
};

const parseMode = (value: string | null): Mode => (value === "company" ? "company" : "topic");

const parseDifficultyFilter = (value: string | null): DifficultyFilter =>
  value === "Easy" || value === "Medium" || value === "Hard" ? value : "All";

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const buildQuestionSearchText = (question: (typeof PREP_QUESTIONS)[number]) =>
  [question.title, question.difficulty, question.priority, ...question.topics, ...question.companies].join(" ").toLowerCase();

const defaultBilling: BillingSummary = {
  planId: "free",
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

export function PrepTracksOverview() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("topic");
  const [selected, setSelected] = useState("Array");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [search, setSearch] = useState("");
  const [availableProblems, setAvailableProblems] = useState<Map<string, ProblemListItem>>(new Map());
  const [billing, setBilling] = useState<BillingSummary>(defaultBilling);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);

  const topics = Array.from(
    new Set(PREP_QUESTIONS.flatMap((question) => question.topics))
  ).sort((left, right) => {
    const leftIndex = TOPIC_ORDER.indexOf(left);
    const rightIndex = TOPIC_ORDER.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });

  const companies = Array.from(
    new Set(PREP_QUESTIONS.flatMap((question) => question.companies))
  ).sort((left, right) => {
    const leftIndex = COMPANY_ORDER.indexOf(left);
    const rightIndex = COMPANY_ORDER.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setMode(parseMode(params.get("mode")));
    setSelected(params.get("selected")?.trim() || "Array");
    setDifficulty(parseDifficultyFilter(params.get("difficulty")));
    setSearch(params.get("q")?.trim() ?? "");
    setHydratedFromUrl(true);
  }, []);

  useEffect(() => {
    if (mode === "topic" && !topics.includes(selected)) {
      setSelected(topics[0] ?? "Array");
    }
    if (mode === "company" && !companies.includes(selected)) {
      setSelected(companies[0] ?? "Amazon");
    }
  }, [companies, mode, selected, topics]);

  useEffect(() => {
    if (!hydratedFromUrl || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();
    const defaultSelected = mode === "topic" ? (topics[0] ?? "Array") : (companies[0] ?? "Amazon");
    const trimmedSearch = search.trim();

    if (mode !== "topic") {
      params.set("mode", mode);
    }

    if (selected && selected !== defaultSelected) {
      params.set("selected", selected);
    }

    if (difficulty !== "All") {
      params.set("difficulty", difficulty);
    }

    if (trimmedSearch) {
      params.set("q", trimmedSearch);
    }

    const nextSearch = params.toString();
    const currentSearch = window.location.search.replace(/^\?/, "");
    if (currentSearch === nextSearch) {
      return;
    }

    const nextUrl = nextSearch ? `${window.location.pathname}?${nextSearch}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [companies, difficulty, hydratedFromUrl, mode, search, selected, topics]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [problems, billingSummary] = await Promise.all([
          platformApi.listProblems(),
          platformApi.getBillingSummary().catch(() => defaultBilling),
        ]);

        if (!cancelled) {
          const index = new Map<string, ProblemListItem>();
          problems.forEach((problem) => {
            index.set(problem.id, problem);
          });
          setAvailableProblems(index);
          setBilling(billingSummary);
          setNotice(
            billingSummary.premiumActive
              ? null
              : "Free access covers easy tracks. Medium, hard, and deeper company-first routes unlock with Pro."
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Prep tracks fallback:", error);
          setNotice("Prep tracks are showing curated local content while secure data finishes syncing.");
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

  const normalizedSearch = normalizeSearch(search);

  const filteredQuestions = PREP_QUESTIONS.filter((question) => {
    const matchesMode = mode === "topic" ? question.topics.includes(selected) : question.companies.includes(selected);
    const matchesDifficulty = difficulty === "All" || question.difficulty === difficulty;
    const matchesSearch = !normalizedSearch || buildQuestionSearchText(question).includes(normalizedSearch);
    return matchesMode && matchesDifficulty && matchesSearch;
  });

  const counters = {
    easy: filteredQuestions.filter((question) => question.difficulty === "Easy").length,
    medium: filteredQuestions.filter((question) => question.difficulty === "Medium").length,
    hard: filteredQuestions.filter((question) => question.difficulty === "Hard").length,
  };

  const handleQuestion = (question: (typeof PREP_QUESTIONS)[number]) => {
    const availableProblem = availableProblems.get(question.slug);
    const locked = !billing.premiumActive && question.difficulty !== "Easy";

    if (locked) {
      router.push("/pricing");
      return;
    }

    if (availableProblem) {
      router.push(`/problems/${availableProblem.id}`);
      return;
    }

    setNotice("This prep question is in the curated track, but it has not been seeded into the secure problem bank yet.");
  };

  return (
    <div className="app-shell">
      <div className="page-container">
        <header className="surface-card mb-6 p-5 sm:mb-8 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Structured Interview Prep</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Prep Tracks</h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Study by topic first, then switch to company-first revision runs when you are ready.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
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
            <div className="surface-soft p-3">
              <p className="text-muted text-xs uppercase">Access</p>
              <p className="text-2xl font-bold">{billing.premiumActive ? "Premium" : "Free"}</p>
            </div>
          </div>
        </header>

        {loading && (
          <div className="surface-card mb-6 p-4 text-sm text-muted">
            Loading secure prep tracks...
          </div>
        )}

        {notice && (
          <div className="surface-card mb-6 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            {notice}
          </div>
        )}

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
            <select value={selected} onChange={(event) => setSelected(event.target.value)} className="field-select">
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
              <p className="text-muted mt-2 text-sm">Try changing the company, topic, or difficulty filters.</p>
            </div>
          ) : (
            filteredQuestions.map((question) => {
              const available = availableProblems.has(question.slug);
              const locked = !billing.premiumActive && question.difficulty !== "Easy";

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
                          <span
                            key={`${question.slug}-topic-${topic}`}
                            className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {question.companies.map((company) => (
                          <span
                            key={`${question.slug}-company-${company}`}
                            className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      <button
                        onClick={() => handleQuestion(question)}
                        className={
                          locked
                            ? "btn-secondary text-sm"
                            : available
                              ? "btn-primary text-sm"
                              : "btn-secondary text-sm"
                        }
                      >
                        {locked ? "Unlock Premium" : available ? "Solve Now" : "Coming Soon"}
                      </button>
                      <span className={`text-xs ${locked ? "text-amber-400" : available ? "text-emerald-400" : "text-slate-400"}`}>
                        {locked
                          ? "Medium and hard tracks are premium"
                          : available
                            ? "Available in your secure problem bank"
                            : "Track item not seeded yet"}
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
}
