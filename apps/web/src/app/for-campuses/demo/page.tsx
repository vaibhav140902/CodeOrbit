"use client";

import { useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { Button } from "@codeorbit/ui";

const SAMPLE_COHORTS = {
  "nit-trichy": {
    name: "National Institute of Technology (NIT), Trichy",
    batchYear: 2026,
    totalStudents: 140,
    verifiedStudents: 112,
    avgScore: 82.4,
    tiers: {
      faang: 28,
      strong: 54,
      borderline: 42,
      remedial: 16,
    },
    companies: [
      { name: "TCS Digital / Ninja", rate: 88, shortlists: 123, difficulty: "Moderate DSA + Aptitude" },
      { name: "Infosys Specialist Programmer (SP)", rate: 71, shortlists: 99, difficulty: "Hard Trees & Graphs" },
      { name: "Amazon SDE-1 / Intern", rate: 48, shortlists: 67, difficulty: "P99 DSA + Leadership Principles" },
      { name: "Flipkart GRiD SDE", rate: 39, shortlists: 54, difficulty: "Competitive Programming & Hard DP" },
      { name: "Google SDE-1", rate: 24, shortlists: 33, difficulty: "Advanced Graph/Trie Mastery" },
    ],
    proctorEvents: [
      { student: "Candidate #TR-104", event: "Fullscreen Maintained", trust: 99, status: "Verified Clean" },
      { student: "Candidate #TR-088", event: "Tab Blur (3.4s)", trust: 94, status: "Minor Penalty Flag" },
      { student: "Candidate #TR-023", event: "External Paste Detected", trust: 72, status: "Proctor Review Required" },
    ],
  },
  "kiet-ghaziabad": {
    name: "KIET Group of Institutions (AKTU), Ghaziabad",
    batchYear: 2026,
    totalStudents: 320,
    verifiedStudents: 268,
    avgScore: 74.8,
    tiers: {
      faang: 38,
      strong: 112,
      borderline: 126,
      remedial: 44,
    },
    companies: [
      { name: "TCS Digital / Ninja", rate: 91, shortlists: 291, difficulty: "Moderate DSA + Aptitude" },
      { name: "Cognizant GenC Next", rate: 84, shortlists: 268, difficulty: "Arrays, Strings & Basic OOP" },
      { name: "Infosys SP", rate: 64, shortlists: 204, difficulty: "Hard Trees & Graphs" },
      { name: "Amazon WOW / SDE-1", rate: 34, shortlists: 108, difficulty: "P99 DSA + System Depth" },
      { name: "Flipkart GRiD", rate: 28, shortlists: 89, difficulty: "Competitive Programming & Hard DP" },
    ],
    proctorEvents: [
      { student: "Candidate #KT-211", event: "Fullscreen Maintained", trust: 100, status: "Verified Clean" },
      { student: "Candidate #KT-145", event: "Tab Blur (1.2s)", trust: 97, status: "Verified Clean" },
      { student: "Candidate #KT-092", event: "Rapid Code Insertion", trust: 68, status: "Proctor Review Required" },
    ],
  },
};

export default function CampusDemoPage() {
  const [selectedCohortKey, setSelectedCohortKey] = useState<"nit-trichy" | "kiet-ghaziabad">("nit-trichy");
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState(0);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const cohort = SAMPLE_COHORTS[selectedCohortKey];
  const selectedCompany = cohort.companies[selectedCompanyIdx];

  const handleDownloadNirfCsv = async () => {
    setDownloadingCsv(true);
    try {
      const response = await fetch(`/api/platform/campus/nirf-export?cohortId=${selectedCohortKey}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codeorbit-nirf-placement-report-${selectedCohortKey}-2026.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Failed to download NIRF CSV:", err);
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <AppFrame>
      <div className="app-shell pb-24">
        <div className="page-container space-y-8 max-w-6xl mx-auto px-4 pt-6 sm:px-6">
          {/* Header */}
          <section className="surface-card p-6 sm:p-8 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-3">
                  <span>Interactive TPO Command Center Demo</span>
                  <span className="rounded bg-cyan-400/20 px-1.5 py-0.2 text-[10px] text-cyan-200">No Login Required</span>
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl text-slate-100">
                  Real-Time Campus Placement Readiness & NIRF Compliance
                </h1>
                <p className="section-copy mt-2 max-w-3xl">
                  Inspect live batch readiness distributions, company-specific Online Assessment (OA) clearance
                  predictions, and tamper-proof proctoring telemetry built for Indian university placement cells.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/for-campuses" className="btn-primary text-xs font-semibold py-2.5 px-4">
                  Request Campus Pilot →
                </Link>
              </div>
            </div>

            {/* Institution Switcher */}
            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Select Demo Cohort:</span>
              <button
                type="button"
                onClick={() => { setSelectedCohortKey("nit-trichy"); setSelectedCompanyIdx(0); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedCohortKey === "nit-trichy"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                NIT Trichy (CSE 2026)
              </button>
              <button
                type="button"
                onClick={() => { setSelectedCohortKey("kiet-ghaziabad"); setSelectedCompanyIdx(0); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedCohortKey === "kiet-ghaziabad"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                KIET Ghaziabad (AKTU 2026)
              </button>
            </div>
          </section>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="surface-card p-5 border-l-4 border-l-cyan-500">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Students</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">{cohort.totalStudents}</div>
              <span className="text-[11px] text-slate-400">Class of 2026 (Enrolled)</span>
            </div>

            <div className="surface-card p-5 border-l-4 border-l-emerald-500">
              <span className="text-xs text-slate-400 uppercase font-semibold">Evaluated & Verified</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">{cohort.verifiedStudents}</div>
              <span className="text-[11px] text-emerald-400/80">
                {Math.round((cohort.verifiedStudents / cohort.totalStudents) * 100)}% batch participation
              </span>
            </div>

            <div className="surface-card p-5 border-l-4 border-l-indigo-500">
              <span className="text-xs text-slate-400 uppercase font-semibold">Batch Avg Score</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 mt-1">{cohort.avgScore}/100</div>
              <span className="text-[11px] text-slate-400">Monaco DSA + ATS + Voice Mocks</span>
            </div>

            <div className="surface-card p-5 border-l-4 border-l-amber-500">
              <span className="text-xs text-slate-400 uppercase font-semibold">DPDP Section 6</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1">100%</div>
              <span className="text-[11px] text-amber-400/80">Zero fiduciary liability</span>
            </div>
          </section>

          {/* Section 1: Batch Readiness Tiers Distribution */}
          <section className="surface-card p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Batch Readiness Curve & Tier Distribution</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated categorization based on verified runtime metrics, anti-cheating signals, and ATS depth.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 rounded px-2.5 py-1">
                {cohort.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tier 1 Product Ready</span>
                <div className="text-3xl font-black text-emerald-300 mt-1">{cohort.tiers.faang}</div>
                <p className="text-xs text-slate-400 mt-2">
                  FAANG, Unicorns & Super Dream (85+ Readiness). Clears Hard DP, Graphs, and System Design.
                </p>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Strong Campus Shortlist</span>
                <div className="text-3xl font-black text-cyan-300 mt-1">{cohort.tiers.strong}</div>
                <p className="text-xs text-slate-400 mt-2">
                  70–84 Readiness. Ready for Amazon, Flipkart GRiD, and High-CTC Campus Day-1 drives.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Mass Recruiter Ready</span>
                <div className="text-3xl font-black text-amber-300 mt-1">{cohort.tiers.borderline}</div>
                <p className="text-xs text-slate-400 mt-2">
                  50–69 Readiness. Clears TCS Digital/Ninja, Infosys SP/SE, and Cognizant GenC screens.
                </p>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Remedial Focus Required</span>
                <div className="text-3xl font-black text-rose-300 mt-1">{cohort.tiers.remedial}</div>
                <p className="text-xs text-slate-400 mt-2">
                  &lt;50 Readiness. Blocked by syntax errors or lack of core DSA foundation. Auto-enrolled in remedial sprint.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Automated Company OA Clearance Predictor */}
          <section className="surface-card p-6 sm:p-8 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Automated Company OA Clearance Predictor</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate candidate clearance probabilities for upcoming on-campus recruitment drives.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {cohort.companies.map((comp, idx) => (
                <button
                  key={comp.name}
                  type="button"
                  onClick={() => setSelectedCompanyIdx(idx)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    selectedCompanyIdx === idx
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {comp.name}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Drive Profile</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">{selectedCompany.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Screening Bar: {selectedCompany.difficulty}</p>
              </div>

              <div className="text-center md:border-x md:border-indigo-800/40 px-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Estimated Batch Clearance</span>
                <div className="text-4xl font-black text-emerald-400 mt-1">{selectedCompany.rate}%</div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${selectedCompany.rate}%` }} />
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Predicted Shortlists</span>
                <div className="text-3xl font-black text-cyan-300 mt-1">
                  {selectedCompany.shortlists} <span className="text-sm font-normal text-slate-400">/ {cohort.totalStudents} students</span>
                </div>
                <p className="text-xs text-emerald-400/90 mt-1">
                  ✓ High statistical confidence based on verified proctored code solves
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Proctoring Telemetry & Anti-Cheating Telemetry */}
          <section className="surface-card p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Anti-Cheating Proctoring Telemetry</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proctoring without invasive video: Focus loss telemetry, clipboard analysis, and tamper-proof audits.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded px-2.5 py-1">
                Zero Invasive Webcam Surveillance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Candidate ID</th>
                    <th className="py-2.5 px-3">Telemetry Signal</th>
                    <th className="py-2.5 px-3">Proctor Trust Score</th>
                    <th className="py-2.5 px-3">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {cohort.proctorEvents.map((evt) => (
                    <tr key={evt.student} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 text-slate-300">{evt.student}</td>
                      <td className="py-3 px-3 text-slate-200">{evt.event}</td>
                      <td className="py-3 px-3 font-bold text-cyan-400">{evt.trust}%</td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-sans font-semibold ${
                            evt.status === "Verified Clean"
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                              : evt.status === "Minor Penalty Flag"
                              ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                              : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Accredited NIRF / NAAC Report Generation */}
          <section className="surface-card p-6 sm:p-8 space-y-4 border-2 border-indigo-500/40 bg-gradient-to-br from-slate-900 to-indigo-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="eyebrow-chip text-indigo-300 border-indigo-500/30 bg-indigo-500/10">
                  Accreditation & Compliance Pack
                </span>
                <h2 className="text-2xl font-bold text-slate-100 mt-2">
                  NIRF Metric 5.2.1 & NAAC Criterion V Compliance Report
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Institutions require verifiable evidence of structured competitive exam preparation and technical
                  training hours. Export certified CSV summaries ready for submission to government accreditors.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleDownloadNirfCsv}
                disabled={downloadingCsv}
                className="shrink-0 text-xs font-semibold py-2.5 px-4"
              >
                {downloadingCsv ? "Generating Report..." : "⬇ Download Accredited NIRF CSV"}
              </Button>
            </div>

            <div className="mt-4 rounded-lg bg-black/40 border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-indigo-300 font-bold">Preview of Accredited NIRF Placement Matrix:</div>
              <div>• AICTE/NIRF Metric: Metric 5.2.1 (Competitive Exam & Technical Placement Training)</div>
              <div>• Certified Candidates: {cohort.verifiedStudents} students ({cohort.name})</div>
              <div>• Proctored Code Solves: 340 hours logged with automated anti-cheat telemetry</div>
              <div>• DPDP Act 2023 Fiduciary Reference: DPDP-NIRF-2026-CERTIFIED (Active Consent Granted)</div>
            </div>
          </section>

          {/* Bottom Conversion Banner */}
          <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 p-6 sm:p-8 text-center space-y-4">
            <h3 className="text-2xl font-extrabold text-white">Ready to deploy CodeOrbit across your engineering batches?</h3>
            <p className="text-xs text-slate-300 max-w-2xl mx-auto">
              Zero upfront budget required. Set up your college portal in under 15 minutes and give your students
              industry-standard Monaco DSA, ATS AI Resumes, and Verified Proof Profiles.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link href="/for-campuses" className="btn-primary text-xs font-bold py-2.5 px-6">
                Request Free Institutional Pilot
              </Link>
              <Link href="/resume-roaster" className="btn-secondary text-xs font-semibold py-2.5 px-5">
                Try Student Resume Roaster
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
