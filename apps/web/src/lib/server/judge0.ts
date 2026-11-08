const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

const JUDGE0_URL = trimTrailingSlash(process.env.JUDGE0_URL ?? "https://ce.judge0.com");
const JUDGE0_KEY = (process.env.JUDGE0_KEY ?? "").trim();
const JUDGE0_CPU_TIME_LIMIT_SECONDS = Number(process.env.JUDGE0_CPU_TIME_LIMIT_SECONDS ?? "2");
const JUDGE0_WALL_TIME_LIMIT_SECONDS = Number(process.env.JUDGE0_WALL_TIME_LIMIT_SECONDS ?? "5");
const JUDGE0_MEMORY_LIMIT_KB = Number(process.env.JUDGE0_MEMORY_LIMIT_KB ?? "262144");
const JUDGE0_ENABLE_NETWORK = process.env.JUDGE0_ENABLE_NETWORK === "true";
const JUDGE0_MAX_POLLS = Number(process.env.JUDGE0_MAX_POLLS ?? "12");
const JUDGE0_POLL_INTERVAL_MS = Number(process.env.JUDGE0_POLL_INTERVAL_MS ?? "1000");

// Modern LTS and latest stable Judge0 CE runtimes
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  javascript: 102, // Node.js 22.08.0 (Modern ES2024+)
  typescript: 101, // TypeScript 5.6.2
  python: 100,     // Python 3.12.5 (Supports PEP 585 generics, match/case, f-string enhancements)
  java: 91,        // Java JDK 17.0.6 LTS
  cpp: 105,        // C++ GCC 14.1.0
  c: 104,          // C GCC 14.1.0
};

// Fallback legacy language IDs if running on older self-hosted Judge0 CE instances
const JUDGE0_FALLBACK_LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

const pendingStatusIds = new Set([1, 2]);

interface Judge0SubmissionTokenResponse {
  token: string;
}

