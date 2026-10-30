"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@codeorbit/ui";
import type { ResumeRoasterResponse } from "@codeorbit/schema";
import { platformApi } from "@/lib/platform-api";

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
  { value: "Amazon", label: "Amazon (SDE-1 / WOW / Intern)" },
  { value: "Infosys", label: "Infosys (Specialist Programmer / SP)" },
  { value: "TCS", label: "TCS (TCS Digital / Ninja)" },
  { value: "Flipkart", label: "Flipkart (SDE-1 / GRiD)" },
  { value: "Google", label: "Google (Software Engineer / L3)" },
  { value: "Microsoft", label: "Microsoft (SDE-1 / IDC)" },
  { value: "Swiggy", label: "Swiggy (Software Engineer - Backend)" },
  { value: "Razorpay", label: "Razorpay (Software Development Engineer)" },
  { value: "Zoho", label: "Zoho (Software Developer)" },
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
  const [roasting, setRoasting] = useState(false);
  const [roastResult, setRoastResult] = useState<ResumeRoasterResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleRoast = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 30) {
      setErrorMessage("Please enter or paste at least 30 characters of resume content.");
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
    if (score >= 85) return "text-emerald-400 border-emerald-400/40 bg-emerald-500/10";
    if (score >= 70) return "text-cyan-400 border-cyan-400/40 bg-cyan-500/10";
    if (score >= 50) return "text-amber-400 border-amber-400/40 bg-amber-500/10";
    return "text-rose-400 border-rose-400/40 bg-rose-500/10";
  };

  return (
    <div className="app-shell pb-28 md:pb-12">
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8">
        {/* Hero Section */}
        <div className="surface-card p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 uppercase tracking-wider mb-4">
            🔥 Free ATS Resume Roaster • No Signup Required
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl md:text-5xl text-slate-100 tracking-tight">
            Will Your Resume Crack the Screening Filter or Get Shredded in 6 Seconds?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Recruiters spend 6 seconds reviewing your resume. Test your ATS match score against real Indian tech placement benchmarks (Amazon SDE-1, Infosys SP, TCS Digital, Flipkart GRiD) before applying.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Test with Samples:</span>
            <button
              type="button"
              onClick={() => {
                setResumeText(SAMPLE_RESUMES.fresher);
                setTargetCompany("Amazon");
              }}
              className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
            >
              Fresher NIT SDE (Amazon)
            </button>
            <button
              type="button"
              onClick={() => {
                setResumeText(SAMPLE_RESUMES.fluffy);
                setTargetCompany("TCS");
              }}
              className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
            >
              Buzzword Heavy Resume (TCS)
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="surface-card mt-6 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Company
              </label>
              <select
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="field-select w-full text-sm"
              >
                {COMPANY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="field-select w-full text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Paste Your Resume Text
              </label>
              <span className="text-xs text-slate-400 font-mono">{resumeText.length} characters</span>
            </div>
            <textarea
              rows={9}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume markdown, plain text, or section drafts here..."
              className="field-textarea font-mono text-xs w-full bg-slate-950/80 border-slate-700 text-slate-200"
            />
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              ⚡ Analyzed by CodeOrbit Socratic ATS Engine against 100+ hiring criteria.
            </span>
            <Button
              variant="primary"
              className="text-sm font-bold px-6 py-2.5"
              onClick={() => void handleRoast()}
              disabled={roasting}
            >
              {roasting ? "Roasting Your Resume..." : "Roast My Resume Now"}
            </Button>
          </div>
        </div>

        {/* Results Card */}
        {roastResult && (
          <div className="surface-card mt-8 p-6 sm:p-8 border border-cyan-500/30">
            {/* Score & Verdict Banner */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-700/60">
              <div
                className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4 font-mono ${getScoreColor(
                  roastResult.overallAtsScore
                )}`}
              >
                <span className="text-3xl font-black">{roastResult.overallAtsScore}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">/ 100 ATS</span>
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="inline-block rounded-full border border-slate-700 bg-slate-800/80 px-3 py-0.5 text-xs font-bold text-cyan-300 mb-2">
                  {roastResult.companyTierFit} • {roastResult.targetCompany}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">{roastResult.roastHeadline}</h2>
              </div>
            </div>

            {/* Roast Points */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 mb-3">
                🔥 The Brutal Truth (Recruiter Perspective)
              </h3>
              <div className="space-y-2.5">
                {roastResult.roastPoints.map((point, i) => (
                  <div
                    key={`roast-${i}`}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs leading-5 text-slate-300"
                  >
                    <span className="font-bold text-rose-300 mr-2">#{i + 1}</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>

            {/* Company Specific Keywords Alignment */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  ✓ Matched {roastResult.targetCompany} Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {roastResult.companySpecificAlignment.foundKeywords.length > 0 ? (
                    roastResult.companySpecificAlignment.foundKeywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                      >
                        {k}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None detected.</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                  ✗ Missing High-Priority Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {roastResult.companySpecificAlignment.missingCrucialKeywords.length > 0 ? (
                    roastResult.companySpecificAlignment.missingCrucialKeywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-300"
                      >
                        {k}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">All target keywords present!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics & Culture Notes */}
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-xs leading-5 text-slate-300">
              <p className="font-bold text-slate-200">
                Company Culture & Filtering Criterion:
              </p>
              <p className="text-slate-400 mt-1">
                {roastResult.companySpecificAlignment.cultureAlignmentFeedback}
              </p>
            </div>

            {/* 3 Critical Fixes */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-3">
                ⚡ 3 Critical Fixes to Crack the Screen
              </h3>
              <div className="space-y-2">
                {roastResult.threeCriticalFixes.map((fix, i) => (
                  <div
                    key={`fix-${i}`}
                    className="flex items-start gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs leading-5 text-slate-200"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span>{fix}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Sharing Card & CTAs */}
            <div className="mt-8 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                    <span>Share Your Readiness Scorecard</span>
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 font-mono">#CodeOrbitReady</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Share your verified ATS evaluation on LinkedIn or WhatsApp to showcase your candidate readiness.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleShareLinkedIn}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004182] transition-colors"
                  >
                    <span>Share on LinkedIn</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1DA851] transition-colors"
                  >
                    <span>WhatsApp</span>
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

              {/* Dynamic OpenGraph Social Card Preview */}
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 shadow-lg">
                <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Dynamic Verified Card Preview</span>
                  <a
                    href={`/api/og/roaster?score=${roastResult.atsScore}&company=${encodeURIComponent(roastResult.targetCompany)}&role=${encodeURIComponent(roastResult.targetRole)}&tier=${encodeURIComponent(roastResult.companyTierFit)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    Open Card Image ↗
                  </a>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/og/roaster?score=${roastResult.atsScore}&company=${encodeURIComponent(roastResult.targetCompany)}&role=${encodeURIComponent(roastResult.targetRole)}&tier=${encodeURIComponent(roastResult.companyTierFit)}`}
                  alt={`CodeOrbit ATS Score Card - ${roastResult.atsScore}/100`}
                  className="w-full h-auto aspect-[1200/630] object-cover"
                  loading="lazy"
                />
              </div>

              <div className="mt-3 rounded bg-black/50 p-2.5 font-mono text-xs text-indigo-200 border border-slate-800">
                {roastResult.socialShareText}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-700/60">
              <span className="text-xs text-slate-400">
                Want to automatically re-engineer these bullets into clean LaTeX & PDF?
              </span>
              <div className="flex items-center gap-3">
                <Link href="/resume-builder" className="btn-primary text-xs font-semibold py-2">
                  Open in AI Resume Builder →
                </Link>
                <Link href="/problems" className="btn-secondary text-xs font-semibold py-2">
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
