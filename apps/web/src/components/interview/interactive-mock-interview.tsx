"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MockInterviewLiveResponse,
  MockInterviewResponse,
  MockInterviewRoundType,
  MockInterviewTurnMessage,
} from "@codeorbit/schema";
import { Button } from "@codeorbit/ui";
import { platformApi } from "@/lib/platform-api";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultItem>>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

const TARGET_COMPANIES = [
  { id: "amazon", name: "Amazon", label: "Amazon SDE-1 / Intern", badge: "Bar Raiser + LP" },
  { id: "google", name: "Google", label: "Google SDE-1", badge: "Algorithms & Invariants" },
  { id: "flipkart", name: "Flipkart", label: "Flipkart SDE-1", badge: "High Scale Flash Sale" },
  { id: "tcs", name: "TCS", label: "TCS Digital / Ninja", badge: "CS Fundamentals & DSA" },
  { id: "infosys", name: "Infosys", label: "Infosys SP (Specialist)", badge: "Graphs & DP" },
  { id: "microsoft", name: "Microsoft", label: "Microsoft SDE", badge: "System Decomp" },
  { id: "swiggy", name: "Swiggy", label: "Swiggy SDE-1", badge: "Real-time Dispatch" },
  { id: "razorpay", name: "Razorpay", label: "Razorpay SDE", badge: "Idempotent Payments" },
  { id: "zoho", name: "Zoho", label: "Zoho Product Engineer", badge: "Pure Problem Solving" },
];

const TARGET_ROLES = [
  "SDE-1 (Software Development Engineer)",
  "SDE Intern (Campus Placements)",
  "Backend Systems Engineer",
  "Full Stack Developer",
  "Frontend Web Engineer",
];

const ROUND_TYPES: MockInterviewRoundType[] = [
  "Technical DSA",
  "System Design",
  "CS Fundamentals",
  "Behavioral & Leadership",
];

const INITIAL_LIVE_COACH: MockInterviewLiveResponse = {
  headline: "Live Socratic Coach",
  bullets: [
    "State your understanding of the problem and clarify constraints before jumping to code.",
    "Mention auxiliary space and worst-case time complexity explicitly.",
    "Structure behavioral examples using STAR (Situation, Task, Action, Result).",
  ],
  provider: "codeorbit-socratic",
};