interface Judge0SubmissionResultResponse {
  token?: string;
  status?: { id?: number; description?: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | number | null;
  memory?: string | number | null;
}

export interface Judge0ExecutionInput {
  language: string;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
}

export interface Judge0ExecutionResult {
  judgeToken: string;
  status: string;
  judgeStatus: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  message: string;
  timeSeconds: string | null;
  memoryKb: number | null;
  passed: boolean | null;
  expectedOutput: string | null;
  language: string;
}

const sleep = async (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const normalizeText = (value: string | null | undefined) =>
  typeof value === "string" ? value.replace(/\r\n/g, "\n").trimEnd() : null;

const parseNumber = (value: string | number | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const buildHeaders = () => ({
  "Content-Type": "application/json",
  ...(JUDGE0_KEY ? { "X-Auth-Token": JUDGE0_KEY } : {}),
});

const judge0Fetch = async <T>(path: string, init: RequestInit) => {
  const response = await fetch(`${JUDGE0_URL}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Judge0 request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
};

const toSubmissionStatus = (statusId: number | undefined) => {
  switch (statusId) {
    case 1:
    case 2:
      return "PENDING";
    case 3:
      return "Accepted";
    case 4:
      return "Wrong Answer";
    case 5:
      return "Time Limit Exceeded";
    case 6:
      return "Compilation Error";
    case 13:
      return "Internal Error";
    default:
      return "Runtime Error";
  }
};

const buildMessage = (input: {
  statusId: number | undefined;
  judgeStatus: string;
  passed: boolean | null;
  compileOutput: string | null;
  stderr: string | null;
  stdout: string | null;
}) => {
  if (input.statusId === 3 && input.passed === true) {
    return "All provided checks passed in the isolated Judge0 runner.";
  }
  if (input.statusId === 3) {
    return "Code executed successfully in the isolated Judge0 runner.";
  }
  if (input.statusId === 4) {
    return "Execution finished, but stdout did not match the expected output.";
  }
  if (input.statusId === 6) {
    return input.compileOutput || "Compilation failed in the isolated Judge0 runner.";
  }
  if (input.stderr) {
    return input.stderr;
  }
  if (input.stdout && input.statusId && input.statusId > 3) {
    return input.stdout;
  }
  return `${input.judgeStatus} in the isolated Judge0 runner.`;
};

export const executeWithJudge0 = async (input: Judge0ExecutionInput): Promise<Judge0ExecutionResult> => {
  let languageId = JUDGE0_LANGUAGE_IDS[input.language] ?? JUDGE0_FALLBACK_LANGUAGE_IDS[input.language];
  const expectedOutput =
    typeof input.expectedOutput === "string" && input.expectedOutput.trim() ? input.expectedOutput : undefined;

  if (!languageId) {
    throw new Error(`Language "${input.language}" is not supported by the Judge0 runner.`);
  }

  let createResponse: Judge0SubmissionTokenResponse;
  try {
    createResponse = await judge0Fetch<Judge0SubmissionTokenResponse>("/submissions?base64_encoded=false&wait=false", {
      method: "POST",
      body: JSON.stringify({
        source_code: input.sourceCode,
        language_id: languageId,
        stdin: input.stdin ?? "",
        expected_output: expectedOutput,
        cpu_time_limit: JUDGE0_CPU_TIME_LIMIT_SECONDS,
        wall_time_limit: JUDGE0_WALL_TIME_LIMIT_SECONDS,
        memory_limit: JUDGE0_MEMORY_LIMIT_KB,
        enable_network: JUDGE0_ENABLE_NETWORK,
        number_of_runs: 1,
      }),
    });
  } catch (err) {
    // If modern language ID is not found on older server, retry with fallback ID
    const fallbackId = JUDGE0_FALLBACK_LANGUAGE_IDS[input.language];
    if (fallbackId && fallbackId !== languageId) {
      languageId = fallbackId;
      createResponse = await judge0Fetch<Judge0SubmissionTokenResponse>("/submissions?base64_encoded=false&wait=false", {
        method: "POST",
        body: JSON.stringify({
          source_code: input.sourceCode,
          language_id: fallbackId,
          stdin: input.stdin ?? "",
          expected_output: expectedOutput,
          cpu_time_limit: JUDGE0_CPU_TIME_LIMIT_SECONDS,
          wall_time_limit: JUDGE0_WALL_TIME_LIMIT_SECONDS,
          memory_limit: JUDGE0_MEMORY_LIMIT_KB,
          enable_network: JUDGE0_ENABLE_NETWORK,
          number_of_runs: 1,
        }),
      });
    } else {
      throw err;
    }
  }

  if (!createResponse.token) {
    throw new Error("Judge0 did not return a submission token.");
  }

  let lastResult: Judge0SubmissionResultResponse | null = null;
  for (let attempt = 0; attempt < JUDGE0_MAX_POLLS; attempt += 1) {
    if (attempt > 0) {
      await sleep(JUDGE0_POLL_INTERVAL_MS);
    }

    lastResult = await judge0Fetch<Judge0SubmissionResultResponse>(
      `/submissions/${createResponse.token}?base64_encoded=false&fields=token,status,stdout,stderr,compile_output,time,memory`,
      { method: "GET" }
    );

    if (!pendingStatusIds.has(lastResult.status?.id ?? 1)) {
      break;
    }
  }

  const judgeStatus = String(lastResult?.status?.description ?? "Processing");
  const stdout = normalizeText(lastResult?.stdout);
  const stderr = normalizeText(lastResult?.stderr);
  const compileOutput = normalizeText(lastResult?.compile_output);
  const normalizedExpectedOutput = expectedOutput ? normalizeText(expectedOutput) : null;
  const passed = normalizedExpectedOutput === null ? null : lastResult?.status?.id === 3;

  return {
    judgeToken: createResponse.token,
    status: toSubmissionStatus(lastResult?.status?.id),
    judgeStatus,
    stdout,
    stderr,
    compileOutput,
    message: buildMessage({
      statusId: lastResult?.status?.id,
      judgeStatus,
      passed,
      compileOutput,
      stderr,
      stdout,
    }),
    timeSeconds:
      typeof lastResult?.time === "string" || typeof lastResult?.time === "number"
        ? String(lastResult.time)
        : null,
    memoryKb: parseNumber(lastResult?.memory),
    passed,
    expectedOutput: normalizedExpectedOutput,
    language: input.language,
  };
};
