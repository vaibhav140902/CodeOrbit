"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  RecruiterBetaWorkspace,
  RecruiterCandidateReview,
  RecruiterReviewStatus,
  VerifiedProofBadge,
} from "@codeorbit/schema";
import { platformApi } from "@/lib/platform-api";

type DraftReview = {
  status: RecruiterReviewStatus;
  note: string;
};

const emptyWorkspace: RecruiterBetaWorkspace = {
  candidates: [],
  reviews: [],
};

const TECH_STACK_OPTIONS = ["React", "Node", "Python", "Go", "C++"] as const;
const COMPANY_TARGET_OPTIONS = [
  { value: "all", label: "All Companies" },
  { value: "amazon", label: "Amazon" },
  { value: "google", label: "Google" },
  { value: "microsoft", label: "Microsoft" },
  { value: "tcs", label: "TCS" },
  { value: "flipkart", label: "Flipkart" },
] as const;

const PAGE_SIZE = 6;

export function RecruiterBetaWorkspace() {
  const [workspace, setWorkspace] = useState<RecruiterBetaWorkspace>(emptyWorkspace);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingHandle, setSavingHandle] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftReview>>({});
  const [selectedBadge, setSelectedBadge] = useState<VerifiedProofBadge | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<"all" | "shortlisted" | "verified_only" | "consented_only">("all");
  const [minReadiness, setMinReadiness] = useState<number>(0);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await platformApi.getRecruiterBetaWorkspace();
        if (!cancelled) {
          setWorkspace(response);
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Recruiter beta workspace failed:", error);
          setNotice((error as { message?: string })?.message ?? "Unable to load recruiter beta workspace.");
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

  const reviewByHandle = useMemo(() => {
    const index = new Map<string, RecruiterCandidateReview>();
    workspace.reviews.forEach((review) => {
      index.set(review.candidateHandle, review);
    });
    return index;
  }, [workspace.reviews]);

  const getDraft = (candidateHandle: string): DraftReview => {
    if (drafts[candidateHandle]) {
      return drafts[candidateHandle];
    }

    const existing = reviewByHandle.get(candidateHandle);
    return {
      status: existing?.status ?? "new",
      note: existing?.note ?? "",
    };
  };

  const updateDraft = (candidateHandle: string, next: Partial<DraftReview>) => {
    const current = getDraft(candidateHandle);
    setDrafts((previous) => ({
      ...previous,
      [candidateHandle]: {
        ...current,
        ...next,
      },
    }));
  };

  const saveReview = async (candidateHandle: string) => {
    const draft = getDraft(candidateHandle);
    setSavingHandle(candidateHandle);
    setNotice(null);

    try {
      const review = await platformApi.saveRecruiterCandidateReview({
        candidateHandle,
        status: draft.status,
        note: draft.note,
      });

      setWorkspace((current) => ({
        ...current,
        reviews: [...current.reviews.filter((entry) => entry.candidateHandle !== candidateHandle), review],
      }));
      setNotice(`Saved recruiter review for candidate ${candidateHandle}.`);
    } catch (error) {
      console.error("Saving recruiter review failed:", error);
      setNotice((error as { message?: string })?.message ?? "Unable to save recruiter review.");
    } finally {
      setSavingHandle(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setNotice(null);

    try {
      const handles = workspace.candidates.map((c) => c.handle);
      const res = await platformApi.exportRecruiterCandidates({
        candidateHandles: handles,
        format: "csv",
        purpose: "campus_placement_hiring",
      });

      if (res.csvData) {
        const blob = new Blob([res.csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `codeorbit_verified_candidates_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setNotice(
          `Exported ${res.exportedCount} candidates (DPDP Audit Ref: ${res.dpdpAuditRef}). ${
            res.blockedCount > 0 ? `${res.blockedCount} candidate(s) blocked due to missing DPDP sharing consent.` : ""
          }`
        );
      }
    } catch (err) {
      console.error("Export failed:", err);
      setNotice("Failed to export candidates. Please retry.");
    } finally {
      setExporting(false);
    }
  };

  // High-Performance Instant Client-Side Filter
  const filteredCandidates = useMemo(() => {
    return workspace.candidates.filter((candidate) => {
      // 1. Status Filter
      const review = reviewByHandle.get(candidate.handle);
      if (statusFilter === "shortlisted" && review?.status !== "shortlisted") {
        return false;
      }
      if (statusFilter === "verified_only" && !candidate.verifiedBadge) {
        return false;
      }
      if (statusFilter === "consented_only" && !candidate.dpdpConsentGranted) {
        return false;
      }

      // 2. Minimum Readiness Score Slider
      if (candidate.readinessScore < minReadiness) {
        return false;
      }

      // 3. Tech Stack Multi-Select Filter (React, Node, Python, Go, C++)
      if (selectedTech.length > 0) {
        const verifiedSkills = (candidate.verifiedBadge?.skillsVerified || []).map((s) => s.toLowerCase());
        const headlineLower = candidate.headline.toLowerCase();

        const hasMatchingTech = selectedTech.some((tech) => {
          const t = tech.toLowerCase();
          return verifiedSkills.some((s) => s.includes(t)) || headlineLower.includes(t);
        });

        if (!hasMatchingTech) {
          return false;
        }
      }

      // 4. Target Company Dropdown Filter
      if (selectedCompany !== "all") {
        const target = selectedCompany.toLowerCase();
        const matchesCompany = candidate.targetCompanySlugs.some((c) => c.toLowerCase() === target);
        if (!matchesCompany) {
          return false;
        }
      }

      return true;
    });
  }, [workspace.candidates, statusFilter, minReadiness, selectedTech, selectedCompany, reviewByHandle]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, minReadiness, selectedTech, selectedCompany]);

  // Paginated Slices
  const totalFiltered = filteredCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCandidates = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredCandidates.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredCandidates, safeCurrentPage]);

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((item) => item !== tech) : [...prev, tech]
    );
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setMinReadiness(0);
    setSelectedTech([]);
    setSelectedCompany("all");
    setCurrentPage(1);
  };

  const isFiltered =
    statusFilter !== "all" || minReadiness > 0 || selectedTech.length > 0 || selectedCompany !== "all";

  const getReadinessTierBadge = (score: number) => {
    if (score >= 90) {
      return { label: "Day-1 FAANG Ready", style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" };
    }
    if (score >= 75) {
      return { label: "Top Tier Candidate", style: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" };
    }
    if (score >= 50) {
      return { label: "Placement Ready", style: "border-blue-500/30 bg-blue-500/10 text-blue-400" };
    }
    return { label: "Needs Practice", style: "border-amber-500/30 bg-amber-500/10 text-amber-400" };
  };

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="surface-card border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-300 flex items-center justify-between gap-4">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-cyan-400 hover:text-white text-xs font-semibold"
          >
            ✕ Dismiss
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="surface-card p-4 text-sm text-muted">Loading recruiter beta workspace...</div>
      ) : null}

      {/* Overview Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Total Candidates</p>
          <p className="mt-2 text-3xl font-semibold">{workspace.candidates.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Verified Badges</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">
            {workspace.candidates.filter((c) => Boolean(c.verifiedBadge)).length}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Shortlisted</p>
          <p className="mt-2 text-3xl font-semibold text-cyan-400">
            {workspace.reviews.filter((review) => review.status === "shortlisted").length}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">DPDP Consented</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">
            {workspace.candidates.filter((c) => c.dpdpConsentGranted).length}
          </p>
        </div>
      </section>

      {/* Part B2: High-Performance Filter Controls */}
      <section className="surface-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[color:var(--foreground)]">Candidate Search & High-Performance Filters</h2>
            <p className="text-xs text-soft">Instant client-side multi-dimensional talent pipeline filtering.</p>
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Minimum Readiness Score Slider */}
          <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-soft">Minimum Readiness Score</label>
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {minReadiness} / 100
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minReadiness}
              onChange={(e) => setMinReadiness(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <button
                type="button"
                onClick={() => setMinReadiness(0)}
                className={`hover:text-white ${minReadiness === 0 ? "text-cyan-400 font-bold" : ""}`}
              >
                0 (All)
              </button>
              <button
                type="button"
                onClick={() => setMinReadiness(50)}
                className={`hover:text-white ${minReadiness === 50 ? "text-cyan-400 font-bold" : ""}`}
              >
                50+
              </button>
              <button
                type="button"
                onClick={() => setMinReadiness(75)}
                className={`hover:text-white ${minReadiness === 75 ? "text-cyan-400 font-bold" : ""}`}
              >
                75+
              </button>
              <button
                type="button"
                onClick={() => setMinReadiness(90)}
                className={`hover:text-white ${minReadiness === 90 ? "text-cyan-400 font-bold" : ""}`}
              >
                90+ FAANG
              </button>
            </div>
          </div>

          {/* Tech Stack Multi-Select Checkboxes */}
          <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-soft">Tech Stack / Skills</label>
              {selectedTech.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTech([])}
                  className="text-[10px] text-muted hover:text-white"
                >
                  Clear ({selectedTech.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {TECH_STACK_OPTIONS.map((tech) => {
                const isSelected = selectedTech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-[color:var(--surface)] text-soft border-[color:var(--border)] hover:border-slate-600"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Target Dropdown */}
          <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)] space-y-2">
            <label className="text-xs font-semibold text-soft block">Target Company Track</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-xs focus:border-cyan-500 focus:outline-none"
            >
              {COMPANY_TARGET_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted">
              Matches candidate readiness track calibrations for targeted corporate hiring drives.
            </p>
          </div>
        </div>

        {/* Status Tabs and Export Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted font-medium">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === "all" ? "bg-cyan-500 text-slate-950" : "surface-soft text-soft hover:text-white"
              }`}
            >
              All ({workspace.candidates.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("consented_only")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === "consented_only" ? "bg-emerald-500 text-slate-950" : "surface-soft text-soft hover:text-white"
              }`}
            >
              DPDP Consented ({workspace.candidates.filter((c) => c.dpdpConsentGranted).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("verified_only")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === "verified_only" ? "bg-emerald-500 text-slate-950" : "surface-soft text-soft hover:text-white"
              }`}
            >
              Verified Only ({workspace.candidates.filter((c) => Boolean(c.verifiedBadge)).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("shortlisted")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                statusFilter === "shortlisted" ? "bg-cyan-500 text-slate-950" : "surface-soft text-soft hover:text-white"
              }`}
            >
              Shortlisted ({workspace.reviews.filter((r) => r.status === "shortlisted").length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting || workspace.candidates.length === 0}
            className="btn-primary text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg flex items-center gap-2"
          >
            {exporting ? "Exporting..." : "⬇ Export Shortlist (DPDP Compliant CSV)"}
          </button>
        </div>
      </section>

      {/* Part B1 & B3: Paginated Talent Directory */}
      <section className="surface-card overflow-hidden">
        <div className="border-b border-[color:var(--border)] px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Verified Candidate Talent Pool</h2>
            <p className="text-xs text-soft mt-0.5">
              Showing {totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(safeCurrentPage * PAGE_SIZE, totalFiltered)} of {totalFiltered} matching candidates
            </p>
          </div>
          <span className="text-xs text-soft font-mono">DPDP Act (Digital Personal Data Protection) Compliant</span>
        </div>

        {paginatedCandidates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-base text-muted">No candidates match your current filter criteria.</p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn-secondary text-xs py-1.5 px-4"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--border)]">
            {paginatedCandidates.map((candidate) => {
              const draft = getDraft(candidate.handle);
              const tier = getReadinessTierBadge(candidate.readinessScore);

              return (
                <div key={candidate.handle} className="px-6 py-6 hover:bg-[color:var(--surface-soft)]/20 transition-colors">
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      {/* Name, Link & DPDP Consent Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        {candidate.dpdpConsentGranted ? (
                          <Link
                            href={`/proof/${candidate.handle}`}
                            className="text-lg font-bold text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5 underline-offset-2 hover:underline"
                            title="Click to view candidate verified proof profile"
                          >
                            <span>{candidate.fullName}</span>
                            <span className="text-xs text-cyan-400">↗</span>
                          </Link>
                        ) : (
                          <span
                            className="text-lg font-bold text-slate-300 flex items-center gap-1.5 cursor-not-allowed"
                            title="Direct profile view restricted under DPDP Act 2023 — candidate sharing consent required"
                          >
                            <span>{candidate.fullName}</span>
                            <span className="text-xs text-rose-400 font-mono">🔒</span>
                          </span>
                        )}

                        {/* DPDP Consent Badge */}
                        {candidate.dpdpConsentGranted ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            ✓ DPDP Consented
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                            ✗ No Consent
                          </span>
                        )}

                        {/* Verified Badge */}
                        {candidate.verifiedBadge ? (
                          <button
                            type="button"
                            onClick={() => setSelectedBadge(candidate.verifiedBadge || null)}
                            className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                            title="Click to view SHA-256 cryptographic proof"
                          >
                            <span>✓ Verified Badge</span>
                            <span className="text-[10px]">🔍</span>
                          </button>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-400">
                            Self-Reported
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-soft">{candidate.headline}</p>

                      {/* Readiness Score & Tier Badges */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2.5 py-1 font-semibold text-cyan-400">
                          Readiness {candidate.readinessScore}/100
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${tier.style}`}>
                          {tier.label}
                        </span>
                        {candidate.proctorScore && (
                          <span className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-emerald-400 text-[11px]">
                            Proctor Trust {candidate.proctorScore}%
                          </span>
                        )}
                      </div>

                      {/* Roles, Companies and Skills */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-muted">Roles:</span>
                          {candidate.targetRoleSlugs.map((role) => (
                            <span
                              key={role}
                              className="rounded bg-[color:var(--surface-soft)] px-2 py-0.5 text-[10px] text-soft font-medium border border-[color:var(--border)]"
                            >
                              {role.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-muted">Target Companies:</span>
                          {candidate.targetCompanySlugs.map((company) => (
                            <span
                              key={company}
                              className="rounded bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px] font-medium border border-cyan-500/20 uppercase"
                            >
                              {company}
                            </span>
                          ))}
                        </div>

                        {candidate.verifiedBadge?.skillsVerified && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[11px] text-muted">Skills:</span>
                            {candidate.verifiedBadge.skillsVerified.map((skill) => (
                              <span
                                key={skill}
                                className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 text-[10px] border border-slate-700"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Detail Link / Direct CTA */}
                      <div className="mt-4">
                        {candidate.dpdpConsentGranted ? (
                          <Link
                            href={`/proof/${candidate.handle}`}
                            className="btn-secondary text-xs py-1 px-3 inline-flex items-center gap-1.5 hover:border-cyan-500 transition-colors"
                          >
                            <span>View Cryptographic Proof Profile</span>
                            <span className="text-cyan-400">→</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                            <span>🔒 Direct profile link restricted (Missing DPDP sharing consent)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recruiter Evaluation Form */}
                    <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)]">
                      <label className="mb-1 block text-xs font-semibold text-soft">Recruiter Review Status</label>
                      <select
                        className="w-full rounded border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-xs focus:border-cyan-500 focus:outline-none"
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(candidate.handle, { status: event.target.value as RecruiterReviewStatus })
                        }
                      >
                        <option value="new">New Candidate</option>
                        <option value="reviewing">In Active Review</option>
                        <option value="shortlisted">⭐ Shortlisted for Interview</option>
                        <option value="on_hold">On Hold</option>
                      </select>

                      <label className="mb-1 mt-3 block text-xs font-semibold text-soft">Evaluation Notes & Technical Feedback</label>
                      <textarea
                        className="w-full rounded border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-xs min-h-[70px] focus:border-cyan-500 focus:outline-none"
                        value={draft.note}
                        onChange={(event) => updateDraft(candidate.handle, { note: event.target.value })}
                        placeholder="e.g. Cleared automated OA with 92% readiness. Strong Kafka depth."
                      />

                      <button
                        onClick={() => void saveReview(candidate.handle)}
                        className="btn-primary mt-3 text-xs py-1.5 px-3"
                        disabled={savingHandle === candidate.handle}
                      >
                        {savingHandle === candidate.handle ? "Saving..." : "Save Candidate Review"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="border-t border-[color:var(--border)] px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition-all ${
                    pageNum === safeCurrentPage
                      ? "bg-cyan-500 text-slate-950"
                      : "surface-soft text-soft hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {/* Proof Badge Cryptographic Verification Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
          <div className="surface-card max-w-lg w-full p-6 sm:p-8 space-y-6 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="text-lg font-bold">Verified CodeOrbit Proof Badge</h3>
                  <p className="text-xs text-emerald-400">Cryptographically Authenticated Placement Credential</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="text-soft hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-muted uppercase text-[10px] font-semibold">Candidate</p>
                <p className="text-sm font-bold text-[color:var(--foreground)] mt-0.5">{selectedBadge.fullName}</p>
                <p className="text-soft font-mono">@{selectedBadge.candidateHandle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 surface-soft p-3 rounded-lg border border-[color:var(--border)]">
                <div>
                  <p className="text-muted text-[10px]">Readiness Index</p>
                  <p className="text-lg font-bold text-cyan-400">{selectedBadge.overallReadiness}/100</p>
                </div>
                <div>
                  <p className="text-muted text-[10px]">Proctor Trust</p>
                  <p className="text-lg font-bold text-emerald-400">{selectedBadge.proctorTrustScore}%</p>
                </div>
                <div>
                  <p className="text-muted text-[10px]">DSA Solves</p>
                  <p className="text-sm font-semibold">{selectedBadge.solvesCount} problems</p>
                </div>
                <div>
                  <p className="text-muted text-[10px]">Contests</p>
                  <p className="text-sm font-semibold">{selectedBadge.contestsParticipated} proctored</p>
                </div>
              </div>

              <div>
                <p className="text-muted uppercase text-[10px] font-semibold">SHA-256 Verification Hash</p>
                <p className="p-2.5 rounded bg-[color:var(--surface-soft)] font-mono text-[10px] break-all border border-[color:var(--border)] text-emerald-300 mt-1">
                  {selectedBadge.verificationHash}
                </p>
              </div>

              <div>
                <p className="text-muted uppercase text-[10px] font-semibold">Skills Verified</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedBadge.skillsVerified.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-muted border-t border-[color:var(--border)] pt-3 flex justify-between">
                <span>Issuer: {selectedBadge.issuer}</span>
                <span>Verified: {new Date(selectedBadge.verifiedAtIso).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full btn-secondary text-xs py-2"
            >
              Close Verification Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
