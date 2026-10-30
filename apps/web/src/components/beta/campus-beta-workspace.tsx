"use client";

import { useEffect, useMemo, useState } from "react";
import type { CampusBetaWorkspace, CampusCohortIntervention, TpoBatchAnalytics } from "@codeorbit/schema";
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
  const [analytics, setAnalytics] = useState<TpoBatchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingCohortId, setSavingCohortId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftIntervention>>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [wsData, analyticsData] = await Promise.all([
          platformApi.getCampusBetaWorkspace(),
          platformApi.getTpoBatchAnalytics("nit-trichy-cse-2026"),
        ]);
        if (!cancelled) {
          setWorkspace(wsData);
          setAnalytics(analyticsData);
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
    <div className="space-y-8">
      {notice ? (
        <div className="surface-card border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {notice}
        </div>
      ) : null}

      {loading ? <div className="surface-card p-4 text-sm text-muted">Loading campus TPO placement workspace...</div> : null}

      {/* Top TPO Batch Placement Metrics */}
      {analytics && (
        <section className="space-y-6">
          <div className="surface-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="eyebrow-chip">TPO Command Center</span>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {analytics.collegeName} — Batch {analytics.batchYear} Analytics
                </h1>
                <p className="mt-1 text-xs text-soft">
                  Real-time algorithmic readiness distribution and company OA clearance predictor.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                  {analytics.verifiedStudents}/{analytics.totalStudents} Students Verified
                </span>
              </div>
            </div>

            {/* 4-Tier Batch Readiness Distribution */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Batch Placement Readiness Curve
              </h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="surface-soft p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs text-emerald-400 font-semibold uppercase">Day-1 FAANG / Tier-1 Ready</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{analytics.readinessTiers.dayOneFaangReady}</p>
                  <p className="text-[11px] text-muted">
                    {Math.round((analytics.readinessTiers.dayOneFaangReady / analytics.totalStudents) * 100)}% of batch
                  </p>
                </div>

                <div className="surface-soft p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                  <p className="text-xs text-cyan-400 font-semibold uppercase">Strong Campus Shortlist</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">{analytics.readinessTiers.strongCampusShortlist}</p>
                  <p className="text-[11px] text-muted">
                    {Math.round((analytics.readinessTiers.strongCampusShortlist / analytics.totalStudents) * 100)}% of batch
                  </p>
                </div>

                <div className="surface-soft p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <p className="text-xs text-amber-400 font-semibold uppercase">Borderline OA Screen</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{analytics.readinessTiers.borderlineOaScreen}</p>
                  <p className="text-[11px] text-muted">
                    {Math.round((analytics.readinessTiers.borderlineOaScreen / analytics.totalStudents) * 100)}% of batch
                  </p>
                </div>

                <div className="surface-soft p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                  <p className="text-xs text-rose-400 font-semibold uppercase">Needs Critical Overhaul</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{analytics.readinessTiers.needsOverhaul}</p>
                  <p className="text-[11px] text-muted">
                    {Math.round((analytics.readinessTiers.needsOverhaul / analytics.totalStudents) * 100)}% of batch
                  </p>
                </div>
              </div>
            </div>

            {/* Company OA Predictor */}
            <div className="border-t border-[color:var(--border)] pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Automated Company OA Clearance Predictor
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {analytics.companyOaClearancePredictions.map((pred, i) => (
                  <div key={i} className="surface-soft p-3.5 rounded-lg border border-[color:var(--border)]">
                    <p className="text-xs font-semibold text-[color:var(--foreground)] truncate">{pred.company}</p>
                    <p className="text-xl font-bold text-cyan-400 mt-1">{pred.estimatedClearanceRatePercent}%</p>
                    <p className="text-[11px] text-soft">~{pred.predictedShortlistsCount} students clear</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak Topic Heatmap */}
            <div className="border-t border-[color:var(--border)] pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Batch Weak-Topic Heatmap (Curriculum Gaps)
              </h3>
              <div className="divide-y divide-[color:var(--border)] border border-[color:var(--border)] rounded-lg overflow-hidden">
                {analytics.weakTopicHeatmap.map((item, i) => {
                  const statusColor =
                    item.priorityStatus === "Critical Weakness"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : item.priorityStatus === "Moderate"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

                  return (
                    <div key={i} className="p-3.5 flex items-center justify-between gap-4 bg-[color:var(--surface-soft)]/40">
                      <div>
                        <p className="text-xs font-semibold">{item.topic}</p>
                        <p className="text-[11px] text-muted">Batch Mastery: {item.batchAverageMasteryPercent}%</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor}`}>
                        {item.priorityStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cohort Intervention Planning */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">TPO Intervention Action Plans</h2>
        {workspace.cohorts.map((cohort) => {
          const draft = getDraft(cohort.id);
          return (
            <article key={cohort.id} className="surface-card p-6">
              <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                <div>
                  <h3 className="text-xl font-semibold">{cohort.cohortLabel}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="surface-soft p-3 rounded-lg text-center">
                      <p className="text-[10px] uppercase text-muted">Active</p>
                      <p className="text-lg font-bold mt-1">{cohort.studentsActive}</p>
                    </div>
                    <div className="surface-soft p-3 rounded-lg text-center">
                      <p className="text-[10px] uppercase text-muted">Ready</p>
                      <p className="text-lg font-bold text-emerald-400 mt-1">{cohort.studentsReady}</p>
                    </div>
                    <div className="surface-soft p-3 rounded-lg text-center">
                      <p className="text-[10px] uppercase text-muted">Applications</p>
                      <p className="text-lg font-bold mt-1">{cohort.applicationsTracked}</p>
                    </div>
                    <div className="surface-soft p-3 rounded-lg text-center">
                      <p className="text-[10px] uppercase text-muted">Interviews</p>
                      <p className="text-lg font-bold text-cyan-400 mt-1">{cohort.interviewsTracked}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-soft">
                    Priority weak areas: <span className="text-[color:var(--foreground)] font-medium">{cohort.topWeakAreas.join(" · ")}</span>
                  </p>
                </div>

                <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)]">
                  <label className="mb-1 block text-xs font-semibold text-soft">TPO Target Sprint</label>
                  <input
                    className="w-full rounded border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-xs focus:border-cyan-500 focus:outline-none"
                    value={draft.priorityFocus}
                    onChange={(event) => updateDraft(cohort.id, { priorityFocus: event.target.value })}
                    placeholder="e.g. Schedule 3-day DP sprint before Amazon drive."
                  />

                  <label className="mb-1 mt-3 block text-xs font-semibold text-soft">Action Notes & Coordinator Remarks</label>
                  <textarea
                    className="w-full rounded border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-xs min-h-[80px] focus:border-cyan-500 focus:outline-none"
                    value={draft.note}
                    onChange={(event) => updateDraft(cohort.id, { note: event.target.value })}
                    placeholder="Log placement committee notes or peer-learning pairings."
                  />

                  <button
                    onClick={() => void saveIntervention(cohort.id)}
                    className="btn-primary mt-3 text-xs py-1.5 px-3"
                    disabled={savingCohortId === cohort.id}
                  >
                    {savingCohortId === cohort.id ? "Saving..." : "Save Intervention Plan"}
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
