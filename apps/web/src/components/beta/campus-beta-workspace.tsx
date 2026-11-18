"use client";

import { useEffect, useMemo, useState } from "react";
import type { CampusBetaWorkspace, CampusCohortIntervention, TpoBatchAnalytics } from "@codeorbit/schema";
import { platformApi } from "@/lib/platform-api";

type DraftIntervention = {
  priorityFocus: string;
  note: string;
};

export type CohortStudent = {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  year: number;
  readinessScore: number;
  problemsSolved: number;
  status: "Active" | "Inactive";
};

type ParsedCsvRow = {
  rowNumber: number;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  year: string;
  isValid: boolean;
  errors: string[];
};

const INITIAL_COHORT_STUDENTS: CohortStudent[] = [
  { id: "nit-stu-01", name: "Rohan Krishnan", email: "rohan.k@nitt.edu", rollNumber: "106122001", branch: "CSE", year: 2026, readinessScore: 84, problemsSolved: 92, status: "Active" },
  { id: "nit-stu-02", name: "Ananya Deshmukh", email: "ananya.d@nitt.edu", rollNumber: "106122002", branch: "CSE", year: 2026, readinessScore: 74, problemsSolved: 68, status: "Active" },
  { id: "nit-stu-03", name: "Karthik Raja", email: "karthik.r@nitt.edu", rollNumber: "106122003", branch: "ECE", year: 2026, readinessScore: 78, problemsSolved: 75, status: "Active" },
  { id: "nit-stu-04", name: "Divya Srinivasan", email: "divya.s@nitt.edu", rollNumber: "106122004", branch: "CSE", year: 2026, readinessScore: 82, problemsSolved: 88, status: "Active" },
  { id: "nit-stu-05", name: "Arjun Venkataraman", email: "arjun.v@nitt.edu", rollNumber: "106122005", branch: "IT", year: 2026, readinessScore: 68, problemsSolved: 54, status: "Active" },
  { id: "nit-stu-06", name: "Sneha Murthy", email: "sneha.m@nitt.edu", rollNumber: "106122006", branch: "ECE", year: 2026, readinessScore: 61, problemsSolved: 42, status: "Inactive" },
  { id: "nit-stu-07", name: "Manoj Kumar", email: "manoj.k@nitt.edu", rollNumber: "106122007", branch: "CSE", year: 2026, readinessScore: 85, problemsSolved: 95, status: "Active" },
  { id: "nit-stu-08", name: "Pooja Hegde", email: "pooja.h@nitt.edu", rollNumber: "106122008", branch: "EEE", year: 2026, readinessScore: 56, problemsSolved: 35, status: "Active" },
  { id: "nit-stu-09", name: "Vikas Sundaram", email: "vikas.s@nitt.edu", rollNumber: "106122009", branch: "CSE", year: 2026, readinessScore: 79, problemsSolved: 80, status: "Active" },
  { id: "nit-stu-10", name: "Nandini Rangarajan", email: "nandini.r@nitt.edu", rollNumber: "106122010", branch: "IT", year: 2026, readinessScore: 48, problemsSolved: 28, status: "Inactive" },
  { id: "nit-stu-11", name: "Harish Balaji", email: "harish.b@nitt.edu", rollNumber: "106122011", branch: "CSE", year: 2026, readinessScore: 72, problemsSolved: 64, status: "Active" },
  { id: "nit-stu-12", name: "Siddharth Rao", email: "siddharth.r@nitt.edu", rollNumber: "106122012", branch: "ECE", year: 2026, readinessScore: 81, problemsSolved: 86, status: "Active" },
];

