import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import {
  LANGUAGE_OPTIONS,
  LanguageOption,
  RuntimeRecord,
  editorStorageKey,
  getLanguageById,
  resolveRuntimeVersion,
} from "../utils/languageCatalog";
import { useAuth } from "../hooks/useAuth";

interface ProblemDocument {
  problemName?: string;
  title?: string;
  tags?: unknown[];
  tag?: unknown[];
  difficulty?: string;
  Difficulty?: string;
  ["Difficulty "]?: string;
  description?: string;
  examples?: string;
  constraints?: string;
}

interface ProblemDetails {
  id: string;
  problemName: string;
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: string;
  constraints: string;
}

interface SubmissionRow {
  id: string;
  status: string;
  language: string;
  runtime: string;
  submitTime: string;
}

interface PistonStage {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number;
  signal?: string;
  message?: string;
  time?: number;
}

interface PistonExecuteResponse {
  language?: string;
  version?: string;
  run?: PistonStage;
  compile?: PistonStage;
  message?: string;
}

interface ExecuteResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  exitCode: number | null;
  runtimeLabel: string;
  finalOutput: string;
}

interface SubmissionSummary {
  status: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compilation Error" | "Submitted";
  runtime: string;
  language: string;
  submittedAt: string;
  isNewSolve: boolean;
  scoreAwarded: number;
}

const DEFAULT_RUNTIME_ENDPOINT = "https://emkc.org/api/v2/piston/runtimes";
const DEFAULT_EXECUTE_ENDPOINT = "https://emkc.org/api/v2/piston/execute";

const RUNTIME_ENDPOINTS = (
  import.meta.env.VITE_PISTON_RUNTIMES_URLS ||
  import.meta.env.VITE_PISTON_RUNTIMES_URL ||
  DEFAULT_RUNTIME_ENDPOINT
)
  .split(",")
  .map((entry: string) => entry.trim())
  .filter(Boolean);

const EXECUTE_ENDPOINTS = (
  import.meta.env.VITE_PISTON_EXECUTE_URLS ||
  import.meta.env.VITE_PISTON_EXECUTE_URL ||
  DEFAULT_EXECUTE_ENDPOINT
)
  .split(",")
  .map((entry: string) => entry.trim())
  .filter(Boolean);

const normalizeDifficulty = (value: unknown): "Easy" | "Medium" | "Hard" => {
  if (value === "Medium" || value === "Hard") return value;
  return "Easy";
};

const normalizeTextForCompare = (value: string): string => value.replace(/\r\n/g, "\n").trim();

const parseSampleFromExamples = (examples: string): { input: string; output: string } => {
  const inputMatch = examples.match(/Input:\s*([^\n\r]+)/i);
  const outputMatch = examples.match(/Output:\s*([^\n\r]+)/i);

  return {
    input: inputMatch?.[1]?.trim() ?? "",
    output: outputMatch?.[1]?.trim() ?? "",
  };
};

const toDateString = (value: unknown): string => {
  if (!value || typeof value !== "object") return "Just now";
  const asTimestamp = value as { toDate?: () => Date };
  if (typeof asTimestamp.toDate === "function") {
    return asTimestamp.toDate().toLocaleString();
  }
  return "Just now";
};

const formatLabel = (language: string): string => {
  const trimmed = language.trim();
  if (!trimmed) return "Unknown";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const filenameForLanguage = (language: LanguageOption): string => {
  const map: Record<string, string> = {
    javascript: "main.js",
    typescript: "main.ts",
    python: "main.py",
    java: "Main.java",
    cpp: "main.cpp",
    c: "main.c",
    csharp: "main.cs",
    go: "main.go",
    rust: "main.rs",
    kotlin: "main.kt",
    swift: "main.swift",
    php: "main.php",
    ruby: "main.rb",
    dart: "main.dart",
  };

  return map[language.id] ?? `main.${language.pistonLanguage}`;
};

const dedupe = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const SCORE_BY_DIFFICULTY: Record<"Easy" | "Medium" | "Hard", number> = {
  Easy: 10,
  Medium: 25,
  Hard: 45,
};

const toCompactErrorText = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: { message?: string } };
    const message = parsed?.message || parsed?.error?.message;
    if (message) return message;
  } catch (_error) {
    // Ignore non-JSON bodies.
  }
  return raw.replace(/\s+/g, " ").trim().slice(0, 320);
};

