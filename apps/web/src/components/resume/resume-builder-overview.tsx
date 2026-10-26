"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ActivitySummary, BillingSummary, DashboardSummary, ResumeInput, ResumeResponse } from "@codeorbit/schema";
import { Button } from "@codeorbit/ui";
import { resumeTemplates } from "@/data/hiring-os";
import { usePlatformAuth } from "@/lib/auth-context";
import { useAppPreferences } from "@/lib/preferences-context";
import { platformApi } from "@/lib/platform-api";

const freeBilling: BillingSummary = {
  planId: "free",
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

const initialInput: ResumeInput = {
  targetRole: "Frontend Developer",
  targetCompany: "Google",
  location: "Delhi, India",
  locale: "en",
  profileSummary: "",
  jobDescription: "",
  templateKey: "signal-single-column",
};

const emptyDashboard: DashboardSummary = {
  streak: 0,
  solvedCount: 0,
  weakTopics: [],
  recommendedTrack: "Company-first revision",
  premiumActive: false,
};

const emptyActivity: ActivitySummary = {
  recentSubmissions: [],
  pendingCount: 0,
  acceptedCount: 0,
  totalAttempts: 0,
};

const LOCAL_MOCK_SCORE_KEY = "codeorbit.latest-mock-score";
const LOCAL_SUBMISSION_KEY = "codeorbit.local-submissions";

type PreviewMode = "formatted" | "markdown" | "latex";

const buildAutoPrepSummary = (input: {
  targetRole: string;
  targetCompany?: string;
  dashboard: DashboardSummary;
  activity: ActivitySummary;
  recentProblemNames: string[];
  mockScore?: number;
  mockCompany?: string;
}) => {
  const lines = [
    `Targeting ${input.targetRole} roles${input.targetCompany ? ` at ${input.targetCompany}` : ""} for India-first hiring and global product teams.`,
    input.dashboard.solvedCount > 0
      ? `Solved ${input.dashboard.solvedCount} coding problems with a ${input.dashboard.streak}-day streak.`
      : "Building a coding portfolio through structured interview-style practice.",
    input.dashboard.weakTopics.length > 0
      ? `Current revision focus: ${input.dashboard.weakTopics.join(", ")}.`
      : "Current revision focus: Arrays, Strings, Binary Search.",
    input.recentProblemNames.length > 0
      ? `Recent solved or attempted problems: ${input.recentProblemNames.join(", ")}.`
      : "Recent prep includes core interview patterns such as arrays, strings, and hashing.",
    input.mockScore
      ? `Latest mock interview result: ${input.mockScore}/100${input.mockCompany ? ` in a ${input.mockCompany} style round` : ""}.`
      : "Mock interview practice is focused on concise communication and clear problem-solving structure.",
    input.activity.acceptedCount > 0
      ? `Accepted submissions in recent activity: ${input.activity.acceptedCount} out of ${input.activity.totalAttempts}.`
      : "Working toward stronger accepted submission ratios and faster debugging loops.",
  ];

  return lines.join(" ").replace(/\s+/g, " ").trim();
};

const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export function ResumeBuilderOverview() {
  const { profile, user } = usePlatformAuth();
  const { locale } = useAppPreferences();
  const [billing, setBilling] = useState<BillingSummary>(freeBilling);
  const [form, setForm] = useState<ResumeInput>(initialInput);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resume, setResume] = useState<ResumeResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>(emptyDashboard);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>(emptyActivity);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("formatted");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [summary, dashboard, activity] = await Promise.all([
          user ? platformApi.getBillingSummary().catch(() => freeBilling) : Promise.resolve(freeBilling),
          platformApi.getDashboardSummary().catch(() => emptyDashboard),
          platformApi.getActivitySummary().catch(() => emptyActivity),
        ]);

        if (!cancelled) {
          setBilling(summary);
          setDashboardSummary(dashboard);
          setActivitySummary(activity);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Resume billing fallback:", error);
          setBilling(freeBilling);
          setDashboardSummary(emptyDashboard);
          setActivitySummary(emptyActivity);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      locale,
    }));
  }, [locale]);

  const previewName = useMemo(() => profile?.displayName ?? "Candidate", [profile?.displayName]);

  const recentLocalSubmissions = useMemo(() => {
    if (typeof window === "undefined") {
      return [] as Array<{ problemName: string; status: string }>;
    }

    try {
      const parsed = JSON.parse(window.localStorage.getItem(LOCAL_SUBMISSION_KEY) ?? "[]") as Array<{
        problemName?: string;
        status?: string;
      }>;
      return parsed
        .filter((entry) => entry.problemName && entry.status)
        .map((entry) => ({ problemName: entry.problemName as string, status: entry.status as string }));
    } catch {
      return [];
    }
  }, []);

  const latestMockScore = useMemo(() => {
    if (typeof window === "undefined") {
      return null as null | { overallScore?: number; company?: string };
    }

    try {
      return JSON.parse(window.localStorage.getItem(LOCAL_MOCK_SCORE_KEY) ?? "null") as
        | { overallScore?: number; company?: string }
        | null;
    } catch {
      return null;
    }
  }, []);

  const autoProfileSummary = useMemo(() => {
    const recentProblemNames = Array.from(
      new Set([
        ...activitySummary.recentSubmissions.map((entry) => entry.problemName),
        ...recentLocalSubmissions.map((entry) => entry.problemName),
      ])
    ).slice(0, 6);

    return buildAutoPrepSummary({
      targetRole: form.targetRole,
      targetCompany: form.targetCompany,
      dashboard: dashboardSummary,
      activity: activitySummary,
      recentProblemNames,
      mockScore: latestMockScore?.overallScore,
      mockCompany: latestMockScore?.company,
    });
  }, [activitySummary, dashboardSummary, form.targetCompany, form.targetRole, latestMockScore?.company, latestMockScore?.overallScore, recentLocalSubmissions]);

  const selectedTemplate = useMemo(
    () => resumeTemplates.find((template) => template.key === form.templateKey) ?? resumeTemplates[0],
    [form.templateKey]
  );

  const handleChange = <K extends keyof ResumeInput>(key: K, value: ResumeInput[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleGenerate = async (mode: "normal" | "sample" = "normal") => {
    if (mode === "normal" && !billing.premiumActive) {
      setNotice("Full ATS resume generation requires Pro or Interview Sprint. Use the free sample or upgrade to continue.");
      return;
    }

    if (mode === "sample") {
      setSampleLoading(true);
    } else {
      setGenerating(true);
    }
    setNotice(null);

    try {
      const recentProblemNames = Array.from(
        new Set([
          ...activitySummary.recentSubmissions
            .filter((entry) => entry.status === "Accepted")
            .map((entry) => entry.problemName),
          ...recentLocalSubmissions
            .filter((entry) => entry.status === "Accepted")
            .map((entry) => entry.problemName),
        ])
      ).slice(0, 6);

      const response = await platformApi.generateResumeDraft(
        {
          ...form,
          candidateName: previewName,
          locale,
          sampleMode: mode === "sample",
          profileSummary:
            mode === "sample"
              ? autoProfileSummary
              : form.profileSummary?.trim()
                ? `${form.profileSummary}\n\n${autoProfileSummary}`
                : autoProfileSummary,
          prepContext: {
            solvedCount: dashboardSummary.solvedCount,
            streak: dashboardSummary.streak,
            weakTopics: dashboardSummary.weakTopics,
            recentProblemNames,
            latestMockScore: latestMockScore?.overallScore,
            latestMockCompany: latestMockScore?.company,
          },
        },
        mode === "sample" ? null : resumeFile
      );
      setResume(response);
      setPreviewMode("formatted");
      setNotice(
        mode === "sample"
          ? "Free sample resume generated from your prep signals and template defaults."
          : resumeFile
          ? `ATS draft generated from ${resumeFile.name} and refined for ${form.targetCompany ?? "your target hiring market"}.`
          : "ATS draft generated from your CodeOrbit prep profile, JD intent, and selected template."
      );
    } catch (error) {
      console.error("Resume generation failed:", error);
      setNotice(
        (error as { message?: string })?.message ||
          "Resume generation is unavailable. Confirm paid access and AI credentials."
      );
    } finally {
      setGenerating(false);
      setSampleLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resume) {
      setNotice("Generate your ATS resume first so there is something to export.");
      return;
    }

    if (!billing.premiumActive) {
      setNotice("PDF export is part of paid access. Upgrade to Pro or Interview Sprint to unlock it.");
      return;
    }

    setDownloading(true);
    setNotice(null);

    try {
      const response = await platformApi.exportResumePdf({
        draft: resume,
        fileNameHint: previewName,
      });
      const bytes = Uint8Array.from(atob(response.base64Pdf), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Resume PDF export failed:", error);
      setNotice(
        (error as { message?: string })?.message ||
          "PDF export failed. Confirm paid access and backend AI configuration."
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadLatex = () => {
    if (!resume) {
      setNotice("Generate your resume first to download the LaTeX source.");
      return;
    }

    downloadTextFile(resume.latexSource, `${previewName.replace(/\s+/g, "-").toLowerCase()}-resume.tex`, "text/x-tex");
    setNotice("LaTeX source downloaded. You can compile it on Overleaf or any local TeX setup.");
  };

  return (
    <div className="app-shell">
      <div className="page-container space-y-6">
        <header className="surface-card hero-orbit overflow-hidden p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Resume OS</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Build a recruiter-safe resume from your real prep signal.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-soft sm:text-base">
                Pick a template, paste a JD, upload an existing resume if you have one, and let CodeOrbit generate an ATS-friendly draft with keyword coverage, exportable PDF, and LaTeX source.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Current template</p>
                <p className="mt-2 text-lg font-semibold">{selectedTemplate.name}</p>
                <p className="mt-1 text-sm text-soft">{selectedTemplate.headline}</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Prep signal</p>
                <p className="mt-2 text-2xl font-semibold">{dashboardSummary.solvedCount}</p>
                <p className="mt-1 text-sm text-soft">Solved questions feeding resume proof</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Access</p>
                <p className="mt-2 text-lg font-semibold">{billing.premiumActive ? "Pro active" : "Free sample + Pro"}</p>
                <p className="mt-1 text-sm text-soft">PDF export, ATS scoring, and LaTeX are live in the builder.</p>
              </div>
            </div>
          </div>
        </header>

        {!billing.premiumActive && (
          <div className="surface-card border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            You can generate a free sample and inspect the ATS breakdown now. Paid access keeps the broader AI workflow unlocked.
            <Link href="/pricing" className="ml-2 underline">
              View plans
            </Link>
          </div>
        )}

        {notice && (
          <div className="surface-card border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-200">{notice}</div>
        )}

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-4">
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Choose a resume template</h2>
                  <p className="mt-1 text-sm text-soft">Each template keeps the same data model but changes the emphasis for the target hiring context.</p>
                </div>
                <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-muted">{selectedTemplate.key}</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {resumeTemplates.map((template) => {
                  const active = form.templateKey === template.key;
                  return (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => handleChange("templateKey", template.key)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        active
                          ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                          : "border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] hover:border-[color:var(--accent)]"
                      }`}
                    >
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p className="mt-2 text-sm leading-6 text-soft">{template.description}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">Best for</p>
                      <p className="mt-2 text-sm text-soft">{template.bestFor.join(" • ")}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="surface-card p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Target Role</label>
                  <input
                    value={form.targetRole}
                    onChange={(event) => handleChange("targetRole", event.target.value)}
                    className="field-input"
                    placeholder="Frontend Developer"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Target Company</label>
                    <input
                      value={form.targetCompany ?? ""}
                      onChange={(event) => handleChange("targetCompany", event.target.value)}
                      className="field-input"
                      placeholder="Amazon"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Location</label>
                    <input
                      value={form.location ?? ""}
                      onChange={(event) => handleChange("location", event.target.value)}
                      className="field-input"
                      placeholder="Delhi, India"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Paste Job Description</label>
                  <textarea
                    rows={6}
                    value={form.jobDescription ?? ""}
                    onChange={(event) => handleChange("jobDescription", event.target.value)}
                    className="field-textarea text-sm"
                    placeholder="Paste the JD or the strongest role requirements so ATS matching can get more specific..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Extra Profile Context</label>
                  <textarea
                    rows={6}
                    value={form.profileSummary ?? ""}
                    onChange={(event) => handleChange("profileSummary", event.target.value)}
                    className="field-textarea text-sm"
                    placeholder="Mention internships, shipped features, stack depth, hackathons, team ownership, or project outcomes..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Upload Existing Resume (PDF / Word / TXT)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                    className="field-input py-3 file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                  <p className="mt-2 text-xs text-muted">
                    {resumeFile
                      ? `Using ${resumeFile.name} as the source. CodeOrbit will merge it with your prep profile and target JD.`
                      : "Optional. Skip this if you want CodeOrbit to build a new draft directly from your prep, target role, and JD."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="primary" onClick={() => void handleGenerate()} disabled={generating || !billing.premiumActive}>
                  {!billing.premiumActive ? "Upgrade for Full ATS Resume" : generating ? "Generating..." : "Generate ATS Resume"}
                </Button>
                <Button variant="secondary" onClick={() => void handleGenerate("sample")} disabled={sampleLoading}>
                  {sampleLoading ? "Building sample..." : "Use Free Sample"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading || !resume || !billing.premiumActive}
                >
                  {downloading ? "Preparing PDF..." : "Download PDF"}
                </Button>
                <Button variant="secondary" onClick={handleDownloadLatex} disabled={!resume}>
                  Download LaTeX
                </Button>
              </div>
            </div>

            <div className="surface-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold">What CodeOrbit pulls in automatically</h2>
              <div className="mt-4 space-y-3 text-sm text-soft">
                <p>- Solved count, streak, weak topics, and accepted problem history from your prep flow.</p>
                <p>- Latest mock interview score when available.</p>
                <p>- Role and company intent from the JD, template, and manual context you add.</p>
                <p>- Recruiter-safe wording for India-first campus, fresher, product, and startup engineering roles.</p>
              </div>
            </div>
          </section>

          <aside className="surface-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Resume Preview</p>
                <h2 className="mt-2 text-2xl font-bold">{resume?.fullName ?? previewName}</h2>
                <p className="mt-1 text-sm text-soft">{resume?.headline ?? "Your ATS-ready draft will appear here."}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode("formatted")}
                  className={`rounded-full border px-3 py-1 ${previewMode === "formatted" ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : "border-[color:var(--border)]"}`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("markdown")}
                  className={`rounded-full border px-3 py-1 ${previewMode === "markdown" ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : "border-[color:var(--border)]"}`}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("latex")}
                  className={`rounded-full border px-3 py-1 ${previewMode === "latex" ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]" : "border-[color:var(--border)]"}`}
                >
                  LaTeX
                </button>
              </div>
            </div>

            {resume ? (
              <div className="space-y-5 pt-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="surface-soft p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">ATS score</p>
                    <p className="mt-2 text-3xl font-bold">{resume.atsScore}</p>
                  </div>
                  <div className="surface-soft p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Template</p>
                    <p className="mt-2 text-sm font-semibold">{resume.templateName}</p>
                  </div>
                  <div className="surface-soft p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Provider</p>
                    <p className="mt-2 text-sm font-semibold">{resume.provider}</p>
                  </div>
                </div>

                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">ATS summary</p>
                  <p className="mt-2 text-sm leading-7 text-soft">{resume.atsBreakdown.summary}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {resume.atsBreakdown.categories.map((category) => (
                    <div key={category.key} className="surface-soft p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{category.label}</p>
                        <span className="text-sm font-semibold text-[color:var(--accent)]">{category.score}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-soft">{category.insight}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="surface-soft p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Matched keywords</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {resume.atsBreakdown.matchedKeywords.length > 0 ? (
                        resume.atsBreakdown.matchedKeywords.map((keyword) => (
                          <span key={keyword} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-soft">Generate with a JD to surface stronger keyword coverage.</p>
                      )}
                    </div>
                  </div>
                  <div className="surface-soft p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Missing keywords</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {resume.atsBreakdown.missingKeywords.length > 0 ? (
                        resume.atsBreakdown.missingKeywords.map((keyword) => (
                          <span key={keyword} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-soft">Keyword coverage is already in a healthy range for the current brief.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Improvement actions</p>
                  <div className="mt-3 space-y-2 text-sm text-soft">
                    {resume.atsBreakdown.improvementActions.map((item) => (
                      <p key={item}>- {item}</p>
                    ))}
                  </div>
                </div>

                {previewMode === "formatted" ? (
                  <div className="space-y-5 text-sm text-soft">
                    <section>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Summary</p>
                      <p className="mt-2 leading-7">{resume.summary}</p>
                    </section>

                    <section>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {resume.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Experience</p>
                      <div className="mt-2 space-y-3">
                        {resume.experience.map((entry) => (
                          <div key={`${entry.title}-${entry.organization}`} className="rounded-2xl border border-[color:var(--border)] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-[color:var(--text-main)]">
                                {entry.title} | {entry.organization}
                              </p>
                              {entry.timeline && <span className="text-xs text-muted">{entry.timeline}</span>}
                            </div>
                            <div className="mt-2 space-y-2">
                              {entry.bullets.map((bullet) => (
                                <p key={bullet}>- {bullet}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Projects</p>
                      <div className="mt-2 space-y-3">
                        {resume.projects.map((project) => (
                          <div key={project.title} className="rounded-2xl border border-[color:var(--border)] p-4">
                            <p className="font-semibold text-[color:var(--text-main)]">
                              {project.title}
                              {project.link && <span className="ml-2 text-xs text-[color:var(--accent)]">{project.link}</span>}
                            </p>
                            <div className="mt-2 space-y-2">
                              {project.bullets.map((bullet) => (
                                <p key={bullet}>- {bullet}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Education</p>
                      <div className="mt-2 space-y-3">
                        {resume.education.map((entry) => (
                          <div key={`${entry.institution}-${entry.degree}`} className="rounded-2xl border border-[color:var(--border)] p-4">
                            <p className="font-semibold text-[color:var(--text-main)]">
                              {entry.degree} | {entry.institution}
                            </p>
                            {entry.details && <p className="mt-2">{entry.details}</p>}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Achievements</p>
                      <div className="mt-2 space-y-2">
                        {resume.achievements.map((item) => (
                          <p key={item} className="rounded-2xl border border-[color:var(--border)] px-3 py-2">
                            {item}
                          </p>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : previewMode === "markdown" ? (
                  <pre className="overflow-auto rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4 whitespace-pre-wrap text-xs leading-6">
                    {resume.markdown}
                  </pre>
                ) : (
                  <pre className="overflow-auto rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4 whitespace-pre-wrap text-xs leading-6">
                    {resume.latexSource}
                  </pre>
                )}
              </div>
            ) : (
              <div className="pt-5 text-sm text-soft">
                Generate a draft to see ATS category scores, matched keywords, improvement actions, formatted preview, markdown, and LaTeX source here.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