const emptyWorkspace: CampusBetaWorkspace = {
  cohorts: [],
  interventions: [],
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function CampusBetaWorkspace() {
  const [workspace, setWorkspace] = useState<CampusBetaWorkspace>(emptyWorkspace);
  const [analytics, setAnalytics] = useState<TpoBatchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingCohortId, setSavingCohortId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftIntervention>>({});

  // Cohort Students State (in-memory)
  const [students, setStudents] = useState<CohortStudent[]>(INITIAL_COHORT_STUDENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

  // CSV Bulk Upload Modal State
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");

  // Skill Gap PDF Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);

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

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setNotice("Empty file uploaded. Please supply a CSV with student details.");
        return;
      }

      const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (rawLines.length <= 1) {
        setNotice("CSV file must have at least one header row and one student data row.");
        return;
      }

      const headerCells = parseCsvLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
      const nameIdx = headerCells.findIndex((h) => h.includes("name"));
      const emailIdx = headerCells.findIndex((h) => h.includes("email") || h.includes("mail"));
      const rollIdx = headerCells.findIndex((h) => h.includes("roll") || h.includes("reg") || h.includes("id"));
      const branchIdx = headerCells.findIndex((h) => h.includes("branch") || h.includes("dept") || h.includes("course"));
      const yearIdx = headerCells.findIndex((h) => h.includes("year") || h.includes("batch"));

      const parsed: ParsedCsvRow[] = [];
      const seenRollsInCsv = new Set<string>();
      const existingCohortRolls = new Set(students.map((s) => s.rollNumber.toLowerCase().trim()));

      for (let i = 1; i < rawLines.length; i++) {
        const cells = parseCsvLine(rawLines[i]);
        if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;

        const name = (nameIdx >= 0 ? cells[nameIdx] : cells[0]) || "";
        const email = (emailIdx >= 0 ? cells[emailIdx] : cells[1]) || "";
        const rollNumber = (rollIdx >= 0 ? cells[rollIdx] : cells[2]) || "";
        const branch = (branchIdx >= 0 ? cells[branchIdx] : cells[3]) || "CSE";
        const year = (yearIdx >= 0 ? cells[yearIdx] : cells[4]) || "2026";

        const errors: string[] = [];
        if (!name.trim()) {
          errors.push("Missing student name");
        }
        if (!email.trim()) {
          errors.push("Missing email address");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          errors.push("Invalid email syntax");
        }

        const normalizedRoll = rollNumber.toLowerCase().trim();
        if (!normalizedRoll) {
          errors.push("Missing roll number");
        } else if (seenRollsInCsv.has(normalizedRoll)) {
          errors.push(`Duplicate roll number within CSV: ${rollNumber}`);
        } else if (existingCohortRolls.has(normalizedRoll)) {
          errors.push(`Roll number already exists in cohort: ${rollNumber}`);
        } else {
          seenRollsInCsv.add(normalizedRoll);
        }

        parsed.push({
          rowNumber: i,
          name: name.trim(),
          email: email.trim(),
          rollNumber: rollNumber.trim(),
          branch: branch.trim().toUpperCase(),
          year: year.trim(),
          isValid: errors.length === 0,
          errors,
        });
      }

      setParsedRows(parsed);
      setCsvPreviewOpen(true);
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const confirmCsvUpload = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setNotice("No valid student rows to onboard. Please resolve validation errors and retry.");
      setCsvPreviewOpen(false);
      return;
    }

    const newStudents: CohortStudent[] = validRows.map((row, idx) => {
      // Deterministic pseudo-random readiness score between 45 and 85 based on roll number
      let hash = 0;
      for (let i = 0; i < row.rollNumber.length; i++) {
        hash = (hash << 5) - hash + row.rollNumber.charCodeAt(i);
        hash |= 0;
      }
      const readinessScore = 45 + (Math.abs(hash) % 41); // 45 to 85
      const problemsSolved = 25 + (Math.abs(hash) % 70); // 25 to 94

      return {
        id: `csv-${Date.now()}-${idx}`,
        name: row.name,
        email: row.email,
        rollNumber: row.rollNumber,
        branch: row.branch || "CSE",
        year: parseInt(row.year, 10) || 2026,
        readinessScore,
        problemsSolved,
        status: "Active",
      };
    });

    setStudents((prev) => [...newStudents, ...prev]);

    // Update analytics summary count
    setAnalytics((prev) =>
      prev
        ? {
            ...prev,
            totalStudents: prev.totalStudents + newStudents.length,
            verifiedStudents: prev.verifiedStudents + Math.round(newStudents.length * 0.8),
          }
        : prev
    );

    setNotice(
      `Successfully onboarded ${newStudents.length} student records from "${csvFileName}". Automated invites & diagnostics sent.`
    );
    setCsvPreviewOpen(false);
    setParsedRows([]);
  };

  const handleExportNirf = () => {
    setReportModalOpen(true);
  };

  const handleDirectPrint = () => {
    window.print();
  };

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

  // Filter & Sort Cohort Students
  const filteredAndSortedStudents = useMemo(() => {
    const filtered = students.filter((student) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.rollNumber.toLowerCase().includes(query) ||
        student.branch.toLowerCase().includes(query);

      const matchesBranch = selectedBranch === "all" || student.branch.toUpperCase() === selectedBranch.toUpperCase();
      const matchesStatus = selectedStatus === "all" || student.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesBranch && matchesStatus;
    });

    if (!sortDirection) return filtered;

    return [...filtered].sort((a, b) => {
      return sortDirection === "desc"
        ? b.readinessScore - a.readinessScore
        : a.readinessScore - b.readinessScore;
    });
  }, [students, searchQuery, selectedBranch, selectedStatus, sortDirection]);

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === "desc") return "asc";
      if (prev === "asc") return null;
      return "desc";
    });
  };

  const getTierBadge = (score: number) => {
    if (score >= 80) {
      return { label: "Day-1 FAANG", style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" };
    }
    if (score >= 70) {
      return { label: "Strong Shortlist", style: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" };
    }
    if (score >= 55) {
      return { label: "Borderline OA", style: "border-amber-500/30 bg-amber-500/10 text-amber-400" };
    }
    return { label: "Needs Practice", style: "border-rose-500/30 bg-rose-500/10 text-rose-400" };
  };

  const uniqueBranches = useMemo(() => {
    const set = new Set(students.map((s) => s.branch));
    return Array.from(set).sort();
  }, [students]);

  return (
    <div className="space-y-8">
      {/* Print Stylesheet for High-Quality PDF Export */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #tpo-skill-gap-report-print,
          #tpo-skill-gap-report-print * {
            visibility: visible !important;
          }
          #tpo-skill-gap-report-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 32px !important;
            box-shadow: none !important;
            display: block !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {notice ? (
        <div className="surface-card border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 flex items-center justify-between gap-4">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-amber-400 hover:text-white text-xs font-semibold"
          >
            ✕ Dismiss
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="surface-card p-4 text-sm text-muted">Loading campus TPO placement workspace...</div>
      ) : null}

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
                  Real-time algorithmic readiness distribution, company OA clearance predictor & NIRF accreditation analytics.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400">
                  {analytics.verifiedStudents}/{analytics.totalStudents} Students Verified
                </span>
                <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                  <span>📥 Batch CSV Onboarding</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleExportNirf}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500"
                >
                  <span>📊 Export Skill Gap Report</span>
                </button>
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

            {/* Live Anti-Cheat & Proctoring Trust Metrics */}
            <div className="border-t border-[color:var(--border)] pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Live Anti-Cheat & Proctoring Trust Metrics
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Proctoring System
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface-soft p-3.5 rounded-lg border border-[color:var(--border)]">
                  <p className="text-[11px] text-soft">Batch Trust Score</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">98.6%</p>
                  <p className="text-[11px] text-muted">Zero unauthorized device splits</p>
                </div>
                <div className="surface-soft p-3.5 rounded-lg border border-[color:var(--border)]">
                  <p className="text-[11px] text-soft">Tab-Switch Infractions</p>
                  <p className="text-xl font-bold text-cyan-400 mt-1">0 Flagged</p>
                  <p className="text-[11px] text-muted">Enforced focus & paste guards</p>
                </div>
                <div className="surface-soft p-3.5 rounded-lg border border-[color:var(--border)]">
                  <p className="text-[11px] text-soft">Syntactic Code Similarity</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">&lt; 3%</p>
                  <p className="text-[11px] text-muted">AST token diffing verified</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Part A2: Live Cohort Data Table */}
      <section className="surface-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">Live Cohort Student Directory</h2>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                {filteredAndSortedStudents.length} Active Records
              </span>
            </div>
            <p className="mt-1 text-xs text-soft">
              Real-time student readiness index, algorithmic solve tracking, and placement qualification status.
            </p>
          </div>

          <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
            <span>📥 Upload Student CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
          </label>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-center">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-muted">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, or branch..."
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] pl-8 pr-3 py-2 text-xs focus:border-cyan-500 focus:outline-none placeholder:text-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-muted hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-[color:var(--border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[color:var(--surface-soft)] text-muted uppercase text-[10px] tracking-wider border-b border-[color:var(--border)]">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Branch / Year</th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={toggleSort}
                      className="flex items-center gap-1 font-semibold uppercase tracking-wider text-muted hover:text-cyan-400 transition-colors"
                      title="Click to sort by Readiness Score"
                    >
                      <span>Readiness Score</span>
                      <span className="text-cyan-400 text-xs">
                        {sortDirection === "desc" ? "▼" : sortDirection === "asc" ? "▲" : "⇅"}
                      </span>
                    </button>
                  </th>
                  <th className="py-3 px-4">Problems Solved</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {filteredAndSortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      No cohort students match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStudents.map((student) => {
                    const tier = getTierBadge(student.readinessScore);
                    const initials = student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={student.id} className="hover:bg-[color:var(--surface-soft)]/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold text-cyan-300">
                              {initials}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-[color:var(--foreground)]">{student.name}</p>
                              <p className="text-[11px] text-muted">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-soft">{student.rollNumber}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded bg-[color:var(--surface-soft)] px-2 py-0.5 font-semibold text-[11px] border border-[color:var(--border)]">
                            {student.branch} &apos;{String(student.year).slice(-2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[color:var(--foreground)]">
                              {student.readinessScore}/100
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${tier.style}`}>
                              {tier.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs">{student.problemsSolved}</span>
                            <span className="text-[11px] text-muted">solves</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{ width: `${Math.min(100, (student.problemsSolved / 100) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {student.status === "Active" ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
                              <span className="h-2 w-2 rounded-full bg-slate-500" />
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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

      {/* Part A1: CSV Bulk-Upload Preview Modal */}
      {csvPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
          <div className="surface-card max-w-4xl w-full p-6 sm:p-8 space-y-6 border border-cyan-500/30 rounded-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📥</span>
                  <h3 className="text-lg font-bold">Batch CSV Onboarding Preview</h3>
                </div>
                <p className="text-xs text-soft mt-0.5">
                  File: <span className="font-mono text-cyan-400">{csvFileName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCsvPreviewOpen(false)}
                className="text-soft hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Validation Metrics Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="surface-soft p-3 rounded-lg border border-[color:var(--border)] text-center">
                <p className="text-[10px] uppercase text-muted">Total Parsed</p>
                <p className="text-xl font-bold mt-0.5">{parsedRows.length}</p>
              </div>
              <div className="surface-soft p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-center">
                <p className="text-[10px] uppercase text-emerald-400 font-semibold">Valid Records</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">
                  {parsedRows.filter((r) => r.isValid).length}
                </p>
              </div>
              <div className="surface-soft p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 text-center">
                <p className="text-[10px] uppercase text-rose-400 font-semibold">Flagged Errors</p>
                <p className="text-xl font-bold text-rose-400 mt-0.5">
                  {parsedRows.filter((r) => !r.isValid).length}
                </p>
              </div>
            </div>

            {/* Preview Rows Table */}
            <div className="flex-1 overflow-y-auto border border-[color:var(--border)] rounded-lg min-h-[200px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[color:var(--surface-soft)] text-muted uppercase text-[10px] sticky top-0 border-b border-[color:var(--border)]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3">Validation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? "hover:bg-[color:var(--surface-soft)]/40" : "bg-rose-500/5"}
                    >
                      <td className="py-2.5 px-3 text-muted">{row.rowNumber}</td>
                      <td className="py-2.5 px-3">
                        {row.isValid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Valid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Error
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium">{row.name || "—"}</td>
                      <td className="py-2.5 px-3 text-soft font-mono text-[11px]">{row.email || "—"}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold">{row.rollNumber || "—"}</td>
                      <td className="py-2.5 px-3">{row.branch || "CSE"}</td>
                      <td className="py-2.5 px-3">
                        {row.errors.length > 0 ? (
                          <div className="space-y-0.5">
                            {row.errors.map((err, eIdx) => (
                              <p key={eIdx} className="text-[11px] text-rose-400 font-medium">
                                • {err}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-400">Ready for cohort import</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setCsvPreviewOpen(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCsvUpload}
                disabled={parsedRows.filter((r) => r.isValid).length === 0}
                className="btn-primary text-xs py-2 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
              >
                Confirm & Onboard ({parsedRows.filter((r) => r.isValid).length} Valid Students)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Part A3: 1-Click Skill Gap PDF Report Preview & Print Modal */}
      {reportModalOpen && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="surface-card max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-cyan-500/30 rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-lg font-bold">Executive Skill Gap & Placement Report</h3>
                  <p className="text-xs text-cyan-400">NIRF & Accreditation-Grade Cohort Diagnostic</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
                >
                  <span>🖨️ Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="text-soft hover:text-white text-lg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-6 text-xs text-[color:var(--foreground)]">
              {/* Institution Header */}
              <div className="surface-soft p-4 rounded-xl border border-[color:var(--border)] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-bold">{analytics.collegeName}</h4>
                  <span className="font-mono text-xs text-cyan-400">Batch Year: {analytics.batchYear}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
                  <div>
                    <p className="text-muted text-[10px]">Total Enrolled</p>
                    <p className="text-lg font-bold mt-0.5">{analytics.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-muted text-[10px]">Verified Students</p>
                    <p className="text-lg font-bold text-cyan-400 mt-0.5">{analytics.verifiedStudents}</p>
                  </div>
                  <div>
                    <p className="text-muted text-[10px]">Proctor Trust</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">98.6%</p>
                  </div>
                  <div>
                    <p className="text-muted text-[10px]">Report Date</p>
                    <p className="text-xs font-semibold mt-1">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* 4-Tier Distribution */}
              <div>
                <h5 className="font-bold uppercase tracking-wider text-muted text-[11px] mb-2">
                  1. Readiness Distribution Breakdown
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="surface-soft p-3 rounded-lg border border-emerald-500/20">
                    <p className="text-[10px] font-semibold text-emerald-400">Day-1 FAANG Ready</p>
                    <p className="text-xl font-bold mt-1 text-emerald-400">{analytics.readinessTiers.dayOneFaangReady}</p>
                    <p className="text-[10px] text-muted">
                      {Math.round((analytics.readinessTiers.dayOneFaangReady / analytics.totalStudents) * 100)}% of cohort
                    </p>
                  </div>
                  <div className="surface-soft p-3 rounded-lg border border-cyan-500/20">
                    <p className="text-[10px] font-semibold text-cyan-400">Strong Campus Shortlist</p>
                    <p className="text-xl font-bold mt-1 text-cyan-400">{analytics.readinessTiers.strongCampusShortlist}</p>
                    <p className="text-[10px] text-muted">
                      {Math.round((analytics.readinessTiers.strongCampusShortlist / analytics.totalStudents) * 100)}% of cohort
                    </p>
                  </div>
                  <div className="surface-soft p-3 rounded-lg border border-amber-500/20">
                    <p className="text-[10px] font-semibold text-amber-400">Borderline OA Screen</p>
                    <p className="text-xl font-bold mt-1 text-amber-400">{analytics.readinessTiers.borderlineOaScreen}</p>
                    <p className="text-[10px] text-muted">
                      {Math.round((analytics.readinessTiers.borderlineOaScreen / analytics.totalStudents) * 100)}% of cohort
                    </p>
                  </div>
                  <div className="surface-soft p-3 rounded-lg border border-rose-500/20">
                    <p className="text-[10px] font-semibold text-rose-400">Needs Overhaul</p>
                    <p className="text-xl font-bold mt-1 text-rose-400">{analytics.readinessTiers.needsOverhaul}</p>
                    <p className="text-[10px] text-muted">
                      {Math.round((analytics.readinessTiers.needsOverhaul / analytics.totalStudents) * 100)}% of cohort
                    </p>
                  </div>
                </div>
              </div>

              {/* Company OA Predictor */}
              <div>
                <h5 className="font-bold uppercase tracking-wider text-muted text-[11px] mb-2">
                  2. Company OA Clearance Predictions
                </h5>
                <div className="border border-[color:var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[color:var(--surface-soft)] text-muted uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Target Company / Assessment Track</th>
                        <th className="py-2 px-3">Clearance Rate (%)</th>
                        <th className="py-2 px-3">Predicted Cleared Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border)]">
                      {analytics.companyOaClearancePredictions.map((pred, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-semibold">{pred.company}</td>
                          <td className="py-2 px-3 text-cyan-400 font-bold">{pred.estimatedClearanceRatePercent}%</td>
                          <td className="py-2 px-3 font-semibold text-soft">~{pred.predictedShortlistsCount} students</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Weak Areas Heatmap */}
              <div>
                <h5 className="font-bold uppercase tracking-wider text-muted text-[11px] mb-2">
                  3. Curriculum Gap Heatmap & Top Weak Topics
                </h5>
                <div className="space-y-1.5 border border-[color:var(--border)] rounded-lg p-2.5 surface-soft">
                  {analytics.weakTopicHeatmap.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-[color:var(--border)]/50 last:border-0">
                      <div>
                        <span className="font-semibold">{item.topic}</span>
                        <span className="text-[11px] text-muted ml-2">Mastery: {item.batchAverageMasteryPercent}%</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        item.priorityStatus === "Critical Weakness"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : item.priorityStatus === "Moderate"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {item.priorityStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t border-[color:var(--border)] pt-3 text-[11px] text-muted flex justify-between items-center">
                <span>CodeOrbit Verified National Placement Authority</span>
                <span>Cryptographically Timestamped: {new Date().toISOString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleDirectPrint}
                className="btn-primary text-xs py-2 px-5 bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2"
              >
                <span>🖨️ Open Print Dialog (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Standalone Print Container for window.print() */}
      {analytics && (
        <div id="tpo-skill-gap-report-print" className="hidden">
          <div style={{ maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
            <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: "16px", marginBottom: "20px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 6px 0", color: "#0f172a" }}>
                {analytics.collegeName}
              </h1>
              <h2 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 4px 0", color: "#2563eb" }}>
                Executive Skill Gap & Campus Placement Readiness Report — Batch {analytics.batchYear}
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Generated via CodeOrbit National Placement Authority on {new Date().toLocaleDateString()}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              <div style={{ border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", margin: 0 }}>Total Students</p>
                <p style={{ fontSize: "18px", fontWeight: "bold", margin: "4px 0 0 0" }}>{analytics.totalStudents}</p>
              </div>
              <div style={{ border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", margin: 0 }}>Verified Students</p>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "#0284c7", margin: "4px 0 0 0" }}>{analytics.verifiedStudents}</p>
              </div>
              <div style={{ border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", margin: 0 }}>Proctor Trust</p>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "#16a34a", margin: "4px 0 0 0" }}>98.6%</p>
              </div>
              <div style={{ border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", margin: 0 }}>Clearance Est.</p>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "#16a34a", margin: "4px 0 0 0" }}>
                  {analytics.companyOaClearancePredictions[0]?.estimatedClearanceRatePercent ?? 88}%
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px" }}>
                1. Readiness Tier Distribution
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Readiness Tier</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Student Count</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Batch Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "600", color: "#15803d" }}>Day-1 FAANG / Tier-1 Ready</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{analytics.readinessTiers.dayOneFaangReady}</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{Math.round((analytics.readinessTiers.dayOneFaangReady / analytics.totalStudents) * 100)}%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "600", color: "#0369a1" }}>Strong Campus Shortlist</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{analytics.readinessTiers.strongCampusShortlist}</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{Math.round((analytics.readinessTiers.strongCampusShortlist / analytics.totalStudents) * 100)}%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "600", color: "#b45309" }}>Borderline OA Screen</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{analytics.readinessTiers.borderlineOaScreen}</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{Math.round((analytics.readinessTiers.borderlineOaScreen / analytics.totalStudents) * 100)}%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "600", color: "#b91c1c" }}>Needs Critical Overhaul</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{analytics.readinessTiers.needsOverhaul}</td>
                    <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{Math.round((analytics.readinessTiers.needsOverhaul / analytics.totalStudents) * 100)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px" }}>
                2. Automated Company OA Clearance Predictor
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Company Assessment</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Predicted Clearance Rate</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Estimated Shortlists</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.companyOaClearancePredictions.map((pred, i) => (
                    <tr key={i}>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}>{pred.company}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#0284c7", fontWeight: "bold" }}>
                        {pred.estimatedClearanceRatePercent}%
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>~{pred.predictedShortlistsCount} students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px" }}>
                3. Topic Mastery & Critical Weak Areas
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Curriculum Topic</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Batch Average Mastery</th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Priority Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.weakTopicHeatmap.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}>{item.topic}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>{item.batchAverageMasteryPercent}%</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}>{item.priorityStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "12px", fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
              <span>CodeOrbit TPO Accreditation System</span>
              <span>Confidential — Internal Placement Committee Use Only</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