export const ProblemWorkspace = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [problemError, setProblemError] = useState<string | null>(null);

  const [runtimes, setRuntimes] = useState<RuntimeRecord[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const [activeLanguageId, setActiveLanguageId] = useState("javascript");
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [editorReady, setEditorReady] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [stderrText, setStderrText] = useState("");
  const [compileText, setCompileText] = useState("");
  const [runtimeLabel, setRuntimeLabel] = useState("--");
  const [judgeStatus, setJudgeStatus] = useState<"Idle" | "Running" | "Accepted" | "Wrong Answer" | "Runtime Error" | "Compilation Error" | "Submitted">("Idle");
  const [runError, setRunError] = useState<string | null>(null);

  const [focusMode, setFocusMode] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionRow[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState<SubmissionSummary | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  const builtInRuntimeNames = useMemo(
    () =>
      new Set(
        LANGUAGE_OPTIONS.flatMap((language) => [
          language.id.toLowerCase(),
          language.pistonLanguage.toLowerCase(),
          ...language.aliases.map((alias) => alias.toLowerCase()),
        ])
      ),
    []
  );

  const dynamicRuntimeLanguages = useMemo(() => {
    const latestByLanguage = new Map<string, RuntimeRecord>();

    for (const runtime of runtimes) {
      const key = runtime.language.toLowerCase();
      const existing = latestByLanguage.get(key);
      if (!existing || runtime.version.localeCompare(existing.version, undefined, { numeric: true }) > 0) {
        latestByLanguage.set(key, runtime);
      }
    }

    return Array.from(latestByLanguage.values())
      .filter((runtime) => {
        const allNames = [runtime.language, ...(runtime.aliases ?? [])].map((entry) => entry.toLowerCase());
        return !allNames.some((name) => builtInRuntimeNames.has(name));
      })
      .map((runtime) => ({
        id: runtime.language.toLowerCase(),
        label: formatLabel(runtime.language),
        pistonLanguage: runtime.language,
        fallbackVersion: runtime.version,
        aliases: [runtime.language, ...(runtime.aliases ?? [])],
        starterCode: `// Starter template for ${runtime.language}\n// stdin is available through your language runtime.\n`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [runtimes, builtInRuntimeNames]);

  const availableLanguages = useMemo(
    () => [...LANGUAGE_OPTIONS, ...dynamicRuntimeLanguages],
    [dynamicRuntimeLanguages]
  );

  const currentLanguage = useMemo(
    () => availableLanguages.find((language) => language.id === activeLanguageId) ?? getLanguageById("javascript"),
    [availableLanguages, activeLanguageId]
  );

  const totalLines = useMemo(() => Math.max(code.split("\n").length, 1), [code]);
  const lineNumbers = useMemo(
    () => Array.from({ length: totalLines }, (_, index) => index + 1),
    [totalLines]
  );

  const fetchProblem = useCallback(async () => {
    if (!problemId) {
      setProblemError("Problem id is missing.");
      setLoadingProblem(false);
      return;
    }

    try {
      setProblemError(null);
      setLoadingProblem(true);
      const snapshot = await getDoc(doc(db, "problems", problemId));

      if (!snapshot.exists()) {
        setProblemError("Problem not found.");
        setProblem(null);
        return;
      }

      const data = snapshot.data() as ProblemDocument;
      const rawDifficulty = data.difficulty ?? data.Difficulty ?? data["Difficulty "];
      const tagsRaw = Array.isArray(data.tags) ? data.tags : Array.isArray(data.tag) ? data.tag : [];
      const mappedProblem: ProblemDetails = {
        id: snapshot.id,
        problemName: data.problemName ?? data.title ?? "Untitled Problem",
        tags: tagsRaw.map((entry) => String(entry)),
        difficulty: normalizeDifficulty(rawDifficulty),
        description: data.description ?? "No description available yet.",
        examples: data.examples ?? "Examples are not available for this problem yet.",
        constraints: data.constraints ?? "No constraints provided.",
      };

      setProblem(mappedProblem);

      const sample = parseSampleFromExamples(mappedProblem.examples);
      if (user?.uid) {
        const inputKey = `workspace-input:${user.uid}:${problemId}`;
        const expectedKey = `workspace-expected:${user.uid}:${problemId}`;

        if (localStorage.getItem(inputKey) === null) {
          setCustomInput(sample.input);
        }
        if (localStorage.getItem(expectedKey) === null) {
          setExpectedOutput(sample.output);
        }
      } else {
        setCustomInput(sample.input);
        setExpectedOutput(sample.output);
      }
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === "permission-denied") {
        setProblemError("Permission denied while reading this problem. Check Firestore rules and authentication.");
      } else {
        setProblemError("Failed to load problem details.");
      }
    } finally {
      setLoadingProblem(false);
    }
  }, [problemId, user?.uid]);

  const fetchRuntimes = useCallback(async () => {
    setRuntimeError(null);

    for (const endpoint of RUNTIME_ENDPOINTS) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          continue;
        }
        const responseBody = (await response.json()) as RuntimeRecord[];
        setRuntimes(responseBody);
        return;
      } catch (_error) {
        // Try next endpoint.
      }
    }

    setRuntimeError("Live runtime catalog unavailable. Using fallback versions.");
    setRuntimes([]);
  }, []);

  const fetchRecentSubmissions = useCallback(async () => {
    if (!user?.uid || !problemId) return;
    try {
      setSubmissionsLoading(true);
      const submissionsQuery = query(
        collection(db, "submissions"),
        where("userId", "==", user.uid),
        limit(60)
      );

      const snapshot = await getDocs(submissionsQuery);
      const rows = snapshot.docs
        .map((submission) => {
          const data = submission.data() as Record<string, unknown>;
          return {
            id: submission.id,
            status: String(data.status ?? "Submitted"),
            language: String(data.language ?? data.languageId ?? "Unknown"),
            runtime: String(data.runtime ?? "--"),
            submitTime: toDateString(data.submitTime),
            sortable: (() => {
              const timestamp = data.submitTime as { toDate?: () => Date } | undefined;
              if (timestamp && typeof timestamp.toDate === "function") {
                return timestamp.toDate().getTime();
              }
              return 0;
            })(),
            problemId: String(data.problemId ?? ""),
          };
        })
        .filter((submission) => submission.problemId === problemId)
        .sort((a, b) => b.sortable - a.sortable)
        .slice(0, 8)
        .map(({ sortable, problemId: problemIdentifier, ...rest }) => {
          void problemIdentifier;
          return rest;
        });

      setRecentSubmissions(rows);
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [problemId, user?.uid]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  useEffect(() => {
    fetchRuntimes();
  }, [fetchRuntimes]);

  useEffect(() => {
    fetchRecentSubmissions();
  }, [fetchRecentSubmissions]);

  useEffect(() => {
    if (!user?.uid || !problemId) return;
    const inputKey = `workspace-input:${user.uid}:${problemId}`;
    const expectedKey = `workspace-expected:${user.uid}:${problemId}`;

    const storedInput = localStorage.getItem(inputKey);
    if (storedInput !== null) {
      setCustomInput(storedInput);
    }

    const storedExpected = localStorage.getItem(expectedKey);
    if (storedExpected !== null) {
      setExpectedOutput(storedExpected);
    }
  }, [user?.uid, problemId]);

  useEffect(() => {
    if (!user?.uid || !problemId) return;
    setEditorReady(false);

    const storageKey = editorStorageKey(user.uid, problemId, activeLanguageId);
    const savedCode = localStorage.getItem(storageKey);
    const selectedLanguage = availableLanguages.find((language) => language.id === activeLanguageId);
    const fallbackCode = selectedLanguage?.starterCode ?? getLanguageById("javascript").starterCode;

    setCode(savedCode ?? fallbackCode);
    setEditorReady(true);
  }, [user?.uid, problemId, activeLanguageId, availableLanguages]);

  useEffect(() => {
    if (!editorReady || !user?.uid || !problemId) return;
    const storageKey = editorStorageKey(user.uid, problemId, activeLanguageId);
    setSaveState("saving");

    const timeout = setTimeout(() => {
      localStorage.setItem(storageKey, code);
      setSaveState("saved");
    }, 250);

    return () => clearTimeout(timeout);
  }, [code, editorReady, user?.uid, problemId, activeLanguageId]);

  useEffect(() => {
    if (!user?.uid || !problemId) return;
    const inputKey = `workspace-input:${user.uid}:${problemId}`;
    const timeout = setTimeout(() => {
      localStorage.setItem(inputKey, customInput);
    }, 250);

    return () => clearTimeout(timeout);
  }, [customInput, user?.uid, problemId]);

  useEffect(() => {
    if (!user?.uid || !problemId) return;
    const expectedKey = `workspace-expected:${user.uid}:${problemId}`;
    const timeout = setTimeout(() => {
      localStorage.setItem(expectedKey, expectedOutput);
    }, 250);

    return () => clearTimeout(timeout);
  }, [expectedOutput, user?.uid, problemId]);

  const executeCode = useCallback(async (): Promise<ExecuteResult> => {
    const selectedLanguage = currentLanguage;
    const languageAliases = new Set(selectedLanguage.aliases.map((alias) => alias.toLowerCase()));
    languageAliases.add(selectedLanguage.pistonLanguage.toLowerCase());
    languageAliases.add(selectedLanguage.id.toLowerCase());

    const getVersions = (runtimeList: RuntimeRecord[]): string[] => {
      const matches = runtimeList
        .filter((runtime) => {
          const runtimeAliases = [runtime.language, ...(runtime.aliases ?? [])].map((entry) =>
            entry.toLowerCase()
          );
          return runtimeAliases.some((entry) => languageAliases.has(entry));
        })
        .map((runtime) => runtime.version);

      return matches.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    };

    const preferredVersion = resolveRuntimeVersion(selectedLanguage, runtimes);
    let candidateVersions = dedupe([preferredVersion, ...getVersions(runtimes)]);

    // If local runtime cache is empty/stale, refresh live runtimes once and retry with the latest versions.
    if (candidateVersions.length <= 1) {
      for (const endpoint of RUNTIME_ENDPOINTS) {
        try {
          const response = await fetch(endpoint);
          if (!response.ok) continue;
          const liveRuntimes = (await response.json()) as RuntimeRecord[];
          setRuntimes(liveRuntimes);
          candidateVersions = dedupe([preferredVersion, ...getVersions(liveRuntimes)]);
          if (candidateVersions.length > 0) {
            break;
          }
        } catch (_error) {
          // Ignore and continue.
        }
      }
    }

    candidateVersions = dedupe([preferredVersion, selectedLanguage.fallbackVersion, ...candidateVersions]).slice(0, 6);

    let lastError = "Execution request failed.";

    for (const endpoint of EXECUTE_ENDPOINTS) {
      for (const version of candidateVersions) {
        const payload = {
          language: selectedLanguage.pistonLanguage,
          version,
          files: [{ name: filenameForLanguage(selectedLanguage), content: code }],
          stdin: customInput,
          compile_timeout: 10000,
          run_timeout: 4000,
        };

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            lastError = `Run failed (${response.status}) with ${selectedLanguage.label} ${version}: ${toCompactErrorText(
              errorBody
            )}`;

            // Version mismatch is common; try next candidate version.
            if (response.status === 400 || response.status === 404) {
              continue;
            }
            continue;
          }

          const data = (await response.json()) as PistonExecuteResponse;
          const compileOutput = data.compile?.stderr ?? data.compile?.output ?? data.compile?.message ?? "";
          const stdout = data.run?.stdout ?? "";
          const stderr = data.run?.stderr ?? "";
          const runOutput = data.run?.output ?? "";
          const finalOutput = runOutput || [stdout, stderr].filter(Boolean).join("\n");
          const exitCode = typeof data.run?.code === "number" ? data.run.code : null;
          const runtimeLabel =
            typeof data.run?.time === "number" ? `${Math.round(data.run.time * 1000)} ms` : "--";

          return {
            stdout,
            stderr,
            compileOutput,
            exitCode,
            runtimeLabel,
            finalOutput,
          };
        } catch (_error) {
          lastError =
            "Execution service is unreachable from browser right now. Check internet/firewall/ad-blocker, then retry.";
        }
      }
    }

    throw new Error(lastError);
  }, [code, customInput, currentLanguage, runtimes]);

  const evaluateStatus = useCallback(
    (result: ExecuteResult): "Accepted" | "Wrong Answer" | "Runtime Error" | "Compilation Error" | "Submitted" => {
      if (result.compileOutput.trim().length > 0) return "Compilation Error";
      if (result.stderr.trim().length > 0 || (result.exitCode !== null && result.exitCode !== 0)) {
        return "Runtime Error";
      }

      const expected = normalizeTextForCompare(expectedOutput);
      const actual = normalizeTextForCompare(result.finalOutput || result.stdout);

      if (!expected) return "Submitted";
      if (actual === expected) return "Accepted";
      return "Wrong Answer";
    },
    [expectedOutput]
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    setRunError(null);
    setJudgeStatus("Running");
    setCompileText("");
    setStderrText("");
    setOutputText("");
    setRuntimeLabel("--");

    try {
      const result = await executeCode();
      const status = evaluateStatus(result);
      setCompileText(result.compileOutput);
      setStderrText(result.stderr);
      setOutputText(result.finalOutput);
      setRuntimeLabel(result.runtimeLabel);
      setJudgeStatus(status);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to execute code.";
      setJudgeStatus("Runtime Error");
      setRunError(message);
    } finally {
      setRunning(false);
    }
  }, [executeCode, evaluateStatus]);

  const handleSubmit = useCallback(async () => {
    if (!user?.uid || !problem || !problemId) {
      setRunError("You must be signed in to submit.");
      return;
    }

    setSubmitting(true);
    setRunError(null);
    setJudgeStatus("Running");

    try {
      const result = await executeCode();
      const status = evaluateStatus(result);

      setCompileText(result.compileOutput);
      setStderrText(result.stderr);
      setOutputText(result.finalOutput);
      setRuntimeLabel(result.runtimeLabel);
      setJudgeStatus(status);

      await addDoc(collection(db, "submissions"), {
        userId: user.uid,
        userEmail: user.email ?? "",
        problemId: problem.id,
        problemName: problem.problemName,
        problemDifficulty: problem.difficulty,
        language: currentLanguage.label,
        languageId: currentLanguage.id,
        pistonLanguage: currentLanguage.pistonLanguage,
        version: resolveRuntimeVersion(currentLanguage, runtimes),
        code,
        input: customInput,
        expectedOutput,
        output: result.finalOutput,
        stderr: result.stderr,
        compileOutput: result.compileOutput,
        status,
        runtime: result.runtimeLabel,
        submitTime: serverTimestamp(),
        source: "workspace-v1",
      });

      let isNewSolve = false;
      let scoreAwarded = 0;

      await runTransaction(db, async (transaction) => {
        const leaderboardRef = doc(db, "leaderboard", user.uid);
        const leaderboardSnapshot = await transaction.get(leaderboardRef);
        const existingData = leaderboardSnapshot.exists()
          ? (leaderboardSnapshot.data() as Record<string, unknown>)
          : {};

        const solvedProblemIds = Array.isArray(existingData.solvedProblemIds)
          ? existingData.solvedProblemIds.map((entry) => String(entry))
          : [];

        const alreadySolved = solvedProblemIds.includes(problem.id);
        const isAccepted = status === "Accepted";
        isNewSolve = isAccepted && !alreadySolved;

        const nextSolvedProblemIds = isNewSolve
          ? [...solvedProblemIds, problem.id]
          : solvedProblemIds;

        const previousTotalSubmissions = Number(existingData.totalSubmissions ?? 0);
        const previousTotalAccepted = Number(existingData.totalAccepted ?? 0);
        const previousSolvedCount = Number(existingData.solvedCount ?? 0);
        const previousScore = Number(existingData.score ?? 0);
        const previousEasySolved = Number(existingData.easySolved ?? 0);
        const previousMediumSolved = Number(existingData.mediumSolved ?? 0);
        const previousHardSolved = Number(existingData.hardSolved ?? 0);

        const totalSubmissions = previousTotalSubmissions + 1;
        const totalAccepted = previousTotalAccepted + (isAccepted ? 1 : 0);
        const solvedCount = previousSolvedCount + (isNewSolve ? 1 : 0);

        const easySolved =
          previousEasySolved + (isNewSolve && problem.difficulty === "Easy" ? 1 : 0);
        const mediumSolved =
          previousMediumSolved + (isNewSolve && problem.difficulty === "Medium" ? 1 : 0);
        const hardSolved =
          previousHardSolved + (isNewSolve && problem.difficulty === "Hard" ? 1 : 0);

        scoreAwarded = isNewSolve ? SCORE_BY_DIFFICULTY[problem.difficulty] : 0;
        const score = previousScore + scoreAwarded;
        const acceptanceRate = Number(
          ((totalAccepted / Math.max(totalSubmissions, 1)) * 100).toFixed(2)
        );

        transaction.set(
          leaderboardRef,
          {
            uid: user.uid,
            displayName: user.email?.split("@")[0] || "User",
            email: user.email ?? "",
            avatarSeed: user.uid,
            score,
            solvedCount,
            easySolved,
            mediumSolved,
            hardSolved,
            totalSubmissions,
            totalAccepted,
            acceptanceRate,
            solvedProblemIds: nextSolvedProblemIds,
            lastSubmissionStatus: status,
            lastSubmissionProblemId: problem.id,
            lastSubmissionProblemName: problem.problemName,
            lastSubmissionAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...(isAccepted ? { lastAcceptedAt: serverTimestamp() } : {}),
            ...(isNewSolve ? { lastSolvedAt: serverTimestamp() } : {}),
          },
          { merge: true }
        );
      });

      setSubmissionSummary({
        status,
        runtime: result.runtimeLabel,
        language: currentLanguage.label,
        submittedAt: new Date().toLocaleString(),
        isNewSolve,
        scoreAwarded,
      });

      fetchRecentSubmissions();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit solution.";
      setRunError(message);
      setJudgeStatus("Runtime Error");
    } finally {
      setSubmitting(false);
    }
  }, [
    user?.uid,
    user?.email,
    problem,
    problemId,
    executeCode,
    evaluateStatus,
    currentLanguage,
    runtimes,
    code,
    customInput,
    expectedOutput,
    fetchRecentSubmissions,
  ]);

  const handleResetCurrentLanguage = () => {
    setCode(currentLanguage.starterCode);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (event.shiftKey) {
          if (!submitting) handleSubmit();
        } else {
          if (!running) handleRun();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRun, handleSubmit, running, submitting]);

  const handleEditorScroll = () => {
    if (!textareaRef.current || !lineNumbersRef.current) return;
    lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
  };

  if (loadingProblem) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-b-4 border-[color:var(--accent)]" />
          <p className="text-muted">Loading problem workspace...</p>
        </div>
      </div>
    );
  }

  if (problemError || !problem) {
    return (
      <div className="app-shell p-8">
        <div className="mx-auto mt-24 max-w-2xl rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8">
          <h1 className="mb-3 text-2xl font-bold">Unable to open this problem</h1>
          <p className="text-rose-500">{problemError ?? "Unknown error."}</p>
          <Link
            to="/problems"
            className="btn-secondary mt-6 inline-flex"
          >
            Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell pb-28 md:pb-8">
      <div className="mx-auto w-full max-w-[1800px] px-4 pt-6 md:px-6">
        <div className="surface-card mb-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link to="/problems" className="text-sm text-[color:var(--accent)] hover:underline">
                ← Back to problem list
              </Link>
              <h1 className="mt-2 text-2xl font-bold md:text-3xl">{problem.problemName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    problem.difficulty === "Easy"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : problem.difficulty === "Medium"
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                      : "border-rose-400/30 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {problem.difficulty}
                </span>
                {problem.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <button onClick={() => setFocusMode((state) => !state)} className="btn-secondary text-sm">
                {focusMode ? "Exit Focus Mode" : "Focus Mode"}
              </button>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-4 py-2 text-sm sm:text-center">
                Autosave: {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Idle"}
              </div>
            </div>
          </div>
          {runtimeError && <p className="mt-3 text-sm text-amber-500">{runtimeError}</p>}
        </div>

        <div className={`grid gap-4 ${focusMode ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-12"}`}>
          {!focusMode && (
            <aside className="space-y-4 xl:col-span-4">
              <section className="surface-card p-5">
                <h2 className="mb-3 text-lg font-semibold">Problem Statement</h2>
                <p className="whitespace-pre-line text-sm leading-6 text-soft">{problem.description}</p>
              </section>

              <section className="surface-card p-5">
                <h3 className="mb-2 font-semibold text-[color:var(--accent)]">Examples</h3>
                <pre className="overflow-auto whitespace-pre-wrap rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3 text-xs leading-6 text-soft">
                  {problem.examples}
                </pre>
              </section>

              <section className="surface-card p-5">
                <h3 className="mb-2 font-semibold text-[color:var(--accent)]">Constraints</h3>
                <pre className="overflow-auto whitespace-pre-wrap rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3 text-xs leading-6 text-soft">
                  {problem.constraints}
                </pre>
              </section>

              <section className="surface-card p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Recent Submissions</h3>
                {submissionsLoading ? (
                  <p className="text-sm text-muted">Loading submissions...</p>
                ) : recentSubmissions.length === 0 ? (
                  <p className="text-sm text-muted">No submissions for this problem yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentSubmissions.map((submission) => (
                      <div key={submission.id} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              submission.status === "Accepted"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : submission.status === "Wrong Answer"
                                ? "bg-amber-500/20 text-amber-300"
                                : submission.status === "Compilation Error" || submission.status === "Runtime Error"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-cyan-500/20 text-cyan-200"
                            }`}
                          >
                            {submission.status}
                          </span>
                          <span className="text-xs text-muted">{submission.runtime}</span>
                        </div>
                        <div className="mt-2 text-xs text-soft">
                          {submission.language} · {submission.submitTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          )}

          <section className={`space-y-4 ${focusMode ? "col-span-1" : "xl:col-span-8"}`}>
            <div className="surface-card p-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <select
                    value={activeLanguageId}
                    onChange={(event) => setActiveLanguageId(event.target.value)}
                    className="field-select w-full text-sm sm:w-auto"
                  >
                    {availableLanguages.map((language) => (
                      <option key={language.id} value={language.id}>
                        {language.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleResetCurrentLanguage}
                    className="btn-ghost text-xs sm:w-auto"
                  >
                    Reset Template
                  </button>
                </div>

                <div className="hidden gap-2 md:flex md:flex-wrap md:items-center">
                  <button
                    onClick={handleRun}
                    disabled={running || submitting}
                    className="btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {running ? "Running..." : "Run (Ctrl/Cmd + Enter)"}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={running || submitting}
                    className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit (Ctrl/Cmd + Shift + Enter)"}
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0b1020]">
                <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/90 px-4 py-2 text-xs text-slate-400">
                  <span>{currentLanguage.label} Editor</span>
                  <span className="hidden sm:inline">
                    {totalLines} lines · {code.length} chars
                  </span>
                </div>
                <div className="relative grid h-[320px] grid-cols-[46px_minmax(0,1fr)] sm:h-[420px] sm:grid-cols-[56px_minmax(0,1fr)]">
                  <div
                    ref={lineNumbersRef}
                    className="overflow-hidden border-r border-slate-700 bg-[#0d1326] px-1 py-3 text-right font-mono text-[10px] leading-6 text-slate-500 sm:px-2 sm:text-xs"
                  >
                    {lineNumbers.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    onScroll={handleEditorScroll}
                    spellCheck={false}
                    className="h-full w-full resize-none bg-[#0b1020] p-3 font-mono text-sm leading-6 text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="surface-card p-4">
                <div className="mb-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <h3 className="font-semibold">Input Lab</h3>
                  <button
                    onClick={() => {
                      const sample = parseSampleFromExamples(problem.examples);
                      setCustomInput(sample.input);
                      setExpectedOutput(sample.output);
                    }}
                    className="btn-ghost text-xs"
                  >
                    Load sample case
                  </button>
                </div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Custom Input</label>
                <textarea
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  rows={5}
                  className="field-textarea mb-3 font-mono text-sm"
                  placeholder="Enter test input..."
                />
                <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Expected Output (optional)</label>
                <textarea
                  value={expectedOutput}
                  onChange={(event) => setExpectedOutput(event.target.value)}
                  rows={4}
                  className="field-textarea font-mono text-sm"
                  placeholder="Used to estimate Accepted / Wrong Answer status"
                />
              </div>

              <div className="surface-card p-4">
                <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <h3 className="font-semibold">Execution Console</h3>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      judgeStatus === "Accepted"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : judgeStatus === "Wrong Answer"
                        ? "bg-amber-500/20 text-amber-300"
                        : judgeStatus === "Compilation Error" || judgeStatus === "Runtime Error"
                        ? "bg-rose-500/20 text-rose-300"
                        : judgeStatus === "Running"
                        ? "bg-sky-500/20 text-sky-300"
                        : "bg-slate-500/20 text-slate-200"
                    }`}
                  >
                    {judgeStatus}
                  </span>
                </div>
                <div className="mb-2 text-xs text-muted">Runtime: {runtimeLabel}</div>
                {runError && (
                  <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-500">
                    {runError}
                  </div>
                )}
                {compileText && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold uppercase text-rose-500">Compiler</p>
                    <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded bg-black/45 p-2 text-xs text-rose-200">
                      {compileText}
                    </pre>
                  </div>
                )}
                {stderrText && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold uppercase text-amber-500">stderr</p>
                    <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded bg-black/45 p-2 text-xs text-amber-200">
                      {stderrText}
                    </pre>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-emerald-500">stdout</p>
                  <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded bg-black/45 p-2 text-xs text-emerald-200">
                    {outputText || "No output yet. Run your code to see results."}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {!submissionSummary && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)] bg-[color:var(--bg-surface)]/98 px-3 py-2 backdrop-blur md:hidden">
          <div className="mx-auto w-full max-w-[1180px]" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-soft">{judgeStatus}</p>
              <p className="text-xs text-muted">Runtime: {runtimeLabel}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRun}
                disabled={running || submitting}
                className="btn-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {running ? "Running..." : "Run"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={running || submitting}
                className="btn-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {submissionSummary && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-xl p-6 md:p-7">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Submission Result</p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              {submissionSummary.status === "Accepted" ? "Congratulations, accepted!" : `Verdict: ${submissionSummary.status}`}
            </h2>
            <p className="text-muted mt-3">
              {submissionSummary.status === "Accepted"
                ? "Great work. Your solution passed the current checker."
                : "Your submission was saved. Review output details and iterate quickly."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="surface-soft p-3">
                <p className="text-muted text-xs uppercase">Runtime</p>
                <p className="mt-1 text-sm font-semibold">{submissionSummary.runtime}</p>
              </div>
              <div className="surface-soft p-3">
                <p className="text-muted text-xs uppercase">Language</p>
                <p className="mt-1 text-sm font-semibold">{submissionSummary.language}</p>
              </div>
              <div className="surface-soft p-3">
                <p className="text-muted text-xs uppercase">New Solve</p>
                <p className="mt-1 text-sm font-semibold">{submissionSummary.isNewSolve ? "Yes" : "No"}</p>
              </div>
              <div className="surface-soft p-3">
                <p className="text-muted text-xs uppercase">Score</p>
                <p className="mt-1 text-sm font-semibold">+{submissionSummary.scoreAwarded}</p>
              </div>
            </div>

            <p className="text-muted mt-4 text-xs">{submissionSummary.submittedAt}</p>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button onClick={() => setSubmissionSummary(null)} className="btn-secondary w-full text-sm sm:w-auto">
                Close
              </button>
              <button
                onClick={() => {
                  setSubmissionSummary(null);
                  navigate("/activity");
                }}
                className="btn-secondary w-full text-sm sm:w-auto"
              >
                Open activity
              </button>
              <button
                onClick={() => {
                  setSubmissionSummary(null);
                  navigate("/problems");
                }}
                className="btn-primary w-full text-sm sm:w-auto"
              >
                Next problem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
