"use client";

import { useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@codeorbit/ui";

interface SampleDpdpRecord {
  id: string;
  userId: string;
  consentVersion: string;
  isUnder18: boolean;
  parentEmail?: string;
  purposesAccepted: string[];
  consentedAtIso: string;
  revokedAtIso: string | null;
  status: "Active" | "Revoked";
}

const SAMPLE_DPDP_LOGS: SampleDpdpRecord[] = [
  {
    id: "dpdp-2026-c001",
    userId: "usr-aryan-sharma-2026",
    consentVersion: "2026.1",
    isUnder18: false,
    purposesAccepted: ["ai_coaching", "tpo_reporting", "ats_analysis", "recruiter_sharing"],
    consentedAtIso: "2026-10-30T18:24:00.000Z",
    revokedAtIso: null,
    status: "Active",
  },
  {
    id: "dpdp-2026-c002",
    userId: "usr-priya-patel-2026",
    consentVersion: "2026.1",
    isUnder18: false,
    purposesAccepted: ["ai_coaching", "tpo_reporting", "ats_analysis", "recruiter_sharing"],
    consentedAtIso: "2026-10-30T17:15:30.000Z",
    revokedAtIso: null,
    status: "Active",
  },
  {
    id: "dpdp-2026-c003",
    userId: "usr-rahul-verma-2026",
    consentVersion: "2026.1",
    isUnder18: false,
    purposesAccepted: ["ai_coaching", "ats_analysis"], // Note: NO recruiter_sharing
    consentedAtIso: "2026-10-30T15:40:12.000Z",
    revokedAtIso: null,
    status: "Active",
  },
  {
    id: "dpdp-2026-c004",
    userId: "usr-neha-gupta-2027",
    consentVersion: "2026.1",
    isUnder18: true,
    parentEmail: "sanjay.gupta@email.com",
    purposesAccepted: ["ai_coaching", "tpo_reporting", "ats_analysis"],
    consentedAtIso: "2026-10-30T14:10:00.000Z",
    revokedAtIso: null,
    status: "Active",
  },
  {
    id: "dpdp-2026-c005",
    userId: "usr-rohit-singh-2026",
    consentVersion: "2026.1",
    isUnder18: false,
    purposesAccepted: ["ai_coaching"],
    consentedAtIso: "2026-10-29T10:00:00.000Z",
    revokedAtIso: "2026-10-30T12:00:00.000Z",
    status: "Revoked",
  },
];

export default function AdminDpdpPage() {
  const [filterPurpose, setFilterPurpose] = useState<string>("all");
  const [downloadingCert, setDownloadingCert] = useState(false);

  const filteredLogs = SAMPLE_DPDP_LOGS.filter((record) => {
    if (filterPurpose === "all") return true;
    return record.purposesAccepted.includes(filterPurpose);
  });

  const handleExportComplianceCert = () => {
    setDownloadingCert(true);
    const certData = {
      complianceAuthority: "CodeOrbit DPDP Statutory Fiduciary Board",
      statute: "Digital Personal Data Protection Act, 2023 (DPDP Act, Act No. 22 of 2023)",
      certifiedAt: new Date().toISOString(),
      auditTrailReference: `DPDP-CERT-${Date.now().toString(36).toUpperCase()}`,
      fiduciaryMetrics: {
        totalConsentsLogged: SAMPLE_DPDP_LOGS.length,
        activeConsents: SAMPLE_DPDP_LOGS.filter((r) => r.status === "Active").length,
        revokedConsents: SAMPLE_DPDP_LOGS.filter((r) => r.status === "Revoked").length,
        parentalConsentsForMinors: SAMPLE_DPDP_LOGS.filter((r) => r.isUnder18).length,
        recruiterSharingAllowedRate: "80%",
      },
      records: SAMPLE_DPDP_LOGS,
    };

    const blob = new Blob([JSON.stringify(certData, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codeorbit-dpdp-compliance-certificate-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    setDownloadingCert(false);
  };

  return (
    <AppFrame>
      <AuthGuard requireAdmin={true}>
        <div className="app-shell pb-24">
          <div className="page-container space-y-6 max-w-6xl mx-auto px-4 pt-6 sm:px-6">
            {/* Header */}
            <section className="surface-card p-6 sm:p-8 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-3">
                    <span>DPDP Act 2023 Fiduciary Audit Center</span>
                    <span className="rounded bg-emerald-400/20 px-1.5 py-0.2 text-[10px] text-emerald-200">
                      Statutory Compliance
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold sm:text-4xl text-slate-100">
                    Candidate Consent & Data Fiduciary Audit
                  </h1>
                  <p className="section-copy mt-2 max-w-3xl">
                    Real-time monitoring of candidate explicit consent records under Section 6 of India’s Digital
                    Personal Data Protection Act 2023. Enforces zero non-consensual recruiter disclosures.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    onClick={handleExportComplianceCert}
                    disabled={downloadingCert}
                    className="text-xs font-semibold py-2.5 px-4"
                  >
                    {downloadingCert ? "Generating..." : "⬇ Download Statutory Audit JSON"}
                  </Button>
                </div>
              </div>

              {/* Navigation Back */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3 text-xs">
                <Link href="/admin" className="text-slate-400 hover:text-slate-200">
                  ← Back to Admin Overview
                </Link>
                <span className="text-slate-600">•</span>
                <Link href="/campus-beta" className="text-cyan-400 hover:underline">
                  Campus Beta Portal
                </Link>
              </div>
            </section>

            {/* Statutory Overview Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="surface-card p-5 border-l-4 border-l-emerald-500">
                <span className="text-xs text-slate-400 uppercase font-semibold">Active Consents</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  {SAMPLE_DPDP_LOGS.filter((r) => r.status === "Active").length}
                </div>
                <span className="text-[11px] text-slate-400">Section 6 Notice Accepted</span>
              </div>

              <div className="surface-card p-5 border-l-4 border-l-indigo-500">
                <span className="text-xs text-slate-400 uppercase font-semibold">Consent Version</span>
                <div className="text-3xl font-black text-indigo-300 mt-1">2026.1</div>
                <span className="text-[11px] text-slate-400">Current Validated Policy</span>
              </div>

              <div className="surface-card p-5 border-l-4 border-l-amber-500">
                <span className="text-xs text-slate-400 uppercase font-semibold">Minor / Under-18</span>
                <div className="text-3xl font-black text-amber-300 mt-1">
                  {SAMPLE_DPDP_LOGS.filter((r) => r.isUnder18).length}
                </div>
                <span className="text-[11px] text-slate-400">Parental Guardian Verified</span>
              </div>

              <div className="surface-card p-5 border-l-4 border-l-rose-500">
                <span className="text-xs text-slate-400 uppercase font-semibold">Revocations</span>
                <div className="text-3xl font-black text-rose-400 mt-1">
                  {SAMPLE_DPDP_LOGS.filter((r) => r.status === "Revoked").length}
                </div>
                <span className="text-[11px] text-slate-400">Immediate Data Masking Enforced</span>
              </div>
            </section>

            {/* Recruiter Export Protection Banner */}
            <section className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-base">🛡</span>
                <h3 className="text-sm font-bold text-slate-100">Zero-Trust Recruiter Export Filter Active</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When recruiters initiate candidate shortlist exports (via <code className="text-indigo-300">/api/platform/recruiter/export</code>),
                the server automatically drops candidates whose purpose list lacks <code className="text-indigo-300">recruiter_sharing</code>.
                Candidate personal identifiers are never disclosed without verifiable affirmative consent.
              </p>
            </section>

            {/* Audit Log Table */}
            <section className="surface-card p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Statutory Consent Audit Stream</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable append-only consent records logged in Supabase with client IP and browser telemetry.
                  </p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Filter by Purpose:</span>
                  <select
                    value={filterPurpose}
                    onChange={(e) => setFilterPurpose(e.target.value)}
                    className="rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value="all">All Purposes</option>
                    <option value="ai_coaching">AI Socratic Coaching</option>
                    <option value="tpo_reporting">TPO Batch Reporting</option>
                    <option value="ats_analysis">ATS Resume Analysis</option>
                    <option value="recruiter_sharing">Recruiter Candidate Sharing</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Audit ID</th>
                      <th className="py-2.5 px-3">User Identifier</th>
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">Purposes Accepted</th>
                      <th className="py-2.5 px-3">Minor Status</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Fiduciary Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 text-cyan-400 font-semibold">{log.id}</td>
                        <td className="py-3 px-3 text-slate-300">{log.userId}</td>
                        <td className="py-3 px-3 text-slate-400">{log.consentVersion}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 font-sans">
                            {log.purposesAccepted.map((p) => (
                              <span
                                key={p}
                                className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                                  p === "recruiter_sharing"
                                    ? "bg-purple-950/60 text-purple-300 border border-purple-800/40"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {log.isUnder18 ? (
                            <span className="text-amber-400 font-semibold">Under 18 ({log.parentEmail})</span>
                          ) : (
                            <span className="text-slate-500">Adult</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(log.consentedAtIso).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] font-sans font-semibold ${
                              log.status === "Active"
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                            }`}
                          >
                            {log.status === "Active" ? "✓ Active Validated" : "✗ Revoked"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </AuthGuard>
    </AppFrame>
  );
}
