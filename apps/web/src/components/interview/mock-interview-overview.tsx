"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BillingSummary, MockInterviewLiveResponse, MockInterviewResponse } from "@codeorbit/schema";
import { Button } from "@codeorbit/ui";
import { usePlatformAuth } from "@/lib/auth-context";
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

const companies = ["Google", "Amazon", "TCS", "Infosys", "Delhi NCR Startups", "UPSC Style"];

const roles = [
  "SDE Intern",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Structures Interview",
];

const freeBilling: BillingSummary = {
  planId: "free",
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

const initialLiveFeedback: MockInterviewLiveResponse = {
  headline: "Live Gemini Coach",
  bullets: [
    "Start with the problem statement, then describe your approach in one line.",
    "Mention one trade-off or edge case before moving on.",
    "Close each answer with a clear recommendation or next step.",
  ],
  provider: "gemini",
};

const LOCAL_MOCK_SCORE_KEY = "codeorbit.latest-mock-score";

const scoreCard = (label: string, value: number) => (
  <div className="surface-soft p-4">
    <p className="text-muted text-xs uppercase tracking-wide">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);

export function MockInterviewOverview() {
  const { user } = usePlatformAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [billing, setBilling] = useState<BillingSummary>(freeBilling);
  const [company, setCompany] = useState(companies[0]);
  const [role, setRole] = useState(roles[0]);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<MockInterviewResponse | null>(null);
  const [liveFeedback, setLiveFeedback] = useState<MockInterviewLiveResponse>(initialLiveFeedback);
  const [liveFeedbackLoading, setLiveFeedbackLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setBilling(freeBilling);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const summary = await platformApi.getBillingSummary();
        if (!cancelled) {
          setBilling(summary);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Mock interview billing fallback:", error);
          setBilling(freeBilling);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if ((!cameraEnabled && !listening) || transcript.trim().length < 80 || submitting || !billing.premiumActive) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setLiveFeedbackLoading(true);

      void platformApi
        .generateLiveMockInterviewFeedback({
          company,
          role,
          transcript,
          notes,
        })
        .then((response) => {
          setLiveFeedback(response);
        })
        .catch((error) => {
          console.error("Live interview feedback failed:", error);
        })
        .finally(() => {
          setLiveFeedbackLoading(false);
        });
    }, 2200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [billing.premiumActive, cameraEnabled, company, listening, notes, role, submitting, transcript]);

  const speechSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
    );
  }, []);

  const toggleCamera = async () => {
    if (cameraEnabled) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraEnabled(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
      setNotice("Camera and microphone are ready for your live mock session.");
    } catch (error) {
      console.error("Unable to access camera/mic:", error);
      setNotice("Camera or microphone access was blocked. You can still paste your transcript manually.");
    }
  };

  const toggleVoiceCapture = () => {
    const RecognitionCtor = (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
      .webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setNotice("Voice transcription is not supported in this browser. Paste your transcript instead.");
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setTranscript(nextTranscript);
    };
    recognition.onerror = () => {
      setListening(false);
      setNotice("Voice transcription stopped. You can continue by typing or restarting capture.");
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setNotice("Live voice transcription started. Speak naturally and review the transcript before scoring.");
  };

  const handleEvaluate = async () => {
    if (!billing.premiumActive) {
      setNotice("AI mock interviews are part of Pro and Interview Sprint. Upgrade to unlock scoring and live coaching.");
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const feedback = await platformApi.generateMockInterviewFeedback({
        company,
        role,
        transcript,
        notes,
      });
      setResult(feedback);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LOCAL_MOCK_SCORE_KEY,
          JSON.stringify({
            overallScore: feedback.overallScore,
            company,
            role,
            recordedAtIso: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      console.error("Mock interview scoring failed:", error);
      setNotice(
        (error as { message?: string })?.message ||
          "Mock interview scoring is unavailable right now. Confirm paid access and AI keys."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page-container">
        <header className="surface-card mb-6 p-5 sm:mb-8 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">AI Mock Interviews</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Practice with webcam, voice, and instant feedback.</h1>
          <p className="text-muted mt-3 max-w-3xl text-sm leading-7 sm:text-base">
            Run company-specific mock interviews, capture your transcript, and get structured coaching on communication,
            confidence, and problem-solving.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="surface-soft p-4">
              <p className="text-muted text-xs uppercase tracking-wide">Interview Mode</p>
              <p className="mt-2 text-lg font-semibold">Company-first</p>
            </div>
            <div className="surface-soft p-4">
              <p className="text-muted text-xs uppercase tracking-wide">Voice Capture</p>
              <p className="mt-2 text-lg font-semibold">{speechSupported ? "Browser supported" : "Manual transcript"}</p>
            </div>
            <div className="surface-soft p-4">
              <p className="text-muted text-xs uppercase tracking-wide">Access</p>
              <p className="mt-2 text-lg font-semibold">{billing.premiumActive ? "Paid access active" : "Pro feature"}</p>
            </div>
          </div>
        </header>

        {!billing.premiumActive && (
          <div className="surface-card mb-6 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            AI mock interviews are included with Pro and Interview Sprint.
            <Link href="/pricing" className="ml-2 underline">
              Unlock paid access
            </Link>
          </div>
        )}

        {notice && (
          <div className="surface-card mb-6 border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-200">
            {notice}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4">
            <div className="surface-card p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Target Company</label>
                  <select value={company} onChange={(event) => setCompany(event.target.value)} className="field-select">
                    {companies.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Interview Track</label>
                  <select value={role} onChange={(event) => setRole(event.target.value)} className="field-select">
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="secondary" onClick={() => void toggleCamera()}>
                  {cameraEnabled ? "Stop camera" : "Enable camera + mic"}
                </Button>
                <Button variant="secondary" onClick={toggleVoiceCapture}>
                  {listening ? "Stop voice capture" : "Start voice capture"}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleEvaluate()}
                  disabled={submitting || transcript.trim().length < 20 || !billing.premiumActive}
                >
                  {!billing.premiumActive ? "Unlock Pro to Score" : submitting ? "Scoring..." : "Score interview"}
                </Button>
              </div>
            </div>

            <div className="surface-card overflow-hidden">
              <div className="border-b border-[color:var(--border)] px-5 py-4">
                <h2 className="text-lg font-semibold">Webcam Preview</h2>
                <p className="text-muted mt-1 text-sm">Keep your posture visible and speak clearly to simulate the real interview.</p>
              </div>
              <div className="bg-black/40 p-4">
                <video
                  ref={videoRef}
                  autoPlay={true}
                  muted={true}
                  playsInline={true}
                  className="aspect-video w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] object-cover"
                />
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <label className="mb-2 block text-xs uppercase tracking-wide text-muted">Interview Transcript</label>
              <textarea
                rows={10}
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                className="field-textarea font-mono text-sm"
                placeholder="Paste or capture your mock interview transcript here..."
              />
              <label className="mb-2 mt-4 block text-xs uppercase tracking-wide text-muted">Interviewer Notes</label>
              <textarea
                rows={5}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="field-textarea text-sm"
                placeholder="Optional notes: coding question, interruptions, confidence dips, follow-up questions..."
              />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="surface-card p-5">
              <h2 className="text-lg font-semibold">Live Interview Tips</h2>
              <div className="mt-4 space-y-3 text-sm text-soft">
                <p>- Think aloud before coding so the evaluator hears your structure.</p>
                <p>- Mention constraints, edge cases, and time complexity early.</p>
                <p>- Close with trade-offs and how you would test the solution.</p>
              </div>

              {!billing.premiumActive ? (
                <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                  Live AI coaching unlocks with Pro or Interview Sprint.
                </div>
              ) : null}

              <div className="mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{liveFeedback.headline}</p>
                  <span className="text-xs text-[color:var(--accent)]">
                    {liveFeedbackLoading ? "Listening..." : liveFeedback.provider}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-soft">
                  {liveFeedback.bullets.map((item) => (
                    <p key={item}>- {item}</p>
                  ))}
                </div>
              </div>
            </div>

            {result ? (
              <div className="surface-card p-5">
                <h2 className="text-lg font-semibold">Scorecard</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {scoreCard("Overall", result.overallScore)}
                  {scoreCard("Communication", result.communicationScore)}
                  {scoreCard("Problem Solving", result.problemSolvingScore)}
                  {scoreCard("Confidence", result.confidenceScore)}
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-muted text-xs uppercase tracking-wide">AI Summary</p>
                    <p className="mt-2 text-sm leading-7 text-soft">{result.summary}</p>
                    <p className="mt-2 text-xs text-[color:var(--accent)]">Provider: {result.provider}</p>
                  </div>

                  <div>
                    <p className="text-muted text-xs uppercase tracking-wide">Strengths</p>
                    <div className="mt-2 space-y-2">
                      {result.strengths.map((item) => (
                        <p key={item} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-muted text-xs uppercase tracking-wide">Improvements</p>
                    <div className="mt-2 space-y-2">
                      {result.improvements.map((item) => (
                        <p key={item} className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-muted text-xs uppercase tracking-wide">Next Steps</p>
                    <div className="mt-2 space-y-2">
                      {result.nextSteps.map((item) => (
                        <p key={item} className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface-card p-5">
                <h2 className="text-lg font-semibold">Scorecard</h2>
                <p className="text-muted mt-3 text-sm leading-7">
                  Start the session, build your transcript, and submit it to receive the full score breakdown.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
