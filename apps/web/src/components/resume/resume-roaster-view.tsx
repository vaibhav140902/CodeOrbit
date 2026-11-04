"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@codeorbit/ui";
import type { ResumeRoasterResponse } from "@codeorbit/schema";
import { platformApi } from "@/lib/platform-api";
import { PLATFORM_METRICS, HONEST_MARKETING_CLAIMS } from "@/data/platform-config";

const SAMPLE_RESUMES = {
  fresher: `ANANYA SHARMA
Bengaluru, India | ananya.sharma@email.com | github.com/ananya-dev | linkedin.com/in/ananya-sharma

SUMMARY
Enthusiastic and hardworking Computer Science graduate passionate about software development and problem solving. Quick learner and team player looking for challenging opportunities at Amazon.

EDUCATION
B.Tech in Computer Science and Engineering | National Institute of Technology (NIT) | 2021 - 2025 | CGPA: 8.7/10

TECHNICAL SKILLS
Languages: C++, Java, JavaScript, Python
Core: Data Structures, Algorithms, Object-Oriented Programming, DBMS, SQL
Web & Cloud: React.js, Node.js, Express, Basic AWS (EC2, S3)
Tools: Git, GitHub, VS Code, Postman

PROJECTS
E-Commerce Microservices Platform
• Built an online store backend using Node.js, Express, and MongoDB.
• Implemented user authentication using JWT and integrated Stripe for payment processing.
• Created REST APIs for product catalog, shopping cart, and order placement.
• Deployed the application to AWS EC2 instance.

Algorithm Visualizer
• Developed an interactive web app using React to visualize sorting and graph traversal algorithms.
• Implemented Dijkstra's, BFS, DFS, Merge Sort, and Quick Sort with real-time speed controls.
• Used by 150+ classmates for DSA semester exam preparation.

ACHIEVEMENTS & CERTIFICATIONS
• Solved 250+ problems on LeetCode and CodeOrbit across Arrays, Strings, and Trees.
• Finalist in Smart India Hackathon (SIH 2024).
• AWS Certified Cloud Practitioner.`,

  fluffy: `RAHUL VERMA
New Delhi, India | rahul.v@email.com

OBJECTIVE
Self-motivated, dynamic, and detail-oriented engineer seeking an entry-level SDE role to utilize my skills for company growth and mutual success.

EDUCATION
B.Tech in Information Technology | ABC Institute of Technology | 2020 - 2024

SKILLS
• Programming in C, C++, Core Java
• HTML, CSS, JavaScript, MySQL
• Strong communication and interpersonal skills

PROJECTS
College Management System
• Developed a college management website using HTML, CSS, PHP, and MySQL.
• Helped teachers manage student attendance and internal test marks.
• Worked in a team of 4 members to deliver the project on time.

Online Food Ordering System
• Designed frontend pages for restaurant listing and menu selection.
• Connected the application to MySQL database for storing customer orders.`,
};

const COMPANY_OPTIONS = [
  { value: "Amazon", label: "Amazon", sub: "SDE-1 / WOW / Intern" },
  { value: "TCS", label: "TCS", sub: "Digital & Prime Roles" },
  { value: "Infosys", label: "Infosys", sub: "Specialist Programmer (SP)" },
  { value: "Flipkart", label: "Flipkart", sub: "SDE-1 / GRiD Challenge" },
  { value: "Google", label: "Google", sub: "Software Engineer / L3" },
  { value: "Microsoft", label: "Microsoft", sub: "SDE-1 / IDC" },
  { value: "Swiggy", label: "Swiggy", sub: "Backend & Systems" },
  { value: "Razorpay", label: "Razorpay", sub: "Core FinTech & Payments" },
];

const ROLE_OPTIONS = [
  "SDE-1 / Fresher Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Cloud & DevOps Engineer",
];

