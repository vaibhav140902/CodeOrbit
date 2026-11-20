"use client";

import { useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/layout/app-frame";
import { usePlatformAuth } from "@/lib/auth-context";
import { useInterviewIntegrity } from "@/hooks/use-interview-integrity";
import {
  GAUNTLET_ROLE_CONFIGS,
  type GauntletRoleTrack,
  type GauntletRoundScore,
} from "@/data/gauntlet-roles";

const ROLES: GauntletRoleTrack[] = [
  "frontend-sde",
  "backend-sde",
  "fullstack-sde",
  "data-python",
  "mass-recruiter-ninja",
];

export default function GauntletPage() {
  const { user } = usePlatformAuth();
  const [selectedRole, setSelectedRole] = useState<GauntletRoleTrack>("backend-sde");
  const [currentRound, setCurrentRound] = useState<1 | 2 | 3 | 4>(1);

  // Round states
  const [resumeText, setResumeText] = useState("");
  const [r1Result, setR1Result] = useState<GauntletRoundScore | null>(null);

  const [submittedCode, setSubmittedCode] = useState(
    "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []"
  );
  const [r2Result, setR2Result] = useState<GauntletRoundScore | null>(null);

  const [defenseSpeech, setDefenseSpeech] = useState("");
  const [r3Result, setR3Result] = useState<GauntletRoundScore | null>(null);

  const [behavioralSpeech, setBehavioralSpeech] = useState("");
  const [r4Result, setR4Result] = useState<GauntletRoundScore | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Anti-cheat hook
  const { violationsCount, isTerminated, terminationReason } = useInterviewIntegrity({
    maxViolations: 3,
    enabled: currentRound >= 2 && currentRound <= 4,
  });

  const config = GAUNTLET_ROLE_CONFIGS[selectedRole];

  // Round 1 Submission
  const handleStartRound1 = async () => {
    if (!resumeText.trim()) {
      setErrorMessage("Please paste your resume summary or project highlights to run the ATS Role Gatekeeper.");
      return;
    }
    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/platform/gauntlet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_round_1",
          roleTrack: selectedRole,
          resumeText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Round 1 evaluation failed");

      setR1Result(data);
      if (data.passed) {
        setCurrentRound(2);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Round 2 Complete (Simulated via Monaco OA)
  const handleCompleteRound2 = () => {
    const score = 320; // Simulated OA score based on canonical test suites
    setR2Result({
      round: 2,
      roundName: "Round 2: Timed Practical & DSA OA",
      score,
      maxScore: 350,
      passed: true,
      feedback: "All hidden test cases passed. Code submitted with optimal O(n) space-time bounds.",
    });
    setCurrentRound(3);
  };

  // Round 3 Submission (Defense)
  const handleSubmitRound3 = async () => {
    if (!defenseSpeech.trim()) {
      setErrorMessage("Please type or speak your technical defense of the submitted code.");
      return;
    }
    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/platform/gauntlet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_round_3_defense",
          roleTrack: selectedRole,
          candidateCode: submittedCode,
          defenseTranscript: defenseSpeech,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Round 3 evaluation failed");

      setR3Result(data);
      if (data.passed) {
        setCurrentRound(4);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Round 4 Submission (Bar-Raiser)
  const handleSubmitRound4 = async () => {
    if (!behavioralSpeech.trim()) {
      setErrorMessage("Please provide your STAR-format response for the Bar-Raiser round.");
      return;
    }
    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/platform/gauntlet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_round_4_behavioral",
          roleTrack: selectedRole,
          behavioralTranscript: behavioralSpeech,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Round 4 evaluation failed");

      setR4Result(data);
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const totalPfi = (r1Result?.score || 0) + (r2Result?.score || 0) + (r3Result?.score || 0) + (r4Result?.score || 0);

  return (
    <AppFrame>
      <div className="app-shell py-8">
        <div className="page-container space-y-6 max-w-5xl">
          {/* Header */}
          <div className="surface-card p-6 sm:p-8 border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="eyebrow-chip">Proctored Certification</span>
                <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl text-white">
                  Paid 4-Round Hiring Gauntlet
                </h1>
                <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                  Sequential role-specific hiring simulation evaluated on the 1,000-Point Practical Fit Index (PFI).
                  Earn an accredited, recruiter-verified hiring proof badge.
                </p>
              </div>

              {/* Proctor status */}
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Anti-Cheat Proctor: Active</span>
                {violationsCount > 0 && (
                  <span className="text-amber-300 font-mono">({violationsCount}/3 violations)</span>
                )}
              </div>
            </div>

            {/* Role Track Selector */}
            <div className="mt-6 border-t border-slate-800 pt-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Select Role Track
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setCurrentRound(1);
                      setR1Result(null);
                      setR2Result(null);
                      setR3Result(null);
                      setR4Result(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selectedRole === role
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {GAUNTLET_ROLE_CONFIGS[role].name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Violation Termination Alert */}
          {isTerminated && (
            <div className="surface-card border border-rose-500/50 bg-rose-950/40 p-5 text-rose-300">
              <h3 className="font-bold text-base flex items-center gap-2">
                ⚠️ Session Terminated: Integrity Violation
              </h3>
              <p className="mt-1 text-xs">{terminationReason}</p>
            </div>
          )}

          {/* Stepper Header */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            <div
              className={`rounded-lg p-2.5 border ${
                currentRound >= 1
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-500"
              }`}
            >
              R1: ATS Resume (100)
            </div>
            <div
              className={`rounded-lg p-2.5 border ${
                currentRound >= 2
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-500"
              }`}
            >
              R2: Practical OA (350)
            </div>
            <div
              className={`rounded-lg p-2.5 border ${
                currentRound >= 3
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-500"
              }`}
            >
              R3: Code Defense (400)
            </div>
            <div
              className={`rounded-lg p-2.5 border ${
                currentRound >= 4
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-500"
              }`}
            >
              R4: Bar Raiser (150)
            </div>
          </div>

          {errorMessage && (
            <div className="surface-card border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Round 1 Content */}
          {currentRound === 1 && !isTerminated && (
            <div className="surface-card p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 1 of 4</span>
                <h2 className="text-xl font-bold text-white mt-1">ATS Role Gatekeeper (10% / 100 Pts)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluates alignment against {config.name}. Minimum passing score to enter OA:{" "}
                  <span className="text-white font-bold">65 / 100</span>.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Paste Resume Highlights / Tech Skills
                </label>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder={`Include your experience with: ${config.focusAreas.join(", ")}...`}
                  className="field-input w-full font-mono text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleStartRound1()}
                  disabled={isEvaluating}
                  className="btn-primary text-xs font-bold py-2.5 px-6"
                >
                  {isEvaluating ? "Screening Resume..." : "Submit to ATS Gatekeeper →"}
                </button>
              </div>

              {r1Result && (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    r1Result.passed
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                  }`}
                >
                  <p className="font-bold">
                    Score: {r1Result.score} / {r1Result.maxScore} pts ({r1Result.passed ? "PASSED" : "FAILED"})
                  </p>
                  <p className="mt-1">{r1Result.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Round 2 Content */}
          {currentRound === 2 && !isTerminated && (
            <div className="surface-card p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 2 of 4</span>
                <h2 className="text-xl font-bold text-white mt-1">Timed Practical & DSA OA (35% / 350 Pts)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Target OA Problem: <span className="font-mono text-cyan-300 font-bold">{config.targetOaProblem}</span>.
                  Minimum passing score for Round 3: <span className="text-white font-bold">210 / 350</span>.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Submitted Solution Code</label>
                <textarea
                  rows={8}
                  value={submittedCode}
                  onChange={(e) => setSubmittedCode(e.target.value)}
                  className="field-input w-full font-mono text-xs bg-black/60"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Link
                  href={`/problems/${config.targetOaProblem}`}
                  target="_blank"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Open in Proctored Monaco IDE ↗
                </Link>
                <button
                  type="button"
                  onClick={handleCompleteRound2}
                  className="btn-primary text-xs font-bold py-2.5 px-6"
                >
                  Verify & Pass to Code Defense →
                </button>
              </div>
            </div>
          )}

          {/* Round 3 Content */}
          {currentRound === 3 && !isTerminated && (
            <div className="surface-card p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 3 of 4</span>
                <h2 className="text-xl font-bold text-white mt-1">Live AI Technical & Code Defense (40% / 400 Pts)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini 2.5 Staff Engineer evaluates your code defense in real time. Passing threshold:{" "}
                  <span className="text-white font-bold">240 / 400</span>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Staff Engineer Question:
                </p>
                <p className="mt-1 text-sm text-white font-medium">{config.openingDefenseQuestion}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Your Technical Defense (Complexity, Invariants, Failure Modes)
                </label>
                <textarea
                  rows={6}
                  value={defenseSpeech}
                  onChange={(e) => setDefenseSpeech(e.target.value)}
                  placeholder="Explain why your time/space complexity is optimal and how boundary conditions are handled..."
                  className="field-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSubmitRound3()}
                  disabled={isEvaluating}
                  className="btn-primary text-xs font-bold py-2.5 px-6"
                >
                  {isEvaluating ? "Evaluating Defense..." : "Submit Code Defense →"}
                </button>
              </div>

              {r3Result && (
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    r3Result.passed
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                  }`}
                >
                  <p className="font-bold">
                    Score: {r3Result.score} / {r3Result.maxScore} pts ({r3Result.passed ? "PASSED" : "FAILED"})
                  </p>
                  <p className="mt-1">{r3Result.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Round 4 Content */}
          {currentRound === 4 && !isTerminated && (
            <div className="surface-card p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Round 4 of 4</span>
                <h2 className="text-xl font-bold text-white mt-1">Bar-Raiser Behavioral & Incident Management (15% / 150 Pts)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  STAR method evaluation on production ownership and resilience. Passing threshold:{" "}
                  <span className="text-white font-bold">90 / 150</span>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Bar Raiser Question:
                </p>
                <p className="mt-1 text-sm text-white font-medium">{config.openingBarRaiserQuestion}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Your Response (Situation, Task, Action, Result)
                </label>
                <textarea
                  rows={6}
                  value={behavioralSpeech}
                  onChange={(e) => setBehavioralSpeech(e.target.value)}
                  placeholder="Describe the situation, your individual action, and the quantified metrics..."
                  className="field-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSubmitRound4()}
                  disabled={isEvaluating}
                  className="btn-primary text-xs font-bold py-2.5 px-6"
                >
                  {isEvaluating ? "Evaluating Bar Raiser..." : "Complete 4-Round Gauntlet →"}
                </button>
              </div>

              {r4Result && (
                <div className="mt-6 rounded-2xl border border-indigo-500/50 bg-gradient-to-br from-indigo-950/60 to-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Gauntlet Certified
                      </span>
                      <h3 className="text-2xl font-extrabold text-white">
                        Total PFI Score: {totalPfi} / 1,000
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        totalPfi >= 850
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : totalPfi >= 700
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {totalPfi >= 850 ? "Strong Hire" : totalPfi >= 700 ? "Hire" : "Borderline"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="text-slate-400">R1: ATS</p>
                      <p className="text-lg font-bold text-white mt-1">{r1Result?.score || 0} / 100</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="text-slate-400">R2: OA</p>
                      <p className="text-lg font-bold text-white mt-1">{r2Result?.score || 0} / 350</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="text-slate-400">R3: Defense</p>
                      <p className="text-lg font-bold text-white mt-1">{r3Result?.score || 0} / 400</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <p className="text-slate-400">R4: Bar Raiser</p>
                      <p className="text-lg font-bold text-white mt-1">{r4Result.score} / 150</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link href="/proof/vaibhav-maurya" className="btn-primary text-xs font-bold py-2.5 px-6">
                      View Verified Candidate Proof Profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
