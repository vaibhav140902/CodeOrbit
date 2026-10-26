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

const getTemplateForLanguage = (problem: ProblemDetail, language: string) => getProblemTemplate(problem, language);

const buildRunnerConsoleOutput = (result: {
  message: string;
  judgeStatus: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  expectedOutput?: string | null;
  timeSeconds?: string | null;
  memoryKb?: number | null;
}) => {
  const sections = [
    `Judge status: ${result.judgeStatus}`,
    result.timeSeconds ? `Time: ${result.timeSeconds}s` : null,
    typeof result.memoryKb === "number" ? `Memory: ${result.memoryKb} KB` : null,
    result.stdout ? `stdout:\n${result.stdout}` : null,
    result.stderr ? `stderr:\n${result.stderr}` : null,
    result.compileOutput ? `compile_output:\n${result.compileOutput}` : null,
    result.expectedOutput ? `expected_output:\n${result.expectedOutput}` : null,
  ].filter(Boolean);

  return sections.length > 0 ? sections.join("\n\n") : result.message;
};

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
      <div className="flex h-full items-center justify-center text-sm text-slate-300">Loading secure editor...</div>
    ),
  }
);

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
  const [customInput, setCustomInput] = useState(initialRuntimeSpec.sampleInput);
  const [expectedOutput, setExpectedOutput] = useState(initialRuntimeSpec.expectedOutput);
  const [notice, setNotice] = useState<string | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary>(defaultBillingSummary);
  const [consoleStatus, setConsoleStatus] = useState("Idle");
  const [runtimeLabel, setRuntimeLabel] = useState("--");
  const [consoleOutput, setConsoleOutput] = useState("No output yet. Run your code to see results.");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assistMode, setAssistMode] = useState<AiAssistMode>("hint");
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistTitle, setAssistTitle] = useState("AI Assist");
  const [assistOutput, setAssistOutput] = useState(
    "Use Smart Hint, Explain Like I'm 5, or AI Auto-Solver to get guided help. After every submit, Gemini also adds review and complexity analysis here."
  );
  const [autosaveState, setAutosaveState] = useState<"saving" | "saved">("saved");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [editorFallback, setEditorFallback] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const skipAutosaveRef = useRef(true);
  const hasEditedSinceLoadRef = useRef(false);
  const editorTheme = resolvedTheme === "light" ? "codeorbit-light" : "codeorbit-dark";
  const guestMode = !authLoading && !user;

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
          setNotice(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Using local problem fallback:", error);
          setNotice("Showing local workspace preview until secure Functions data is configured for this route.");
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
          console.error("Billing summary fallback in workspace:", error);
          setBillingSummary(defaultBillingSummary);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialProblem, problemId]);

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

  const tags = useMemo(
    () =>
      problem.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200 sm:px-3 sm:text-xs"
        >
          {tag}
        </span>
      )),
    [problem.tags]
  );

  const selectedLanguageLabel =
    languageOptions.find((option) => option.value === selectedLanguage)?.label ?? "TypeScript";
  const premiumLocked = !billingSummary.premiumActive && problem.difficulty !== "Easy";
  const runtimeSpec = useMemo(() => getProblemRuntimeSpec(problem), [problem]);
  const linkedTracks = useMemo(
    () =>
      trackItems
        .filter((track) => track.problemId === problemId)
        .map((track) => ({
          ...track,
          companyName: companyDirectory.find((company) => company.slug === track.companySlug)?.name ?? track.companySlug,
        })),
    [problemId]
  );

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

  const handleLoadSampleCase = () => {
    updateCustomInput(runtimeSpec.sampleInput);
    updateExpectedOutput(runtimeSpec.expectedOutput);
    setNotice(`Loaded runnable sample for ${selectedLanguageLabel}. ${runtimeSpec.inputFormat}`);
  };

  const handleRun = async () => {
    setRunning(true);
    setConsoleStatus("Running");
    setRuntimeLabel("Judge0 secure runner");
    setConsoleOutput("Sending code to the isolated Judge0 runner...");

    try {
      const response = await platformApi.runCode({
        language: selectedLanguage,
        submission: code,
        stdin: customInput,
        expectedOutput: expectedOutput || undefined,
      });

      setConsoleStatus(response.status);
      setRuntimeLabel(`Judge0 secure runner • ${selectedLanguageLabel}`);
      setConsoleOutput(buildRunnerConsoleOutput(response));
      setNotice("Run executed through authenticated Cloud Functions and the isolated Judge0 runner.");
    } catch (error) {
      console.error("Secure run failed:", error);
      setConsoleStatus("Error");
      setRuntimeLabel("Judge0 unavailable");
      setConsoleOutput(
        (error as { message?: string })?.message ||
          "Run failed. Add JUDGE0_URL and optional JUDGE0_KEY in backend/functions/.env."
      );
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (guestMode) {
      setConsoleStatus("Preview mode");
      setRuntimeLabel("Sign-in required");
      setConsoleOutput("Sign in to submit solutions, save progress, and contribute to your readiness score.");
      setNotice("You are in public preview mode. Sign in to unlock submissions, scoring, and saved activity.");
      return;
    }

    if (premiumLocked) {
      setConsoleStatus("Locked");
      setRuntimeLabel("Premium required");
      setConsoleOutput("Free access covers easy problems. Upgrade to Pro to submit medium and hard questions.");
      return;
    }

    setSubmitting(true);
    setConsoleStatus("Queueing");
    setRuntimeLabel("Secure queue");
    setConsoleOutput("Sending your solution to the secure submission queue...");

    try {
      const response = await platformApi.submitSolution({
        problemId,
        language: selectedLanguage,
        submission: code,
        stdin: customInput,
        expectedOutput: expectedOutput || undefined,
      });

      setConsoleStatus(response.status);
      setRuntimeLabel(`Judge0 secure runner • ${selectedLanguageLabel}`);
      setConsoleOutput(`${buildRunnerConsoleOutput(response)}\n\nSubmission id: ${response.id}`);
      setNotice("Submission executed and stored through the secure runner. Gemini is now reviewing your approach and complexity.");
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
      setAssistMode("review");
      setAssistLoading(true);
      setAssistTitle("Submission Review + Complexity");
      setAssistOutput("Gemini is reviewing your submission, runtime result, and likely complexity...");

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
        console.error("Submission review failed:", reviewError);
        setAssistTitle("Submission Review + Complexity");
        setAssistOutput(
          (reviewError as { message?: string })?.message ||
            "Gemini review was unavailable for this submission. Try Smart Hint or rerun the solution."
        );
      } finally {
        setAssistLoading(false);
      }
    } catch (error) {
      console.error("Secure submission failed:", error);
      setConsoleStatus("Error");
      setRuntimeLabel("Submission error");
      setConsoleOutput(
        (error as { message?: string })?.message ||
          "Submission failed. Make sure secure backend data is configured for this environment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiAssist = async (mode: AiAssistMode) => {
    if (guestMode) {
      setAssistMode(mode);
      setAssistTitle("AI Assist");
      setAssistOutput("Sign in to use AI hints, explanations, and guided solver support.");
      setNotice("AI assist is available after sign-in so usage and readiness context stay tied to your workspace.");
      return;
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
      setNotice(mode === "solver" ? "Gemini AI Auto-Solver is active with guarded step-by-step output." : null);
    } catch (error) {
      console.error("AI assist failed:", error);
      setAssistTitle("AI Assist");
      setAssistOutput(
        (error as { message?: string })?.message ||
          "AI assist is unavailable. Confirm premium access and backend AI keys for this environment."
      );
    } finally {
      setAssistLoading(false);
    }
  };

  return (
    <div className="app-shell pb-28 md:pb-8">
      <div className="mx-auto w-full max-w-[1800px] px-3 pt-4 sm:px-4 sm:pt-6 md:px-6">
        <div className="surface-card mb-4 p-4 sm:mb-5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href="/problems" className="text-sm text-[color:var(--accent)] hover:underline">
                ← Back to problem list
              </Link>
              <h1 className="mt-2 text-xl font-bold sm:text-2xl md:text-3xl">{problem.problemName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${
                    problem.difficulty === "Easy"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : problem.difficulty === "Medium"
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                        : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {problem.difficulty}
                </span>
                {tags}
              </div>
              {linkedTracks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {linkedTracks.slice(0, 4).map((track) => (
                    <span
                      key={track.id}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-3 py-1 text-xs text-soft"
                    >
                      {track.companyName} • {track.signal ?? "high-frequency"}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button
                variant="secondary"
                className="text-sm"
                onClick={() => setFocusMode((current) => !current)}
              >
                {focusMode ? "Exit Focus Mode" : "Focus Mode"}
              </Button>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-4 py-2 text-sm sm:text-center">
                {autosaveState === "saving" ? "Autosave: Saving..." : "Autosave: Saved locally"}
              </div>
            </div>
          </div>
        </div>

        {premiumLocked && (
          <div className="surface-card mb-4 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            This {problem.difficulty.toLowerCase()} problem is part of paid access. Free access currently covers easy problems only.
            <Link href="/pricing" className="ml-2 underline">
              Unlock paid access
            </Link>
          </div>
        )}

        {guestMode && (
          <div className="surface-card mb-4 border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-200">
            You are viewing a public problem preview. You can read the question and run sample code here, but submitting,
            AI assist, and saved progress require{" "}
            <Link href="/login" className="underline">
              sign in
            </Link>
            .
          </div>
        )}

        {notice && (
          <div className="surface-card mb-4 border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <aside className={`${focusMode ? "hidden" : "space-y-3 sm:space-y-4 xl:col-span-4"}`}>
            <section className="surface-card p-4 sm:p-5">
              <h2 className="mb-3 text-lg font-semibold">Problem Statement</h2>
              <p className="whitespace-pre-line text-sm leading-6 text-soft">{problem.description}</p>
            </section>

            <section className="surface-card p-4 sm:p-5">
              <h3 className="mb-3 font-semibold text-[color:var(--accent)]">Examples</h3>
              <div className="space-y-2">
                {problem.examples.map((entry, index) => (
                  <div
                    key={`${problem.id}-example-${index}`}
                    className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3 text-xs leading-6 text-soft"
                  >
                    <p className="font-semibold text-[color:var(--text-main)]">Example {index + 1}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">Input</p>
                    <pre className="overflow-auto whitespace-pre-wrap text-soft">{entry.input}</pre>
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-muted">Output</p>
                    <pre className="overflow-auto whitespace-pre-wrap text-soft">{entry.output}</pre>
                    {entry.explanation && <p className="mt-2 text-soft">{entry.explanation}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card p-4 sm:p-5">
              <h3 className="mb-2 font-semibold text-[color:var(--accent)]">Constraints</h3>
              <ul className="list-disc space-y-1 pl-5 text-xs leading-6 text-soft">
                {problem.constraints.map((entry) => (
                  <li key={`${problem.id}-${entry}`}>{entry}</li>
                ))}
              </ul>
            </section>

            <section className="surface-card p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[color:var(--accent)]">AI Assist</h3>
                <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                  {assistMode}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="secondary" className="text-xs" onClick={() => void handleAiAssist("hint")} disabled={assistLoading}>
                  Smart Hint
                </Button>
                <Button variant="secondary" className="text-xs" onClick={() => void handleAiAssist("eli5")} disabled={assistLoading}>
                  Explain Like I&apos;m 5
                </Button>
                <Button variant="secondary" className="text-xs" onClick={() => void handleAiAssist("solver")} disabled={assistLoading}>
                  AI Auto-Solver
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3">
                <p className="text-xs uppercase tracking-wide text-muted">{assistTitle}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-soft">
                  {assistLoading ? "Thinking through the solution..." : assistOutput}
                </p>
              </div>
            </section>
          </aside>

          <section className={`space-y-4 ${focusMode ? "xl:col-span-12" : "xl:col-span-8"}`}>
            <div className="surface-card p-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <select
                    value={selectedLanguage}
                    onChange={(event) => setSelectedLanguage(event.target.value)}
                    className="field-select w-full text-sm sm:w-auto"
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
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => updateCode(getTemplateForLanguage(problem, selectedLanguage))}
                  >
                    Load {selectedLanguageLabel} Template
                  </Button>
                </div>

                <div className="hidden gap-2 md:flex md:flex-wrap md:items-center">
                  <Button variant="secondary" className="text-sm" onClick={() => void handleRun()} disabled={running}>
                    {running ? "Running..." : "Run (Ctrl/Cmd + Enter)"}
                  </Button>
                  <Button
                    variant="primary"
                    className="text-sm"
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                  >
                    {submitting ? "Queueing..." : "Submit (Ctrl/Cmd + Shift + Enter)"}
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0b1020]">
                <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/90 px-4 py-2 text-xs text-slate-400">
                  <span>{selectedLanguageLabel} Editor</span>
                  <span className="hidden sm:inline">{code.split("\n").length} lines</span>
                </div>
                <div className="h-[320px] sm:h-[420px]">
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
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2 md:hidden">
                <Button variant="secondary" className="flex-1 text-sm" onClick={() => void handleRun()} disabled={running}>
                  {running ? "Running..." : "Run"}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 text-sm"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? "Queueing..." : "Submit"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div className="surface-card p-4">
                <div className="mb-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <h3 className="font-semibold">Input Lab</h3>
                  <Button variant="ghost" className="text-xs" onClick={handleLoadSampleCase}>
                    Load sample case
                  </Button>
                </div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Custom Input</label>
                <p className="mb-2 text-xs leading-6 text-muted">{runtimeSpec.inputFormat}</p>
                <textarea
                  rows={5}
                  value={customInput}
                  onChange={(event) => updateCustomInput(event.target.value)}
                  className="field-textarea mb-3 font-mono text-sm"
                />
                <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Expected Output (optional)</label>
                <textarea
                  rows={4}
                  value={expectedOutput}
                  onChange={(event) => updateExpectedOutput(event.target.value)}
                  className="field-textarea font-mono text-sm"
                />
              </div>

              <div className="surface-card p-4">
                <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <h3 className="font-semibold">Execution Console</h3>
                  <span className="rounded bg-slate-500/20 px-2 py-1 text-xs font-semibold text-slate-200">
                    {consoleStatus}
                  </span>
                </div>
                <div className="mb-2 text-xs text-muted">Runtime: {runtimeLabel}</div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-emerald-500">stdout</p>
                  <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded bg-black/45 p-2 text-xs text-emerald-200">
                    {consoleOutput}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