export function ResumeRoasterView() {
  const [targetCompany, setTargetCompany] = useState("Amazon");
  const [targetRole, setTargetRole] = useState("SDE-1 / Fresher Software Engineer");
  const [resumeText, setResumeText] = useState(SAMPLE_RESUMES.fresher);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [activeTab, setActiveTab] = useState<"fixes" | "keywords" | "buzzwords" | "social">("fixes");

  const [roasting, setRoasting] = useState(false);
  const [roastResult, setRoastResult] = useState<ResumeRoasterResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedFixIndex, setCopiedFixIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload processing (PDF, DOCX, TXT)
  const processUploadedFile = async (file: File) => {
    setParsingFile(true);
    setErrorMessage(null);
    try {
      const result = await platformApi.parseResumeFile(file);
      setResumeText(result.text);
      setUploadedFileName(`${result.fileName} (${result.wordCount} words)`);
      setInputMode("paste"); // Switch to editor view so user can review extracted text
    } catch (err) {
      console.error("File extraction error:", err);
      setErrorMessage((err as Error).message || "Failed to extract text from document.");
    } finally {
      setParsingFile(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processUploadedFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processUploadedFile(file);
    }
  };

  const handleRoast = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 30) {
      setErrorMessage("Please upload a resume or paste at least 30 characters of resume content.");
      return;
    }

    setRoasting(true);
    setErrorMessage(null);
    setRoastResult(null);

    try {
      const response = await platformApi.roastResume({
        resumeText: resumeText.trim(),
        targetCompany,
        targetRole,
      });
      setRoastResult(response);
      setActiveTab("fixes");
    } catch (error) {
      console.error("Resume roasting failed:", error);
      const msg = (error as Error).message || "Resume roast failed.";
      if (msg.includes("429") || msg.includes("Rate limit")) {
        setErrorMessage("Free Roaster quota reached (2 roasts/day for guest users). Sign in or upgrade to Pro for unlimited roasts.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setRoasting(false);
    }
  };

  const handleCopyShare = () => {
    if (!roastResult) return;
    void navigator.clipboard.writeText(roastResult.socialShareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleCopyFix = (text: string, index: number) => {
    void navigator.clipboard.writeText(text);
    setCopiedFixIndex(index);
    setTimeout(() => setCopiedFixIndex(null), 2000);
  };

  const handleShareLinkedIn = () => {
    if (!roastResult) return;
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/resume-roaster` : "https://codeorbit.app/resume-roaster";
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareWhatsApp = () => {
    if (!roastResult) return;
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/resume-roaster` : "https://codeorbit.app/resume-roaster";
    const message = `${roastResult.socialShareText}\n\nRoast your resume free on CodeOrbit:\n${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return { text: "text-emerald-400", border: "border-emerald-500", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20" };
    if (score >= 70) return { text: "text-cyan-400", border: "border-cyan-500", bg: "bg-cyan-500/10", glow: "shadow-cyan-500/20" };
    if (score >= 50) return { text: "text-amber-400", border: "border-amber-500", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" };
    return { text: "text-rose-400", border: "border-rose-500", bg: "bg-rose-500/10", glow: "shadow-rose-500/20" };
  };

  return (
    <div className="app-shell pb-28 md:pb-16">
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8 space-y-6">
        
        {/* Hero Section */}
        <div className="surface-card p-6 sm:p-8 text-center relative overflow-hidden border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-slate-900/60 shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-300 uppercase tracking-wider mb-4">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <span>AI Resume Roaster & ATS Scorer</span>
            <span className="rounded bg-rose-400/20 px-1.5 py-0.2 text-[10px] text-rose-200">100% Free • No Signup</span>
          </div>

          <h1 className="text-3xl font-extrabold sm:text-5xl text-slate-100 tracking-tight">
            Will Your Resume Clear the <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">Campus ATS Filter?</span>
          </h1>

          <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            {HONEST_MARKETING_CLAIMS.resumeDiscardContext} Get an instant, actionable 0–100 ATS score tailored for Indian campus placements &amp; global tech drives.
          </p>

          {/* Quick Stats Badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1">
              ✓ {PLATFORM_METRICS.companyProfileCount} Localized Company Profiles (Amazon, TCS, Infosys, Flipkart, Google, Microsoft, Swiggy, Razorpay)
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1">
              ✓ PDF & Word Document Extraction
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1">
              ✓ Automated Bullet Point Re-Engineering
            </span>
          </div>
        </div>

        {/* Configuration Bar: Company & Role */}
        <div className="surface-card p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              1. Select Target Company
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMPANY_OPTIONS.map((comp) => (
                <button
                  key={comp.value}
                  type="button"
                  onClick={() => setTargetCompany(comp.value)}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    targetCompany === comp.value
                      ? "border-cyan-400 bg-cyan-950/50 text-cyan-200 font-bold shadow-md shadow-cyan-500/10"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="text-sm font-semibold">{comp.label}</div>
                  <div className="text-[11px] text-slate-500 font-normal truncate">{comp.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Target Role Track
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end gap-2">
              <span className="text-xs text-slate-400 mr-1 self-center">Or load sample:</span>
              <button
                type="button"
                onClick={() => {
                  setResumeText(SAMPLE_RESUMES.fresher);
                  setUploadedFileName(null);
                  setInputMode("paste");
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                NIT Fresher (Strong)
              </button>
              <button
                type="button"
                onClick={() => {
                  setResumeText(SAMPLE_RESUMES.fluffy);
                  setUploadedFileName(null);
                  setInputMode("paste");
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Fluffy Buzzwords (Weak)
              </button>
            </div>
          </div>
        </div>

        {/* Input Mode Selector & File Upload Dropzone */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  inputMode === "upload"
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📁 Upload PDF / DOCX
              </button>
              <button
                type="button"
                onClick={() => setInputMode("paste")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  inputMode === "paste"
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ✍️ Paste or Edit Text
              </button>
            </div>

            {uploadedFileName && (
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
                <span>📄 {uploadedFileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileName(null);
                    setResumeText("");
                  }}
                  className="text-slate-500 hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {inputMode === "upload" ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-cyan-400 bg-cyan-950/30 scale-[1.01]"
                  : "border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl text-rose-400">
                  {parsingFile ? "⏳" : "📄"}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-100">
                    {parsingFile ? "Extracting resume text..." : "Drag and drop your resume file here"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, DOCX (Word), or TXT documents up to 5MB.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={parsingFile}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Browse Files
                </button>
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your raw resume text, projects, and work experience here..."
                rows={12}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>{resumeText.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>Minimum 30 characters required for accurate evaluation</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-300">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => void handleRoast()}
              disabled={roasting || parsingFile}
              className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-lg shadow-rose-600/20"
            >
              {roasting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Roasting Against {targetCompany} ATS Standards...
                </span>
              ) : (
                `🔥 Roast My Resume for ${targetCompany} (Instant ATS Score)`
              )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {roastResult && (
          <div className="surface-card p-6 sm:p-8 space-y-6 border-2 border-slate-700 bg-slate-900/90 shadow-2xl animate-fade-in">
            {/* Header: Score Meter & Tier Fit */}
            {(() => {
              const colors = getScoreColor(roastResult.overallAtsScore);
              return (
                <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl ${colors.glow}`}>
                  <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    {/* Circular Score Gauge */}
                    <div className="relative h-28 w-28 shrink-0 flex items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950/80 shadow-inner">
                      <div className="text-center">
                        <div className={`text-4xl font-black ${colors.text} leading-none tracking-tight`}>
                          {roastResult.overallAtsScore}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">/ 100 ATS</div>
                      </div>
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-bold text-slate-300 mb-2">
                        <span>Target: {roastResult.targetCompany} • {roastResult.targetRole}</span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-100">{roastResult.companyTierFit}</h2>
                      <p className="text-xs text-slate-300 mt-1 max-w-md">
                        {roastResult.overallAtsScore >= 80
                          ? "High candidate readiness with quantifiable business impact and clean technical depth."
                          : roastResult.overallAtsScore >= 60
                          ? "Moderate readiness. Resume has technical foundation but lacks metrics and specific keywords."
                          : "High rejection risk. Resume relies on generic buzzwords without verifiable project scope."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Fluffy Bullets</span>
                    <span className="text-2xl font-black text-rose-400">
                      {roastResult.metricRoast.fluffyBulletsCount}
                    </span>
                    <span className="text-[10px] text-slate-500">non-quantified lines</span>
                  </div>
                </div>
              );
            })()}

            {/* Brutal AI Roast Highlights */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <span>🔥 Unfiltered Recruiter Critique ({roastResult.targetCompany} Bar)</span>
              </h3>
              <div className="grid gap-2">
                {roastResult.roastPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed font-sans">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Tabs for Deep Breakdown */}
            <div className="border-b border-slate-800 flex items-center gap-2 pt-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("fixes")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "fixes"
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Actionable Bullet Fixes ({roastResult.threeCriticalFixes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("keywords")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "keywords"
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                ATS Keywords ({roastResult.companySpecificAlignment.foundKeywords.length} Matched / {roastResult.companySpecificAlignment.missingCrucialKeywords.length} Missing)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("buzzwords")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "buzzwords"
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Metric Health ({roastResult.metricRoast.quantifiedBulletsCount} Quantified)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("social")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "social"
                    ? "border-indigo-400 text-indigo-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Share Scorecard (#CodeOrbitReady)
              </button>
            </div>

            {/* Tab 1: Actionable Bullet Fixes */}
            {activeTab === "fixes" && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400">
                  Replace weak descriptive lines with high-impact, quantitative metrics that pass senior recruiter screens:
                </p>
                <div className="space-y-3">
                  {roastResult.threeCriticalFixes.map((fix, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 group hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          Rewrite Recommendation #{i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyFix(fix, i)}
                          className="text-[11px] font-semibold text-cyan-400 hover:underline"
                        >
                          {copiedFixIndex === i ? "✓ Copied!" : "Copy Bullet"}
                        </button>
                      </div>
                      <p className="text-xs font-mono text-emerald-300 leading-relaxed bg-black/40 p-2.5 rounded border border-emerald-900/30">
                        {fix}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Keywords */}
            {activeTab === "keywords" && (
              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                    Critical Missing Keywords for {roastResult.targetCompany}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roastResult.companySpecificAlignment.missingCrucialKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1 text-xs font-medium text-rose-300"
                      >
                        + Add &quot;{kw}&quot;
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    Matched Keywords Detected
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roastResult.companySpecificAlignment.foundKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-300"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Metric Health */}
            {activeTab === "buzzwords" && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400">
                  Metric evaluation &amp; impact verdict:
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {roastResult.metricRoast.verdict}
                  </p>
                  <p className="text-xs text-amber-300 pt-2 border-t border-slate-800">
                    💡 Culture alignment note: {roastResult.companySpecificAlignment.cultureAlignmentFeedback}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Social Share Card */}
            {activeTab === "social" && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                      <span>Share Verified ATS Scorecard</span>
                      <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 font-mono">#CodeOrbitReady</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Share your verified score on LinkedIn or WhatsApp to showcase placement readiness to campus recruiters.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleShareLinkedIn}
                      className="rounded-lg bg-[#0A66C2] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#004182] transition-colors"
                    >
                      LinkedIn
                    </button>
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="rounded-lg bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1DA851] transition-colors"
                    >
                      WhatsApp
                    </button>
                    <Button
                      variant="secondary"
                      className="text-xs font-semibold"
                      onClick={handleCopyShare}
                    >
                      {copiedShare ? "✓ Copied!" : "Copy Post"}
                    </Button>
                  </div>
                </div>

                {/* Live OpenGraph Preview Card */}
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/og/roaster?score=${roastResult.overallAtsScore}&company=${encodeURIComponent(roastResult.targetCompany)}&role=${encodeURIComponent(roastResult.targetRole)}&tier=${encodeURIComponent(roastResult.companyTierFit)}`}
                    alt={`CodeOrbit ATS Score Card - ${roastResult.overallAtsScore}/100`}
                    className="w-full h-auto aspect-[1200/630] object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Pro Upgrade Callout Banner */}
            <div className="surface-soft mt-8 p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/50 to-blue-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  ⚡ CodeOrbit Pro ATS Solution
                </span>
                <h4 className="text-base font-bold text-[color:var(--text-main)] mt-1">
                  Fix All ATS Flaws in 1-Click with AI Resume Builder Pro
                </h4>
                <p className="text-xs text-soft mt-0.5">
                  Export verified Harvard/Stanford single-column LaTeX & PDF formats tailored to {roastResult.targetCompany}&apos;s ATS filters.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/pricing"
                  className="btn-primary text-xs font-semibold px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 whitespace-nowrap shadow-md shadow-cyan-500/20"
                >
                  ⚡ Get Pro Pass (₹499) →
                </Link>
                <Link href="/resume-builder" className="btn-secondary text-xs px-3.5 py-2">
                  Open Free Builder
                </Link>
              </div>
            </div>

            {/* Bottom Next-Step Action Bar */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Ready to re-engineer your resume into clean, recruiter-approved single-page LaTeX & PDF?
              </span>
              <div className="flex items-center gap-3">
                <Link href="/resume-builder" className="btn-primary text-xs font-bold py-2 px-4">
                  Open AI Resume Builder →
                </Link>
                <Link href="/problems" className="btn-secondary text-xs font-semibold py-2 px-4">
                  Practice {roastResult.targetCompany} DSA →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
