"use client";

import { useEffect, useMemo, useState } from "react";
import type { RecruiterBetaWorkspace, RecruiterCandidateReview, RecruiterReviewStatus } from "@codeorbit/schema";
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

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="surface-card border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {notice}
        </div>
      ) : null}

      {loading ? <div className="surface-card p-4 text-sm text-muted">Loading recruiter beta workspace...</div> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Visible candidates</p>
          <p className="mt-2 text-3xl font-semibold">{workspace.candidates.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Shortlisted</p>
          <p className="mt-2 text-3xl font-semibold">
            {workspace.reviews.filter((review) => review.status === "shortlisted").length}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">In review</p>
          <p className="mt-2 text-3xl font-semibold">
            {workspace.reviews.filter((review) => review.status === "reviewing").length}
          </p>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <h2 className="text-2xl font-semibold">Candidate review queue</h2>
        </div>
        <div className="divide-y divide-[color:var(--border)]">
          {workspace.candidates.map((candidate) => {
            const draft = getDraft(candidate.handle);
            return (
              <div key={candidate.handle} className="px-5 py-5">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <h3 className="text-lg font-semibold">{candidate.fullName}</h3>
                    <p className="mt-1 text-sm text-soft">{candidate.headline}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">
                        Readiness {candidate.readinessScore}
                      </span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">
                        {candidate.interviewMomentum}
                      </span>
                      <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1">
                        {candidate.targetRoleSlugs.join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="surface-soft p-4">
                    <label className="mb-2 block text-sm font-semibold text-soft">Review status</label>
                    <select
                      className="field-select"
                      value={draft.status}
                      onChange={(event) =>
                        updateDraft(candidate.handle, { status: event.target.value as RecruiterReviewStatus })
                      }
                    >
                      <option value="new">New</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="on_hold">On hold</option>
                    </select>

                    <label className="mb-2 mt-4 block text-sm font-semibold text-soft">Internal note</label>
                    <textarea
                      className="field-textarea min-h-[120px]"
                      value={draft.note}
                      onChange={(event) => updateDraft(candidate.handle, { note: event.target.value })}
                      placeholder="Capture recruiter-facing notes, role fit, or next steps."
                    />

                    <button
                      onClick={() => void saveReview(candidate.handle)}
                      className="btn-primary mt-4"
                      disabled={savingHandle === candidate.handle}
                    >
                      {savingHandle === candidate.handle ? "Saving..." : "Save review"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
