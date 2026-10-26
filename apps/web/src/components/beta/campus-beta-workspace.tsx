"use client";

import { useEffect, useMemo, useState } from "react";
import type { CampusBetaWorkspace, CampusCohortIntervention } from "@codeorbit/schema";
import { platformApi } from "@/lib/platform-api";

type DraftIntervention = {
  priorityFocus: string;
  note: string;
};

const emptyWorkspace: CampusBetaWorkspace = {
  cohorts: [],
  interventions: [],
};

export function CampusBetaWorkspace() {
  const [workspace, setWorkspace] = useState<CampusBetaWorkspace>(emptyWorkspace);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingCohortId, setSavingCohortId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftIntervention>>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await platformApi.getCampusBetaWorkspace();
        if (!cancelled) {
          setWorkspace(response);
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Campus beta workspace failed:", error);
          setNotice((error as { message?: string })?.message ?? "Unable to load campus beta workspace.");
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

  const interventionByCohort = useMemo(() => {
    const index = new Map<string, CampusCohortIntervention>();
    workspace.interventions.forEach((intervention) => {
      index.set(intervention.cohortId, intervention);
    });
    return index;
  }, [workspace.interventions]);

  const getDraft = (cohortId: string): DraftIntervention => {
    if (drafts[cohortId]) {
      return drafts[cohortId];
    }
    const existing = interventionByCohort.get(cohortId);
    return {
      priorityFocus: existing?.priorityFocus ?? "",
      note: existing?.note ?? "",
    };
  };

  const updateDraft = (cohortId: string, next: Partial<DraftIntervention>) => {
    const current = getDraft(cohortId);
    setDrafts((previous) => ({
      ...previous,
      [cohortId]: {
        ...current,
        ...next,
      },
    }));
  };

  const saveIntervention = async (cohortId: string) => {
    const draft = getDraft(cohortId);
    setSavingCohortId(cohortId);
    setNotice(null);

    try {
      const intervention = await platformApi.saveCampusCohortIntervention({
        cohortId,
        priorityFocus: draft.priorityFocus,
        note: draft.note,
      });

      setWorkspace((current) => ({
        ...current,
        interventions: [
          ...current.interventions.filter((entry) => entry.cohortId !== cohortId),
          intervention,
        ],
      }));
      setNotice(`Saved campus intervention for ${cohortId}.`);
    } catch (error) {
      console.error("Saving campus intervention failed:", error);
      setNotice((error as { message?: string })?.message ?? "Unable to save campus intervention.");
    } finally {
      setSavingCohortId(null);
    }
  };

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="surface-card border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {notice}
        </div>
      ) : null}

      {loading ? <div className="surface-card p-4 text-sm text-muted">Loading campus beta workspace...</div> : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Cohorts</p>
          <p className="mt-2 text-3xl font-semibold">{workspace.cohorts.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Students ready</p>
          <p className="mt-2 text-3xl font-semibold">
            {workspace.cohorts.reduce((sum, cohort) => sum + cohort.studentsReady, 0)}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Interventions logged</p>
          <p className="mt-2 text-3xl font-semibold">{workspace.interventions.length}</p>
        </div>
      </section>

      <section className="space-y-4">
        {workspace.cohorts.map((cohort) => {
          const draft = getDraft(cohort.id);
          return (
            <article key={cohort.id} className="surface-card p-6">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
                <div>
                  <h2 className="text-2xl font-semibold">{cohort.cohortLabel}</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="surface-soft p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Active</p>
                      <p className="mt-2 text-2xl font-semibold">{cohort.studentsActive}</p>
                    </div>
                    <div className="surface-soft p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Ready</p>
                      <p className="mt-2 text-2xl font-semibold">{cohort.studentsReady}</p>
                    </div>
                    <div className="surface-soft p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Applications</p>
                      <p className="mt-2 text-2xl font-semibold">{cohort.applicationsTracked}</p>
                    </div>
                    <div className="surface-soft p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Interviews</p>
                      <p className="mt-2 text-2xl font-semibold">{cohort.interviewsTracked}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-soft">
                    Top weak areas: {cohort.topWeakAreas.join(" · ")}
                  </p>
                </div>

                <div className="surface-soft p-4">
                  <label className="mb-2 block text-sm font-semibold text-soft">Priority focus</label>
                  <input
                    className="field-input"
                    value={draft.priorityFocus}
                    onChange={(event) => updateDraft(cohort.id, { priorityFocus: event.target.value })}
                    placeholder="Choose the most urgent improvement area."
                  />

                  <label className="mb-2 mt-4 block text-sm font-semibold text-soft">Coordinator note</label>
                  <textarea
                    className="field-textarea min-h-[120px]"
                    value={draft.note}
                    onChange={(event) => updateDraft(cohort.id, { note: event.target.value })}
                    placeholder="Capture placement action, faculty note, or candidate support plan."
                  />

                  <button
                    onClick={() => void saveIntervention(cohort.id)}
                    className="btn-primary mt-4"
                    disabled={savingCohortId === cohort.id}
                  >
                    {savingCohortId === cohort.id ? "Saving..." : "Save intervention"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
