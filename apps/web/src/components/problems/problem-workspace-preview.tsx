"use client";

import type { AiAssistMode, BillingSummary, ProblemDetail } from "@codeorbit/schema";
import { Button } from "@codeorbit/ui";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { companyDirectory, trackItems } from "@/data/hiring-os";
import { getProblemRuntimeSpec, getProblemTemplate } from "@/lib/problem-runtime";
import { usePlatformAuth } from "@/lib/auth-context";
import { platformApi } from "@/lib/platform-api";
import { toast } from "@/components/ui/toast-bus";
import { canExecuteClientSide, executeInClientSandbox } from "@/lib/client-sandbox";

const defaultBillingSummary: BillingSummary = {
  planId: "free",
  planName: "Free",
  status: "inactive",
  premiumActive: false,
  validUntilIso: null,
};

const languageOptions = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const getTemplateForLanguage = (problem: ProblemDetail, language: string) =>
  getProblemTemplate(problem, language);

const LOCAL_SUBMISSION_KEY = "codeorbit.local-submissions";
const LOCAL_DRAFT_STORAGE_PREFIX = "codeorbit.problem-draft.v1";

type LocalProblemDraft = {
  code: string;
  customInput: string;
  expectedOutput: string;
  updatedAtIso: string;
};

const getProblemDraftStorageKey = (problemId: string, language: string) =>
  `${LOCAL_DRAFT_STORAGE_PREFIX}:${problemId}:${language}`;

const readLocalProblemDraft = (problemId: string, language: string): LocalProblemDraft | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(getProblemDraftStorageKey(problemId, language));
    if (!rawDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(rawDraft) as Partial<LocalProblemDraft>;
    if (
      typeof parsedDraft.code !== "string" ||
      typeof parsedDraft.customInput !== "string" ||
      typeof parsedDraft.expectedOutput !== "string" ||
      typeof parsedDraft.updatedAtIso !== "string"
    ) {
      return null;
    }

    return {
      code: parsedDraft.code,
      customInput: parsedDraft.customInput,
      expectedOutput: parsedDraft.expectedOutput,
      updatedAtIso: parsedDraft.updatedAtIso,
    };
  } catch {
    return null;
  }
};

const writeLocalProblemDraft = (problemId: string, language: string, draft: LocalProblemDraft) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getProblemDraftStorageKey(problemId, language), JSON.stringify(draft));
};

const ProblemCodeEditor = dynamic(
  () => import("@/components/problems/problem-code-editor").then((module) => module.ProblemCodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-300">
        Loading Monaco editor...
      </div>
    ),
  }
);

interface ExecutionResultData {
  status: string;
  judgeStatus: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  expectedOutput?: string | null;
  timeSeconds?: string | null;
  memoryKb?: number | null;
  passed?: boolean | null;
}

