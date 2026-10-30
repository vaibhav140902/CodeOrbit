"use client";

import { useEffect, useMemo, useState } from "react";
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

export function RecruiterBetaWorkspace() {
  const [workspace, setWorkspace] = useState<RecruiterBetaWorkspace>(emptyWorkspace);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingHandle, setSavingHandle] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftReview>>({});
  const [filter, setFilter] = useState<"all" | "shortlisted" | "verified_only">("all");
  const [selectedBadge, setSelectedBadge] = useState<VerifiedProofBadge | null>(null);
  const [exporting, setExporting] = useState(false);

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
      setNotice(`Saved recruiter review for ${candidateHandle}.`);
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

  const filteredCandidates = useMemo(() => {
    return workspace.candidates.filter((candidate) => {
      const review = reviewByHandle.get(candidate.handle);
      if (filter === "shortlisted") {
        return review?.status === "shortlisted";
      }
      if (filter === "verified_only") {
        return Boolean(candidate.verifiedBadge);
      }
      return true;
    });
  }, [workspace.candidates, filter, reviewByHandle]);

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="surface-card border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-300">
          {notice}
        </div>
      ) : null}

      {loading ? <div className="surface-card p-4 text-sm text-muted">Loading recruiter beta workspace...</div> : null}

      {/* Overview Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Visible candidates</p>
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
          <p className="text-xs uppercase tracking-[0.18em] text-muted">In review</p>
          <p className="mt-2 text-3xl font-semibold text-amber-400">
            {workspace.reviews.filter((review) => review.status === "reviewing").length}
          </p>
        </div>
      </section>

      {/* Filter and Export Bar */}
      <section className="surface-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-medium">Filter:</span>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === "all" ? "bg-cyan-500 text-slate-950" : "surface-soft text-soft hover:text-white"
            }`}
          >
            All ({workspace.candidates.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified_only")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === "verified_only" ? "bg-emerald-500 text-slate-950" : "surface-soft text-soft hover:text-white"
            }`}
          >
            Verified Only ({workspace.candidates.filter((c) => Boolean(c.verifiedBadge)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("shortlisted")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === "shortlisted" ? "bg-cyan-500 text-slate-950" : "surface-soft text-soft hover:text-white"
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
      </section>

      {/* Candidates List */}
      <section className="surface-card overflow-hidden">
        <div className="border-b border-[color:var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Verified Candidate Talent Pool</h2>
          <span className="text-xs text-soft">DPDP Act (Digital Personal Data Protection) Compliant</span>
        </div>
        <div className="divide-y divide-[color:var(--border)]">
          {filteredCandidates.map((candidate) => {
            const draft = getDraft(candidate.handle);
            return (
              <div key={candidate.handle} className="px-6 py-6">
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{candidate.fullName}</h3>
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

                      {candidate.dpdpConsentGranted ? (
                        <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-400">
                          DPDP Consent: Granted
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] text-rose-400">
                          DPDP Consent: Restricted
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-soft">{candidate.headline}</p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2.5 py-1 font-semibold text-cyan-400">
                        Readiness {candidate.readinessScore}/100
                      </span>
                      {candidate.proctorScore && (
                        <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2.5 py-1 text-emerald-400">
                          Proctor Trust {candidate.proctorScore}%
                        </span>
                      )}
                      <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2.5 py-1 text-muted">
                        Roles: {candidate.targetRoleSlugs.join(", ")}
                      </span>
                      <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2.5 py-1 text-muted">
                        Targets: {candidate.targetCompanySlugs.join(", ")}
                      </span>
                    </div>

                    {candidate.verifiedBadge && (
                      <div className="mt-3 text-[11px] text-muted font-mono truncate max-w-md">
                        Proof Hash: {candidate.verifiedBadge.verificationHash}
                      </div>
                    )}
                  </div>

                  <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)]">
                    <label className="mb-1 block text-xs font-semibold text-soft">Recruiter Status</label>
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

                    <label className="mb-1 mt-3 block text-xs font-semibold text-soft">Evaluation Notes</label>
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
      </section>

      {/* Proof Badge Cryptographic Verification Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
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
                    <span key={i} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/20">
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
