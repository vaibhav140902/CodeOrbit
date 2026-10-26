"use client";

import {
  DIFFICULTY_ORDER,
  type Difficulty,
  difficultyBadgeClass,
  mockProblems,
  SectionReveal,
  SurfaceCard,
} from "@codeorbit/ui";
import type { BillingSummary, ProblemListItem } from "@codeorbit/schema";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { companyDirectory, trackItems } from "@/data/hiring-os";
import { platformApi } from "@/lib/platform-api";

type DifficultyFilter = Difficulty | "All";

type CompanyFilter = "All" | string;

const COMPANY_FILTER_ORDER = companyDirectory.map((company) => company.name);

const defaultBillingSummary: BillingSummary = {
  planId: "free",
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

const parseDifficultyFilter = (value: string | null): DifficultyFilter =>
  value === "Easy" || value === "Medium" || value === "Hard" ? value : "All";

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const buildProblemSearchText = (problem: ProblemListItem, companySignals: string[]) =>
  [problem.problemName, problem.difficulty, ...problem.tags, ...companySignals].join(" ").toLowerCase();

export function ProblemBank() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [problems, setProblems] = useState<ProblemListItem[]>(mockProblems);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary>(defaultBillingSummary);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("All");
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("q")?.trim() ?? "");
    setDifficultyFilter(parseDifficultyFilter(params.get("difficulty")));
    setTopicFilter(params.get("topic")?.trim() || "All");
    setCompanyFilter(params.get("company")?.trim() || "All");
    setHydratedFromUrl(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [response, billing] = await Promise.all([
          platformApi.listProblems(),
          platformApi.getBillingSummary().catch(() => defaultBillingSummary),
        ]);
        if (!cancelled) {
          setProblems(response);
          setBillingSummary(billing);
          setNotice(
            billing.premiumActive
              ? "Everything is unlocked. Use company filters to drill into the strongest interview patterns."
              : "Every question now opens in preview mode. Pro unlocks saved progress and full medium/hard submission workflows."
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Falling back to local problem catalog:", error);
          setProblems(mockProblems);
          setNotice("Showing the local verified question catalog while secure backend data is still being configured.");
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

  const companySignalsByProblem = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const track of trackItems) {
      if (!track.problemId) {
        continue;
      }
      const labels = map.get(track.problemId) ?? [];
      const companyName = companyDirectory.find((company) => company.slug === track.companySlug)?.name ?? track.companySlug;
      if (!labels.includes(companyName)) {
        labels.push(companyName);
      }
      map.set(track.problemId, labels);
    }
    return map;
  }, []);

  const availableTopics = useMemo(() => {
    const tags = new Set<string>();
    for (const problem of problems) {
      for (const tag of problem.tags) {
        tags.add(tag);
      }
    }
    return ["All", ...Array.from(tags).sort((left, right) => left.localeCompare(right))];
  }, [problems]);

  const availableCompanies = useMemo(() => {
    const names = new Set<string>();
    for (const companies of companySignalsByProblem.values()) {
      for (const name of companies) {
        names.add(name);
      }
    }
    return [
      "All",
      ...Array.from(names).sort((left, right) => {
        const leftIndex = COMPANY_FILTER_ORDER.indexOf(left);
        const rightIndex = COMPANY_FILTER_ORDER.indexOf(right);
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
      }),
    ];
  }, [companySignalsByProblem]);

  useEffect(() => {
    if (!availableTopics.includes(topicFilter)) {
      setTopicFilter("All");
    }
  }, [availableTopics, topicFilter]);

  useEffect(() => {
    if (!availableCompanies.includes(companyFilter)) {
      setCompanyFilter("All");
    }
  }, [availableCompanies, companyFilter]);

  useEffect(() => {
    if (!hydratedFromUrl || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();
    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      params.set("q", trimmedSearch);
    }

    if (difficultyFilter !== "All") {
      params.set("difficulty", difficultyFilter);
    }

    if (topicFilter !== "All") {
      params.set("topic", topicFilter);
    }

    if (companyFilter !== "All") {
      params.set("company", companyFilter);
    }

    const nextSearch = params.toString();
    const currentSearch = window.location.search.replace(/^\?/, "");
    if (currentSearch === nextSearch) {
      return;
    }

    const nextUrl = nextSearch ? `${window.location.pathname}?${nextSearch}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [companyFilter, difficultyFilter, hydratedFromUrl, search, topicFilter]);

  const filteredProblems = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return problems.filter((problem) => {
      const companySignals = companySignalsByProblem.get(problem.id) ?? [];
      const matchesSearch = !normalizedSearch || buildProblemSearchText(problem, companySignals).includes(normalizedSearch);
      const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
      const matchesTopic = topicFilter === "All" || problem.tags.includes(topicFilter);
      const matchesCompany = companyFilter === "All" || companySignals.includes(companyFilter);
      return matchesSearch && matchesDifficulty && matchesTopic && matchesCompany;
    });
  }, [companyFilter, companySignalsByProblem, difficultyFilter, problems, search, topicFilter]);

  const problemsByDifficulty = useMemo(() => {
    const grouped: Record<Difficulty, ProblemListItem[]> = {
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

  const featuredProblems = useMemo(
    () =>
      [...problems]
        .sort(
          (left, right) =>
            (companySignalsByProblem.get(right.id)?.length ?? 0) - (companySignalsByProblem.get(left.id)?.length ?? 0)
        )
        .slice(0, 4),
    [companySignalsByProblem, problems]
  );

  const mustDoCount = useMemo(
    () => trackItems.filter((item) => item.signal === "must-do").length,
    []
  );

  return (
    <div className="app-shell">
      <div className="page-container">
        <SectionReveal className="mb-6 surface-card hero-orbit overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Question OS</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Company-wise questions that actually map to hiring patterns.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-soft sm:text-base">
                Explore the core problem library, then filter by company signal to practice the questions that repeatedly show up in India-first and global interviews.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Question count</p>
                <p className="mt-2 text-3xl font-bold">{problems.length}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Company-tagged prompts</p>
                <p className="mt-2 text-3xl font-bold">{trackItems.length}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Must-do signals</p>
                <p className="mt-2 text-3xl font-bold">{mustDoCount}</p>
              </div>
            </div>
          </div>
        </SectionReveal>

        {notice && (
          <div className="surface-card mb-4 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            {notice}
          </div>
        )}

        {loading && (
          <div className="surface-card mb-4 p-4 text-sm text-muted">Loading secure problem catalog...</div>
        )}

        <SectionReveal className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-4">
          {featuredProblems.map((problem) => {
            const companies = companySignalsByProblem.get(problem.id) ?? [];
            return (
              <button
                key={problem.id}
                onClick={() => router.push(`/problems/${problem.id}`)}
                className="surface-card p-4 text-left transition hover:border-[color:var(--accent)]"
              >
                <p className="text-sm font-semibold">{problem.problemName}</p>
                <p className="mt-2 text-sm text-soft">{companies.length > 0 ? `${companies.join(", ")}` : "Core interview question"}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">{problem.difficulty}</p>
              </button>
            );
          })}
        </SectionReveal>

        <SectionReveal>
          <SurfaceCard className="mb-6 p-4 sm:p-5" animated={true}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
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
              <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="field-select">
                {availableTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic === "All" ? "All topics" : topic}
                  </option>
                ))}
              </select>
              <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="field-select">
                {availableCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company === "All" ? "All companies" : company}
                  </option>
                ))}
              </select>
            </div>
          </SurfaceCard>
        </SectionReveal>

        <SectionReveal className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SurfaceCard className="p-4" animated={true}>
            <p className="text-muted text-xs uppercase">Easy</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">
              {problemsByDifficulty.Easy.length}
              <span className="ml-2 text-sm font-medium text-muted">/ {totalByDifficulty.Easy}</span>
            </p>
          </SurfaceCard>
          <SurfaceCard className="p-4" animated={true}>
            <p className="text-muted text-xs uppercase">Medium</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">
              {problemsByDifficulty.Medium.length}
              <span className="ml-2 text-sm font-medium text-muted">/ {totalByDifficulty.Medium}</span>
            </p>
          </SurfaceCard>
          <SurfaceCard className="p-4" animated={true}>
            <p className="text-muted text-xs uppercase">Hard</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">
              {problemsByDifficulty.Hard.length}
              <span className="ml-2 text-sm font-medium text-muted">/ {totalByDifficulty.Hard}</span>
            </p>
          </SurfaceCard>
        </SectionReveal>

        <section className="space-y-4 sm:space-y-6">
          {DIFFICULTY_ORDER.map((difficulty) => (
            <SectionReveal key={difficulty}>
              <article className="surface-card overflow-hidden">
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
                    problemsByDifficulty[difficulty].map((problem, index) => {
                      const companies = companySignalsByProblem.get(problem.id) ?? [];
                      const previewOnly = !billingSummary.premiumActive && problem.difficulty !== "Easy";

                      return (
                        <button
                          key={problem.id}
                          onClick={() => router.push(`/problems/${problem.id}`)}
                          className="w-full px-4 py-3 text-left transition hover:bg-[color:var(--accent-soft)] sm:px-5 sm:py-4"
                        >
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-center md:gap-3">
                            <div className="font-mono text-xs text-muted md:col-span-1 md:text-sm">{index + 1}.</div>
                            <div className="md:col-span-4">
                              <div className="font-semibold leading-snug">{problem.problemName}</div>
                              {companies.length > 0 && (
                                <p className="mt-1 text-xs text-muted">Repeated across {companies.length} company track{companies.length === 1 ? "" : "s"}</p>
                              )}
                            </div>
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
                              {companies.slice(0, 3).map((company) => (
                                <span
                                  key={`${problem.id}-${company}`}
                                  className="rounded-full border border-[color:var(--border)] px-2 py-1 text-[10px] text-soft sm:text-xs"
                                >
                                  {company}
                                </span>
                              ))}
                              {previewOnly && (
                                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400 sm:text-xs">
                                  Preview only on Free
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </article>
            </SectionReveal>
          ))}
        </section>
      </div>
    </div>
  );
}