export function InteractiveMockInterview() {
  const [company, setCompany] = useState(TARGET_COMPANIES[0].name);
  const [role, setRole] = useState(TARGET_ROLES[0]);
  const [roundType, setRoundType] = useState<MockInterviewRoundType>("Technical DSA");

  const [sessionActive, setSessionActive] = useState(false);
  const [history, setHistory] = useState<MockInterviewTurnMessage[]>([]);
  const [candidateDraft, setCandidateDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const [turnLoading, setTurnLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<string | null>(null);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [liveCoach, setLiveCoach] = useState<MockInterviewLiveResponse>(INITIAL_LIVE_COACH);
  const [scorecard, setScorecard] = useState<MockInterviewResponse | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, turnLoading]);

  // Text to speech for interviewer responses
  const speakText = (text: string) => {
    if (!voiceSpeechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis unavailable:", err);
    }
  };

  // Toggle voice recognition
  const toggleSpeechRecognition = () => {
    const RecognitionCtor = (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setErrorMessage("Voice speech-to-text is not supported in this browser. Please type your responses.");
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event) => {
        const text = Array.from(event.results)
          .map((r) => r[0]?.transcript ?? "")
          .join(" ")
          .trim();
        setCandidateDraft(text);
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setErrorMessage(null);
    } catch (err) {
      console.error("Microphone error:", err);
      setErrorMessage("Microphone permission was denied. You can continue by typing your answers.");
    }
  };

  // Start new interview session
  const handleStartInterview = async () => {
    setSessionActive(true);
    setHistory([]);
    setScorecard(null);
    setErrorMessage(null);
    setTurnLoading(true);

    try {
      const opening = await platformApi.sendMockInterviewTurn({
        company,
        role,
        roundType,
        history: [],
        candidateMessage: "Hello, I am ready for the interview.",
      });

      const initialHistory: MockInterviewTurnMessage[] = [
        {
          role: "interviewer",
          content: opening.interviewerReply,
          timestamp: new Date().toISOString(),
        },
      ];

      setHistory(initialHistory);
      setCurrentFeedback(opening.quickFeedback);
      setSuggestedFollowUps(opening.suggestedFollowUps);
      speakText(opening.interviewerReply);
    } catch (err) {
      console.error("Failed to start mock session:", err);
      setErrorMessage("Could not initialize interview turn. Please retry.");
    } finally {
      setTurnLoading(false);
    }
  };

  // Send candidate turn
  const handleSendTurn = async (overrideMessage?: string, requestHint = false) => {
    const msg = (overrideMessage ?? candidateDraft).trim();
    if (!msg && !requestHint) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }

    const candidateTurn: MockInterviewTurnMessage = {
      role: "candidate",
      content: requestHint ? "Could you please give me a Socratic hint on the optimal approach?" : msg,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...history, candidateTurn];
    setHistory(nextHistory);
    setCandidateDraft("");
    setTurnLoading(true);
    setErrorMessage(null);

    try {
      const response = await platformApi.sendMockInterviewTurn({
        company,
        role,
        roundType,
        history: nextHistory,
        candidateMessage: candidateTurn.content,
        requestHint,
      });

      const interviewerTurn: MockInterviewTurnMessage = {
        role: "interviewer",
        content: response.interviewerReply,
        timestamp: new Date().toISOString(),
      };

      setHistory([...nextHistory, interviewerTurn]);
      setCurrentFeedback(response.quickFeedback);
      setSuggestedFollowUps(response.suggestedFollowUps);
      speakText(response.interviewerReply);

      // Trigger live coaching cues in the background
      const fullTranscript = [...nextHistory, interviewerTurn]
        .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
        .join("\n");

      void platformApi
        .generateLiveMockInterviewFeedback({
          company,
          role,
          transcript: fullTranscript,
        })
        .then(setLiveCoach)
        .catch(() => {});
    } catch (err) {
      console.error("Failed to process interview turn:", err);
      setErrorMessage("Failed to send message. Please retry.");
    } finally {
      setTurnLoading(false);
    }
  };

  // Conclude interview and generate placement scorecard
  const handleFinishAndEvaluate = async () => {
    if (history.length < 2) {
      setErrorMessage("Please complete at least one technical turn before generating your placement scorecard.");
      return;
    }

    setEvaluating(true);
    setErrorMessage(null);

    const fullTranscript = history
      .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
      .join("\n\n");

    try {
      const result = await platformApi.generateMockInterviewFeedback({
        company,
        role,
        transcript: fullTranscript,
        notes: `Round: ${roundType}. Total turns: ${history.length}`,
      });

      setScorecard(result);
    } catch (err) {
      console.error("Evaluation generation failed:", err);
      setErrorMessage("Evaluation failed. Please try again or check your network connection.");
    } finally {
      setEvaluating(false);
    }
  };

  const tierBadgeColor = (tier?: string) => {
    switch (tier) {
      case "Day-1 Recruiter Call":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Strong Campus Shortlist":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "Borderline OA Screen":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
  };

  const handleCopyShare = () => {
    if (!scorecard) return;
    const shareText = `🎯 Just completed an AI Mock Interview for ${company} (${role}) on CodeOrbit!\n\nScore: ${scorecard.overallScore}/100 [${scorecard.companyTierFit || "Evaluated"}]\nDSA & Problem Solving: ${scorecard.dimensions?.problemSolvingDsa || scorecard.problemSolvingScore}/100\nSystem Design: ${scorecard.dimensions?.systemDesignArchitecture || 70}/100\nCommunication: ${scorecard.communicationScore}/100\n\nPracticing with zero liquid capital on India's #1 Career Readiness platform: https://codeorbit.app/mock-interview\n#CodeOrbitReady #Placements2026 #DSA`;
    navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Setup Mode */}
      {!sessionActive && (
        <div className="surface-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="eyebrow-chip">AI Conversational Coach</span>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Real-Time Voice & Chat Mock Interviewer
              </h1>
              <p className="mt-2 text-sm text-soft max-w-2xl">
                Practice multi-turn technical interviews aligned with specific hiring bars (Amazon Bar Raiser, Google Invariants, Flipkart Flash-Sale Scale, TCS Digital). Get real-time Socratic coaching and an accredited 5-dimension placement scorecard.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                ₹0 / $0 Free Practice Quota
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 border-t border-[color:var(--border)] pt-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                1. Target Tech Company
              </label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-2.5 text-sm font-medium focus:border-cyan-500 focus:outline-none"
              >
                {TARGET_COMPANIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.label} ({c.badge})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                2. Target Placement Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-2.5 text-sm font-medium focus:border-cyan-500 focus:outline-none"
              >
                {TARGET_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                3. Interview Round Focus
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value as MockInterviewRoundType)}
                className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-2.5 text-sm font-medium focus:border-cyan-500 focus:outline-none"
              >
                {ROUND_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--border)] pt-6">
            <div className="flex items-center gap-4 text-xs text-soft">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceSpeechEnabled}
                  onChange={(e) => setVoiceSpeechEnabled(e.target.checked)}
                  className="rounded border-[color:var(--border)]"
                />
                <span>Enable AI Voice Speech Synthesis</span>
              </label>
            </div>

            <Button
              onClick={handleStartInterview}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-2.5 rounded-lg transition-all"
            >
              Start {company} {roundType} Round →
            </Button>
          </div>
        </div>
      )}

      {/* Active Interview Workspace */}
      {sessionActive && !scorecard && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main Conversational Feed */}
          <div className="surface-card flex flex-col h-[700px]">
            {/* Header */}
            <div className="border-b border-[color:var(--border)] p-4 flex items-center justify-between bg-[color:var(--surface-soft)]/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  {company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{company} Lead Interviewer</h2>
                  <p className="text-xs text-soft">
                    {role} • {roundType} Round
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                    voiceSpeechEnabled
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                      : "border-[color:var(--border)] text-muted"
                  }`}
                  title="Toggle Interviewer Voice Audio"
                >
                  {voiceSpeechEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
                </button>
                <button
                  type="button"
                  onClick={handleFinishAndEvaluate}
                  disabled={evaluating || history.length < 2}
                  className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {evaluating ? "Evaluating..." : "Finish & Score"}
                </button>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.map((turn, index) => {
                const isInterviewer = turn.role === "interviewer";
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isInterviewer ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-muted font-medium">
                        {isInterviewer ? `${company} Interviewer` : "You (Candidate)"}
                      </span>
                      {isInterviewer && (
                        <button
                          type="button"
                          onClick={() => speakText(turn.content)}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          Replay 🔊
                        </button>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isInterviewer
                          ? "bg-[color:var(--surface-soft)] text-[color:var(--foreground)] border border-[color:var(--border)] rounded-tl-sm"
                          : "bg-cyan-600 text-white rounded-tr-sm"
                      }`}
                    >
                      {turn.content}
                    </div>
                  </div>
                );
              })}

              {turnLoading && (
                <div className="flex items-center gap-2 text-xs text-soft italic py-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  {company} Interviewer is evaluating and formulating question...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Socratic Coach Quick Feedback Banner */}
            {currentFeedback && (
              <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                <span>💡 Tip: {currentFeedback}</span>
                <button
                  type="button"
                  onClick={() => handleSendTurn("", true)}
                  disabled={turnLoading}
                  className="font-semibold underline ml-2 hover:text-amber-200"
                >
                  Request Socratic Hint
                </button>
              </div>
            )}

            {/* Suggested Follow-Ups */}
            {suggestedFollowUps.length > 0 && !turnLoading && (
              <div className="px-4 py-2 border-t border-[color:var(--border)] bg-[color:var(--surface-soft)]/30 flex flex-wrap gap-2">
                <span className="text-[11px] text-muted self-center">Quick options:</span>
                {suggestedFollowUps.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendTurn(prompt)}
                    className="text-xs bg-[color:var(--surface-soft)] hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-[color:var(--border)] px-2.5 py-1 rounded-full text-soft transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="border-t border-[color:var(--border)] p-3 flex items-center gap-2 bg-[color:var(--surface-soft)]/20">
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-lg border transition-all ${
                  listening
                    ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                    : "bg-[color:var(--surface-soft)] border-[color:var(--border)] text-soft hover:text-[color:var(--foreground)]"
                }`}
                title={listening ? "Stop Recording" : "Speak using Microphone"}
              >
                {listening ? "🎙️ Stop" : "🎤 Mic"}
              </button>

              <input
                type="text"
                value={candidateDraft}
                onChange={(e) => setCandidateDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendTurn();
                  }
                }}
                placeholder={
                  listening ? "Listening to your voice..." : "Type your technical answer, complexity, or approach..."
                }
                className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />

              <Button
                onClick={() => void handleSendTurn()}
                disabled={turnLoading || (!candidateDraft.trim() && !listening)}
                className="btn-primary text-xs px-4 py-2"
              >
                Send
              </Button>
            </div>
          </div>

          {/* Right Rail: Real-time Live Coach & Context */}
          <div className="space-y-4">
            <div className="surface-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-cyan-400">{liveCoach.headline}</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                  Live Stream
                </span>
              </div>
              <ul className="space-y-2.5">
                {liveCoach.bullets.map((bullet, idx) => (
                  <li key={idx} className="text-xs text-soft flex items-start gap-2 leading-relaxed">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {company} Scoring Rubric
              </h4>
              <p className="text-xs text-soft">
                Evaluators grade based on Big-O optimality, modular structure, invariant correctness, and failure resilience.
              </p>
              <div className="border-t border-[color:var(--border)] pt-3">
                <button
                  type="button"
                  onClick={() => handleSendTurn("", true)}
                  disabled={turnLoading}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-medium transition-all"
                >
                  💡 Need a nudge? Ask Socratic Coach
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placement Scorecard View (Post-Interview) */}
      {scorecard && (
        <div className="surface-card p-6 sm:p-8 space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] pb-6">
            <div>
              <span className="eyebrow-chip">Placement Evaluation Scorecard</span>
              <h2 className="mt-2 text-3xl font-bold">
                {company} Technical Interview Results
              </h2>
              <p className="text-sm text-soft mt-1">
                Candidate benchmarked against {company} {role} campus hiring rubrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tierBadgeColor(
                  scorecard.companyTierFit
                )}`}
              >
                {scorecard.companyTierFit || "Evaluated"}
              </span>
              <Button onClick={handleCopyShare} className="btn-secondary text-xs">
                {shareCopied ? "✓ Copied!" : "Share on LinkedIn"}
              </Button>
            </div>
          </div>

          {/* 5-Dimension Scorecard Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="surface-soft p-4 rounded-xl text-center border border-[color:var(--border)]">
              <p className="text-xs font-medium text-muted uppercase">Overall Score</p>
              <p className="text-3xl font-extrabold text-cyan-400 mt-1">{scorecard.overallScore}%</p>
              <p className="text-[11px] text-soft mt-1">Weighted Placement Index</p>
            </div>

            <div className="surface-soft p-4 rounded-xl text-center border border-[color:var(--border)]">
              <p className="text-xs font-medium text-muted uppercase">Problem Solving & DSA</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                {scorecard.dimensions?.problemSolvingDsa || scorecard.problemSolvingScore}%
              </p>
              <p className="text-[11px] text-soft mt-1">Algorithmic Optimality</p>
            </div>

            <div className="surface-soft p-4 rounded-xl text-center border border-[color:var(--border)]">
              <p className="text-xs font-medium text-muted uppercase">System Architecture</p>
              <p className="text-3xl font-extrabold text-indigo-400 mt-1">
                {scorecard.dimensions?.systemDesignArchitecture || 70}%
              </p>
              <p className="text-[11px] text-soft mt-1">Scalability & Trade-offs</p>
            </div>

            <div className="surface-soft p-4 rounded-xl text-center border border-[color:var(--border)]">
              <p className="text-xs font-medium text-muted uppercase">Communication</p>
              <p className="text-3xl font-extrabold text-amber-400 mt-1">
                {scorecard.communicationScore}%
              </p>
              <p className="text-[11px] text-soft mt-1">Clarity & Structure</p>
            </div>

            <div className="surface-soft p-4 rounded-xl text-center border border-[color:var(--border)]">
              <p className="text-xs font-medium text-muted uppercase">Time & Complexity</p>
              <p className="text-3xl font-extrabold text-fuchsia-400 mt-1">
                {scorecard.dimensions?.timeComplexityAwareness || 65}%
              </p>
              <p className="text-[11px] text-soft mt-1">Big-O Rigor & Invariants</p>
            </div>
          </div>

          {/* Qualitative Feedback Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths */}
            <div className="surface-soft p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span>✓</span> Key Candidate Strengths
              </h3>
              <ul className="mt-3 space-y-2">
                {scorecard.strengths.map((str, i) => (
                  <li key={i} className="text-xs text-soft flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags / Improvements */}
            <div className="surface-soft p-5 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <span>⚠️</span> Critical Red Flags & Watchouts
              </h3>
              <ul className="mt-3 space-y-2">
                {(scorecard.redFlags || scorecard.improvements).map((flag, i) => (
                  <li key={i} className="text-xs text-soft flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Roadmap */}
          <div className="surface-soft p-5 rounded-xl border border-[color:var(--border)]">
            <h3 className="text-sm font-bold text-cyan-400">
              🚀 Next Steps to Crack {company} {role}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {scorecard.nextSteps.map((step, idx) => (
                <div key={idx} className="p-3 bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)]">
                  <span className="text-xs font-bold text-cyan-400">Step {idx + 1}</span>
                  <p className="mt-1 text-xs text-soft leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--border)] pt-6">
            <button
              type="button"
              onClick={() => {
                setSessionActive(false);
                setScorecard(null);
                setHistory([]);
              }}
              className="btn-secondary text-xs px-4 py-2"
            >
              ← Practice Another Round
            </button>

            <div className="flex items-center gap-3">
              <Link href="/resume-roaster" className="btn-secondary text-xs">
                Check Resume ATS Fit →
              </Link>
              <Link href="/problems" className="btn-primary text-xs">
                Solve Recommended DSA Problems →
              </Link>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