export function ProblemWorkspacePreview({
  initialProblem,
  problemId,
}: {
  initialProblem: ProblemDetail;
  problemId: string;
}) {
  const preferTextareaEditor = false;
  const { resolvedTheme } = useTheme();
  const { loading: authLoading, user } = usePlatformAuth();
  const initialRuntimeSpec = getProblemRuntimeSpec(initialProblem);

  const [problem, setProblem] = useState<ProblemDetail>(initialProblem);
  const [code, setCode] = useState(getTemplateForLanguage(initialProblem, "typescript"));
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [activeTestCaseTab, setActiveTestCaseTab] = useState<"case-1" | "case-2" | "custom">("case-1");
  const [customInput, setCustomInput] = useState(initialRuntimeSpec.sampleInput);
  const [expectedOutput, setExpectedOutput] = useState(initialRuntimeSpec.expectedOutput);
  const [notice, setNotice] = useState<string | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary>(defaultBillingSummary);

  // Execution & Console State
  const [consoleStatus, setConsoleStatus] = useState("Idle");
  const [runtimeLabel, setRuntimeLabel] = useState("--");
  const [executionResult, setExecutionResult] = useState<ExecutionResultData | null>(null);
  const [rawConsoleOutput, setRawConsoleOutput] = useState("No output yet. Press [Cmd + Enter] or Run to test your solution.");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0);

  // Socratic Progressive Hints State
  const [activeHintLevel, setActiveHintLevel] = useState<1 | 2 | 3>(1);
  const [highestUnlockedHintLevel, setHighestUnlockedHintLevel] = useState<1 | 2 | 3>(1);
  const [assistMode, setAssistMode] = useState<AiAssistMode>("hint_1");
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistTitle, setAssistTitle] = useState("Level 1: Mental Model & Complexity");
  const [assistOutput, setAssistOutput] = useState(
    "Click 'Reveal Level 1' to receive a subtle conceptual nudge and the target time/space complexity without spoiling the code."
  );
  const [solutionForfeited, setSolutionForfeited] = useState(false);
  const [confirmForfeitPrompt, setConfirmForfeitPrompt] = useState(false);

  // Autosave and UI states
  const [autosaveState, setAutosaveState] = useState<"saving" | "saved">("saved");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [editorFallback, setEditorFallback] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<"problem" | "code" | "console">("problem");
  const skipAutosaveRef = useRef(true);
  const hasEditedSinceLoadRef = useRef(false);

  const editorTheme = resolvedTheme === "light" ? "codeorbit-light" : "codeorbit-dark";
  const guestMode = !authLoading && !user;

  // Load problem details & billing summary
  useEffect(() => {
    let cancelled = false;
    setProblem(initialProblem);

    void (async () => {
      try {
        const response = await platformApi.getProblemDetail(problemId);
        if (!cancelled) {
          setProblem((current) => {
            if (current.id === response.id && hasEditedSinceLoadRef.current) {
              return current;
            }
            return response;
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Using local problem fallback:", error);
        }
      }
    })();

    void (async () => {
      try {
        const summary = await platformApi.getBillingSummary();
        if (!cancelled) {
          setBillingSummary(summary);
        }
      } catch (error) {
        if (!cancelled) {
          setBillingSummary(defaultBillingSummary);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialProblem, problemId]);

  // Proctoring telemetry: tracks tab blurs and external paste operations
  const [proctorTelemetry, setProctorTelemetry] = useState({
    tabSwitches: 0,
    pasteEvents: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctorTelemetry((prev) => {
          const next = { ...prev, tabSwitches: prev.tabSwitches + 1 };
          toast.warning(`Assessment Proctor: Tab switch recorded (${next.tabSwitches})`, "Integrity Guard");
          return next;
        });
      }
    };

    const handlePaste = () => {
      setProctorTelemetry((prev) => ({ ...prev, pasteEvents: prev.pasteEvents + 1 }));
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  // Load draft when problem or language changes
  useEffect(() => {
    const storedDraft = readLocalProblemDraft(problem.id, selectedLanguage);
    const nextRuntimeSpec = getProblemRuntimeSpec(problem);

    skipAutosaveRef.current = true;
    hasEditedSinceLoadRef.current = false;
    setDraftHydrated(false);
    setCode(storedDraft?.code ?? getTemplateForLanguage(problem, selectedLanguage));
    setCustomInput(storedDraft?.customInput ?? nextRuntimeSpec.sampleInput);
    setExpectedOutput(storedDraft?.expectedOutput ?? nextRuntimeSpec.expectedOutput);
    setAutosaveState("saved");
    setDraftHydrated(true);
  }, [problem, selectedLanguage]);

  // Debounced draft autosave
  useEffect(() => {
    if (!draftHydrated || typeof window === "undefined") {
      return;
    }

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      writeLocalProblemDraft(problem.id, selectedLanguage, {
        code,
        customInput,
        expectedOutput,
        updatedAtIso: new Date().toISOString(),
      });
      setAutosaveState("saved");
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [code, customInput, draftHydrated, expectedOutput, problem.id, selectedLanguage]);

  useEffect(() => {
    if (preferTextareaEditor) {
      setEditorReady(true);
      setEditorFallback(true);
      return;
    }

    setEditorReady(false);
    setEditorFallback(false);
    const timeout = window.setTimeout(() => {
      setEditorFallback(true);
    }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [preferTextareaEditor, problemId, selectedLanguage]);

  // Keyboard shortcut listener for universal Cmd+Enter / Ctrl+Enter and Cmd+' / Ctrl+'
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (!isCmdOrCtrl) return;

      // Cmd + Enter -> Run
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleRun();
      }
      // Cmd + ' -> Submit (Standard CP shortcut)
      else if (event.key === "'" || event.code === "Quote") {
        event.preventDefault();
        void handleSubmit();
      }
      // Cmd + Shift + Enter -> Submit
      else if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        void handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  const selectedLanguageLabel =
    languageOptions.find((option) => option.value === selectedLanguage)?.label ?? "TypeScript";
  const premiumLocked = !billingSummary.premiumActive && problem.difficulty !== "Easy";
  const runtimeSpec = useMemo(() => getProblemRuntimeSpec(problem), [problem]);

  // Derived Company Context
  const linkedTracks = useMemo(
    () =>
      trackItems
        .filter((track) => track.problemId === problemId)
        .map((track) => ({
          ...track,
          companyName:
            companyDirectory.find((company) => company.slug === track.companySlug)?.name ??
            track.companySlug,
        })),
    [problemId]
  );

  const targetCompanies = useMemo(() => {
    const names = linkedTracks.map((t) => t.companyName);
    if (names.length > 0) return names;
    // Default localized Indian tech campus placement targets
    if (problem.difficulty === "Easy") return ["TCS Digital", "Infosys SP", "Cognizant GenC", "Wipro Turbo"];
    if (problem.difficulty === "Medium") return ["Amazon SDE-1", "Flipkart GRiD", "Swiggy", "Razorpay"];
    return ["Google India", "Microsoft IDC", "Amazon L5", "Flipkart Core"];
  }, [linkedTracks, problem.difficulty]);

  const updateCode = (value: string) => {
    hasEditedSinceLoadRef.current = true;
    setAutosaveState("saving");
    setCode(value);
  };

  const updateCustomInput = (value: string) => {
    hasEditedSinceLoadRef.current = true;
    setAutosaveState("saving");
    setCustomInput(value);
  };

  const updateExpectedOutput = (value: string) => {
    hasEditedSinceLoadRef.current = true;
    setAutosaveState("saving");
    setExpectedOutput(value);
  };

  // Test case tab selection
  const handleSelectCaseTab = (tab: "case-1" | "case-2" | "custom") => {
    setActiveTestCaseTab(tab);
    if (tab === "case-1") {
      updateCustomInput(problem.examples[0]?.input ?? runtimeSpec.sampleInput);
      updateExpectedOutput(problem.examples[0]?.output ?? runtimeSpec.expectedOutput);
    } else if (tab === "case-2") {
      if (problem.examples[1]) {
        updateCustomInput(problem.examples[1].input);
        updateExpectedOutput(problem.examples[1].output);
      } else {
        updateCustomInput(runtimeSpec.sampleInput);
        updateExpectedOutput(runtimeSpec.expectedOutput);
      }
    }
  };

  // Code Execution Handler (Run)
  const handleRun = async () => {
    if (running) return;
    setRunning(true);
    setConsoleStatus("Running");

    if (canExecuteClientSide(selectedLanguage)) {
      setRuntimeLabel("Instant Client Sandbox (0ms)");
      setRawConsoleOutput("Running code in client sandbox...");
      try {
        const clientRes = await executeInClientSandbox(
          selectedLanguage,
          code,
          customInput,
          expectedOutput || undefined
        );
        if (clientRes.status !== "Runtime Error" || !clientRes.stderr?.includes("unavailable")) {
          setConsoleStatus(clientRes.status);
          setRuntimeLabel(`Instant Sandbox • ${selectedLanguageLabel} (${clientRes.timeSeconds}s)`);
          setExecutionResult({
            status: clientRes.status,
            judgeStatus: clientRes.judgeStatus,
            stdout: clientRes.stdout,
            stderr: clientRes.stderr,
            compileOutput: null,
            expectedOutput: expectedOutput || null,
            timeSeconds: clientRes.timeSeconds,
            memoryKb: clientRes.memoryKb,
            passed: clientRes.passed,
          });
          setRawConsoleOutput(clientRes.stdout || clientRes.stderr || clientRes.message);
          setNotice("Sample test evaluated instantly in client sandbox (0ms server latency).");
          if (clientRes.passed) {
            toast.success(
              `Verdict: ${clientRes.status} • ${Math.round(parseFloat(clientRes.timeSeconds) * 1000)}ms`,
              "Test Passed"
            );
          } else {
            toast.error(`Verdict: ${clientRes.status}`, "Test Output Check");
          }
          setRunning(false);
          return;
        }
      } catch (clientErr) {
        console.warn("Client sandbox fallback to Judge0:", clientErr);
      }
    }

    setRuntimeLabel("Judge0 isolated runner");
    setRawConsoleOutput("Executing your code against testcase in sandbox...");
    toast.info("Executing code in Judge0 sandbox...", "Running Sandbox");

    try {
      const response = await platformApi.runCode({
        language: selectedLanguage,
        submission: code,
        stdin: customInput,
        expectedOutput: expectedOutput || undefined,
      });

      setConsoleStatus(response.status);
      setRuntimeLabel(`Judge0 • ${selectedLanguageLabel}`);
      setExecutionResult({
        status: response.status,
        judgeStatus: response.judgeStatus,
        stdout: response.stdout,
        stderr: response.stderr,
        compileOutput: response.compileOutput,
        expectedOutput: response.expectedOutput,
        timeSeconds: response.timeSeconds,
        memoryKb: response.memoryKb,
        passed: response.passed,
      });
      setRawConsoleOutput(response.stdout || response.stderr || response.compileOutput || response.message);
      setNotice("Run completed successfully via authenticated Judge0 runner.");

      if (response.passed) {
        const ms = response.timeSeconds ? `${Math.round(parseFloat(response.timeSeconds) * 1000)}ms` : "";
        toast.success(`Verdict: ${response.status} ${ms ? `• ${ms}` : ""}`, "Test Passed");
      } else {
        toast.error(`Verdict: ${response.status}`, "Test Output Check");
      }
      setMobileTab("console");
    } catch (error) {
      console.error("Run failed:", error);
      setConsoleStatus("Error");
      setRuntimeLabel("Execution error");
      setExecutionResult(null);
      const msg = (error as Error).message || "Code execution failed.";
      setRawConsoleOutput(msg);
      toast.error(msg, "Execution Error");
    } finally {
      setRunning(false);
    }
  };

  // Code Submission Handler (Submit)
  const handleSubmit = async () => {
    if (submitting) return;

    if (guestMode) {
      setConsoleStatus("Sign-in required");
      setRuntimeLabel("Public preview");
      setRawConsoleOutput("Sign in to submit your solution, verify testcases, and build your verified Readiness Score.");
      setNotice("Sign in to unlock permanent submissions, campus placement analytics, and verified scoring.");
      toast.warning("Sign in to unlock verified submissions and readiness scoring.", "Sign-In Required");
      return;
    }

    if (premiumLocked) {
      setConsoleStatus("Locked");
      setRuntimeLabel("Pro tier required");
      setRawConsoleOutput("Free tier covers Easy problems. Upgrade to Pro to submit Medium and Hard problems.");
      toast.warning("Pro Sprint required for Medium/Hard problems.", "Pro Access Required");
      return;
    }

    setSubmitting(true);
    setConsoleStatus("Queueing");
    setRuntimeLabel("Judge0 test suite");
    setRawConsoleOutput("Submitting solution to full automated test suite...");
    toast.info("Submitting solution to automated test suite...", "Judge0 Evaluation");

    try {
      const response = await platformApi.submitSolution({
        problemId,
        language: selectedLanguage,
        submission: code,
        stdin: customInput,
        expectedOutput: expectedOutput || undefined,
      });

      setConsoleStatus(response.status);
      setRuntimeLabel(`Judge0 • ${selectedLanguageLabel}`);
      setExecutionResult({
        status: response.status,
        judgeStatus: response.judgeStatus,
        stdout: response.stdout,
        stderr: response.stderr,
        compileOutput: response.compileOutput,
        expectedOutput: response.expectedOutput,
        timeSeconds: response.timeSeconds,
        memoryKb: response.memoryKb,
        passed: response.passed,
      });
      setRawConsoleOutput(response.stdout || response.stderr || response.compileOutput || response.message);

      const isAccepted = response.status === "Accepted";
      if (!isAccepted) {
        setFailedAttemptsCount((count) => count + 1);
        toast.error(`Verdict: ${response.status}`, "Submission Failed");
      } else {
        toast.success("Solution Accepted! Placement readiness score updated.", "Accepted 🎉");
      }
      setMobileTab("console");

      setNotice(
        isAccepted
          ? "🎉 Solution Accepted! Your placement readiness scorecard has been updated."
          : "Submission evaluated. Check test output and review hints to optimize your approach."
      );

      // Save to local storage for quick access
      if (typeof window !== "undefined") {
        const existing = JSON.parse(window.localStorage.getItem(LOCAL_SUBMISSION_KEY) ?? "[]") as Array<{
          id: string;
          problemId: string;
          problemName: string;
          status: string;
          submittedAtIso: string;
        }>;

        const next = [
          {
            id: response.id,
            problemId,
            problemName: problem.problemName,
            status: response.status,
            submittedAtIso: new Date().toISOString(),
          },
          ...existing,
        ].slice(0, 20);

        window.localStorage.setItem(LOCAL_SUBMISSION_KEY, JSON.stringify(next));
      }

      // Automatically request Gemini Submission Review
      setAssistMode("review");
      setAssistLoading(true);
      setAssistTitle("Submission Review & Complexity Analysis");
      setAssistOutput("Gemini is analyzing your algorithm, runtime benchmarks, and time/space complexity...");

      try {
        const review = await platformApi.getAiProblemAssist({
          problemId,
          mode: "review",
          code,
          language: selectedLanguage,
          problemName: problem.problemName,
          problemDifficulty: problem.difficulty,
          problemDescription: problem.description,
          problemTags: problem.tags,
          problemConstraints: problem.constraints,
          stdin: customInput || undefined,
          expectedOutput: expectedOutput || undefined,
          actualOutput: response.stdout ?? response.stderr ?? response.compileOutput ?? undefined,
          stderr: response.stderr ?? undefined,
          compileOutput: response.compileOutput ?? undefined,
          judgeStatus: response.judgeStatus,
        });

        setAssistTitle(review.title);
        setAssistOutput(review.content);
      } catch (reviewError) {
        setAssistTitle("Submission Review");
        setAssistOutput((reviewError as Error).message || "Automated review temporarily unavailable.");
      } finally {
        setAssistLoading(false);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setConsoleStatus("Error");
      setRuntimeLabel("Submission failed");
      setRawConsoleOutput((error as Error).message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Socratic Progressive AI Assist Handler
  const handleProgressiveAssist = async (mode: AiAssistMode, level?: 1 | 2 | 3) => {
    if (guestMode) {
      setAssistMode(mode);
      setAssistTitle("AI Coach Preview");
      setAssistOutput("Sign in to unlock interactive Socratic hints, data structure suggestions, and automated complexity reviews.");
      return;
    }

    if (level) {
      setActiveHintLevel(level);
      if (level > highestUnlockedHintLevel) {
        setHighestUnlockedHintLevel(level);
      }
    }

    setAssistMode(mode);
    setAssistLoading(true);

    try {
      const response = await platformApi.getAiProblemAssist({
        problemId,
        mode,
        code,
        language: selectedLanguage,
        problemName: problem.problemName,
        problemDifficulty: problem.difficulty,
        problemDescription: problem.description,
        problemTags: problem.tags,
        problemConstraints: problem.constraints,
        stdin: customInput || undefined,
        expectedOutput: expectedOutput || undefined,
      });

      setAssistTitle(response.title);
      setAssistOutput(response.content);
    } catch (error) {
      console.error("AI Assist request failed:", error);
      setAssistTitle("AI Coach");
      setAssistOutput((error as Error).message || "AI Coach assistance temporarily unavailable.");
    } finally {
      setAssistLoading(false);
    }
  };

  const isSolutionUnlocked = failedAttemptsCount >= 3 || solutionForfeited;

  return (
    <div className="app-shell pb-28 md:pb-8">
      <div className="mx-auto w-full max-w-[1800px] px-3 pt-4 sm:px-4 sm:pt-6 md:px-6">
        {/* Top Header Card */}
        <div className="surface-card mb-4 p-4 sm:mb-5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/problems" className="text-sm font-medium text-[color:var(--accent)] hover:underline">
                ← Back to Problem Catalog
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold sm:text-2xl md:text-3xl text-slate-100">{problem.problemName}</h1>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    problem.difficulty === "Easy"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
                      : problem.difficulty === "Medium"
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-400"
                        : "border-rose-400/30 bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {problem.difficulty}
                </span>
              </div>

              {/* Company Context Tags */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Targeted in:</span>
                {targetCompanies.map((company) => (
                  <span
                    key={company}
                    className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300"
                  >
                    {company}
                  </span>
                ))}
                <span className="rounded-md border border-violet-400/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                  Campus OA Benchmark: 15–20 mins
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button
                variant="secondary"
                className="text-sm"
                onClick={() => setFocusMode((current) => !current)}
              >
                {focusMode ? "Exit Focus Mode" : "Focus Mode"}
              </Button>
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Proctor Active</span>
                {proctorTelemetry.tabSwitches > 0 && (
                  <span className="text-amber-300 ml-0.5">({proctorTelemetry.tabSwitches} blurs)</span>
                )}
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
                {autosaveState === "saving" ? "Saving draft..." : "Draft autosaved"}
              </div>
            </div>
          </div>
        </div>

        {premiumLocked && (
          <div className="surface-card mb-4 border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            This {problem.difficulty.toLowerCase()} problem is part of Pro Sprint access. Free tier covers easy placement questions.
            <Link href="/pricing" className="ml-2 font-semibold underline">
              Unlock Pro Access
            </Link>
          </div>
        )}

        {notice && (
          <div className="surface-card mb-4 border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
            {notice}
          </div>
        )}

        {/* Mobile / Compact 3-Tab Segment Control (Hidden on XL screens) */}
        <div className="mb-4 flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 xl:hidden shadow-sm backdrop-blur-md sticky top-16 z-20">
          <button
            type="button"
            onClick={() => setMobileTab("problem")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "problem"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📖 Problem & Hints</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("code")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "code"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>💻 Code Editor</span>
            <span className="text-[10px] font-mono text-cyan-400/80">({code.split("\n").length}L)</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("console")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "console"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>⚡ Console</span>
            {executionResult && (
              <span
                className={`h-2 w-2 rounded-full ${
                  executionResult.passed ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"
                }`}
              />
            )}
          </button>
        </div>

        {/* Workspace Split Layout */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 items-start">
          {/* Left Split: Problem Details & Progressive Socratic AI Hints (Independent Scroll) */}
          <aside
            className={`${focusMode ? "hidden" : ""} ${
              mobileTab !== "problem" ? "hidden xl:block" : "block"
            } space-y-4 xl:col-span-5 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto xl:sticky xl:top-20 pr-1.5 custom-scrollbar`}
          >
            {/* Problem Statement */}
            <section className="surface-card p-4 sm:p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-200">Problem Description</h2>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-300">{problem.description}</p>
            </section>

            {/* Examples */}
            <section className="surface-card p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-semibold text-cyan-400 uppercase tracking-wider">Examples</h3>
              <div className="space-y-3">
                {problem.examples.map((entry, index) => (
                  <div
                    key={`${problem.id}-example-${index}`}
                    className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-xs leading-5 text-slate-300"
                  >
                    <p className="font-bold text-slate-100">Example {index + 1}</p>
                    <p className="mt-1 font-semibold uppercase tracking-wider text-slate-400">Input</p>
                    <pre className="overflow-auto whitespace-pre-wrap rounded bg-black/40 p-1.5 font-mono text-cyan-200">
                      {entry.input}
                    </pre>
                    <p className="mt-2 font-semibold uppercase tracking-wider text-slate-400">Output</p>
                    <pre className="overflow-auto whitespace-pre-wrap rounded bg-black/40 p-1.5 font-mono text-emerald-200">
                      {entry.output}
                    </pre>
                    {entry.explanation && <p className="mt-2 text-slate-400">{entry.explanation}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Constraints */}
            <section className="surface-card p-4 sm:p-5">
              <h3 className="mb-2 text-sm font-semibold text-cyan-400 uppercase tracking-wider">Constraints</h3>
              <ul className="list-disc space-y-1 pl-5 text-xs leading-6 text-slate-300">
                {problem.constraints.map((entry) => (
                  <li key={`${problem.id}-${entry}`}>{entry}</li>
                ))}
              </ul>
            </section>

            {/* Socratic Progressive AI Hint Drawer */}
            <section className="surface-card p-4 sm:p-5 border border-indigo-500/20">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-indigo-400">Socratic AI Interviewer</h3>
                  <p className="text-xs text-slate-400">Progressive hints prevent spoilers while training algorithmic intuition.</p>
                </div>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 uppercase">
                  {assistMode.replace("_", " ")}
                </span>
              </div>

              {/* 3-Tier Stepper Controls */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => void handleProgressiveAssist("hint_1", 1)}
                  disabled={assistLoading}
                  className={`rounded-lg border p-2 text-left text-xs transition-all ${
                    activeHintLevel === 1
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold shadow-sm"
                      : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  <div className="font-bold">Level 1</div>
                  <div className="text-[10px] text-slate-400">Mental Model</div>
                </button>

                <button
                  type="button"
                  onClick={() => void handleProgressiveAssist("hint_2", 2)}
                  disabled={assistLoading}
                  className={`rounded-lg border p-2 text-left text-xs transition-all ${
                    activeHintLevel === 2
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold shadow-sm"
                      : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  <div className="font-bold">Level 2</div>
                  <div className="text-[10px] text-slate-400">Data Structure</div>
                </button>

                <button
                  type="button"
                  onClick={() => void handleProgressiveAssist("hint_3", 3)}
                  disabled={assistLoading}
                  className={`rounded-lg border p-2 text-left text-xs transition-all ${
                    activeHintLevel === 3
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold shadow-sm"
                      : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  <div className="font-bold">Level 3</div>
                  <div className="text-[10px] text-slate-400">Pseudocode</div>
                </button>
              </div>

              {/* Extra Tools: ELI5 and Guarded Solver */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => void handleProgressiveAssist("eli5")}
                  disabled={assistLoading}
                >
                  Explain Like I&apos;m 5
                </Button>

                {isSolutionUnlocked ? (
                  <Button
                    variant="secondary"
                    className="text-xs border-amber-500/40 text-amber-300"
                    onClick={() => void handleProgressiveAssist("solver")}
                    disabled={assistLoading}
                  >
                    View Full Solution
                  </Button>
                ) : confirmForfeitPrompt ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-300">Forfeit score?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSolutionForfeited(true);
                        setConfirmForfeitPrompt(false);
                        void handleProgressiveAssist("solver");
                      }}
                      className="rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      Yes, reveal
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmForfeitPrompt(false)}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmForfeitPrompt(true)}
                    className="text-xs text-slate-400 hover:text-amber-300 underline"
                  >
                    Solution locked ({failedAttemptsCount}/3 attempts). Forfeit to view?
                  </button>
                )}
              </div>

              {/* Hint Content Output */}
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/80 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{assistTitle}</p>
                  {assistLoading && <span className="text-xs text-slate-400 animate-pulse">Consulting AI coach...</span>}
                </div>
                <div className="mt-2.5 whitespace-pre-line text-sm leading-6 text-slate-200">
                  {assistOutput}
                </div>
              </div>

              {/* Mobile CTA: Fast-Switch to Code Editor */}
              <div className="xl:hidden pt-3">
                <button
                  type="button"
                  onClick={() => setMobileTab("code")}
                  className="w-full rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 py-3 text-xs font-bold text-cyan-200 hover:from-cyan-500/30 hover:to-blue-500/30 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Open Code Editor & Solve ({selectedLanguageLabel}) →</span>
                </button>
              </div>
            </section>
          </aside>

          {/* Right Split: Monaco Editor & Interactive Testcase Console */}
          <section
            className={`space-y-4 ${focusMode ? "xl:col-span-12" : "xl:col-span-7"} ${
              mobileTab === "problem" ? "hidden xl:block" : "block"
            }`}
          >
            {/* Editor Container */}
            <div className={`surface-card p-4 ${mobileTab === "console" ? "hidden xl:block" : "block"}`}>
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <select
                    value={selectedLanguage}
                    onChange={(event) => setSelectedLanguage(event.target.value)}
                    className="field-select text-sm"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => updateCode(getTemplateForLanguage(problem, selectedLanguage))}
                  >
                    Reset Template
                  </Button>
                </div>

                {/* Keybinding Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    className="text-sm font-medium"
                    onClick={() => void handleRun()}
                    disabled={running}
                  >
                    {running ? "Running..." : "Run (Cmd + Enter)"}
                  </Button>
                  <Button
                    variant="primary"
                    className="text-sm font-medium"
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                  >
                    {submitting ? "Evaluating..." : "Submit (Cmd + ')"}
                  </Button>
                </div>
              </div>

              {/* Monaco Editor Surface */}
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0b1020]">
                <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/90 px-4 py-2 text-xs text-slate-400">
                  <span className="font-mono">{selectedLanguageLabel} Production Sandbox</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 hidden sm:inline">Shortcuts: ⌘+Enter (Run) • ⌘+&apos; (Submit)</span>
                    <span className="font-mono text-slate-400">{code.split("\n").length} lines</span>
                  </div>
                </div>
                <div className="h-[480px] sm:h-[540px] xl:h-[calc(100vh-320px)] min-h-[460px]">
                  {preferTextareaEditor || (editorFallback && !editorReady) ? (
                    <textarea
                      value={code}
                      onChange={(event) => updateCode(event.target.value)}
                      className="h-full w-full resize-none bg-[#0b1020] p-4 font-mono text-sm text-slate-100 outline-none"
                      spellCheck={false}
                    />
                  ) : (
                    <ProblemCodeEditor
                      code={code}
                      language={selectedLanguage}
                      theme={editorTheme}
                      onReady={() => {
                        setEditorReady(true);
                        setEditorFallback(false);
                      }}
                      onChange={updateCode}
                      onRun={() => void handleRun()}
                      onSubmit={() => void handleSubmit()}
                    />
                  )}
                </div>
              </div>

              {/* Mobile Quick-Jump between Editor and Console */}
              <div className="flex items-center justify-between xl:hidden pt-3 border-t border-slate-800 mt-3">
                <button
                  type="button"
                  onClick={() => setMobileTab("problem")}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline"
                >
                  ← Problem Description
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("console")}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  View Testcases & Output →
                </button>
              </div>
            </div>

            {/* Interactive Testcase & Execution Console Tabs */}
            <div className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${mobileTab === "code" ? "hidden xl:grid" : "grid"}`}>
              {/* Testcase Console */}
              <div className="surface-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">Test Cases</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectCaseTab("case-1")}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                        activeTestCaseTab === "case-1"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Case 1
                    </button>
                    {problem.examples[1] && (
                      <button
                        type="button"
                        onClick={() => handleSelectCaseTab("case-2")}
                        className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                          activeTestCaseTab === "case-2"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Case 2
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectCaseTab("custom")}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                        activeTestCaseTab === "custom"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Custom Input
                    </button>
                  </div>
                </div>

                <label className="mb-1 block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Standard Input (stdin)
                </label>
                <textarea
                  rows={4}
                  value={customInput}
                  onChange={(event) => updateCustomInput(event.target.value)}
                  className="field-textarea mb-3 font-mono text-xs bg-slate-950/80 border-slate-700 text-slate-200"
                />

                <label className="mb-1 block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Expected Output
                </label>
                <textarea
                  rows={3}
                  value={expectedOutput}
                  onChange={(event) => updateExpectedOutput(event.target.value)}
                  className="field-textarea font-mono text-xs bg-slate-950/80 border-slate-700 text-slate-200"
                />
              </div>

              {/* Execution Output & Diff View */}
              <div className="surface-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">Execution Output</h3>
                  <div className="flex items-center gap-2">
                    {executionResult && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          executionResult.status === "Accepted"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : executionResult.status === "Wrong Answer"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {executionResult.status}
                      </span>
                    )}
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-mono">
                      {consoleStatus}
                    </span>
                  </div>
                </div>

                {executionResult ? (
                  <div className="space-y-3">
                    {/* Metrics Bar */}
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-700/60 pb-2">
                      <span>Runtime: {executionResult.timeSeconds ? `${Math.round(parseFloat(executionResult.timeSeconds) * 1000)}ms` : "--"}</span>
                      <span>Memory: {executionResult.memoryKb ? `${executionResult.memoryKb} KB` : "--"}</span>
                      <span>Judge: {executionResult.judgeStatus}</span>
                    </div>

                    {/* Diff Output (Side-by-side or stacked) */}
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your Output</p>
                      <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded bg-black/60 p-2 font-mono text-xs text-cyan-200 border border-slate-800">
                        {executionResult.stdout || "(no stdout recorded)"}
                      </pre>
                    </div>

                    {executionResult.expectedOutput && (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expected Output</p>
                        <pre className="max-h-20 overflow-auto whitespace-pre-wrap rounded bg-black/60 p-2 font-mono text-xs text-emerald-300 border border-slate-800">
                          {executionResult.expectedOutput}
                        </pre>
                      </div>
                    )}

                    {executionResult.stderr && (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-rose-400">Runtime Stderr</p>
                        <pre className="max-h-20 overflow-auto whitespace-pre-wrap rounded bg-rose-950/40 p-2 font-mono text-xs text-rose-300 border border-rose-900/40">
                          {executionResult.stderr}
                        </pre>
                      </div>
                    )}

                    {executionResult.compileOutput && (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400">Compiler Diagnostic</p>
                        <pre className="max-h-20 overflow-auto whitespace-pre-wrap rounded bg-amber-950/40 p-2 font-mono text-xs text-amber-300 border border-amber-900/40">
                          {executionResult.compileOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 text-xs text-slate-400 font-mono">Runner: {runtimeLabel}</div>
                    <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded bg-black/50 p-3 font-mono text-xs text-slate-300 border border-slate-800">
                      {rawConsoleOutput}
                    </pre>
                  </div>
                )}
              </div>

              {/* Mobile Quick-Return to Code Editor */}
              <div className="col-span-full flex items-center justify-between xl:hidden pt-1">
                <button
                  type="button"
                  onClick={() => setMobileTab("code")}
                  className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <span>← Back to Code Editor</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
