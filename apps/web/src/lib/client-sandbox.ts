/**
 * CodeOrbit Instant 0ms Client-Side Sandbox (CSP-Safe)
 * Executes JavaScript, TypeScript, and Python runs directly in an isolated browser Web Worker.
 *
 * Security & Architecture:
 * - 100% CSP compliant: strictly avoids `new Function()` and `eval()` (which violate script-src without unsafe-eval).
 * - JS/TS runs in an ephemeral Blob Worker using `importScripts(URL.createObjectURL(new Blob([code])))`.
 * - Python runs via Pyodide (WASM) in a dedicated, cached Worker loaded from https://cdn.jsdelivr.net/pyodide/.
 */

import { areOutputsEquivalent, wrapCodeForExecution } from "@/lib/code-harness";

export interface ClientExecutionResult {
  stdout: string | null;
  stderr: string | null;
  timeSeconds: string;
  memoryKb: number;
  status: string;
  judgeStatus: string;
  passed: boolean | null;
  message: string;
}

export function canExecuteClientSide(language: string): boolean {
  return language === "javascript" || language === "typescript" || language === "python";
}

// ---------------------------------------------------------------------------
// JavaScript & TypeScript Worker (Blob-based, importScripts execution)
// ---------------------------------------------------------------------------

function stripTypeScriptTypes(code: string): string {
  return code
    .replace(/declare\s+const\s+require\s*:\s*any\s*;?/g, "")
    .replace(/type\s+[A-Za-z0-9_]+\s*=\s*[^;]+;/g, "")
    .replace(/interface\s+[A-Za-z0-9_]+(\s+extends\s+[^{]+)?\s*\{[^}]*\}/g, "")
    .replace(/:\s*(string|number|boolean|any|void|number\[\]|string\[\]|boolean\[\]|number\[\]\[\]|string\[\]\[\]|Interval\[\])\b/g, "")
    .replace(/\bas\s+(string|number|boolean|any|number\[\]|string\[\])\b/g, "");
}

function runJsInWorker(
  executableJs: string,
  stdin: string,
  timeoutMs: number = 2500
): Promise<{ stdout: string | null; stderr: string | null; isTimeout?: boolean }> {
  return new Promise((resolve) => {
    // Worker script does NOT use new Function() or eval().
    // Instead, it sets up sandbox globals (console, require, process) and executes via importScripts on a Blob URL.
    const workerScript = `
      self.onmessage = function(e) {
        const { code, stdin } = e.data;
        const logs = [];
        let errStr = null;
        let blobUrl = null;

        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = function(...args) {
          logs.push(args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' '));
        };
        console.error = function(...args) {
          logs.push(args.join(' '));
        };
        console.warn = function(...args) {
          logs.push(args.join(' '));
        };

        const fakeFs = {
          readFileSync: function() {
            return stdin;
          }
        };

        self.require = function(moduleName) {
          if (moduleName === "fs") return fakeFs;
          throw new Error("Cannot require module '" + moduleName + "' in sandbox");
        };

        self.process = { stdin: { read: () => stdin } };

        try {
          const userBlob = new Blob([code], { type: "application/javascript" });
          blobUrl = URL.createObjectURL(userBlob);
          importScripts(blobUrl);
        } catch (err) {
          errStr = err && err.message ? err.message : String(err);
        } finally {
          if (blobUrl) {
            try { URL.revokeObjectURL(blobUrl); } catch (_) {}
          }
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;
        }

        self.postMessage({ logs, error: errStr });
      };
    `;

    let worker: Worker;
    let workerUrl: string;

    try {
      const blob = new Blob([workerScript], { type: "application/javascript" });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
    } catch (err: any) {
      resolve({
        stdout: null,
        stderr: err?.message || "Worker initialization blocked by browser security policy.",
      });
      return;
    }

    const timer = setTimeout(() => {
      worker.terminate();
      try { URL.revokeObjectURL(workerUrl); } catch (_) {}
      resolve({
        stdout: null,
        stderr: `Time Limit Exceeded (${timeoutMs}ms client-side execution ceiling).`,
        isTimeout: true,
      });
    }, timeoutMs);

    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      try { URL.revokeObjectURL(workerUrl); } catch (_) {}

      const { logs, error } = event.data;
      if (error) {
        resolve({
          stdout: logs && logs.length ? logs.join("\n") : null,
          stderr: error,
        });
        return;
      }

      resolve({
        stdout: logs && logs.length ? logs.join("\n") : "",
        stderr: null,
      });
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      try { URL.revokeObjectURL(workerUrl); } catch (_) {}
      resolve({
        stdout: null,
        stderr: err.message || "Worker runtime error",
      });
    };

    worker.postMessage({ code: executableJs, stdin });
  });
}

// ---------------------------------------------------------------------------
// Python Pyodide WASM Worker (Persistent module-level worker)
// ---------------------------------------------------------------------------

let cachedPyodideWorker: Worker | null = null;
let cachedPyodideWorkerUrl: string | null = null;
let pyodideRequestId = 0;
type PendingPyodideRequest = {
  resolve: (res: { stdout: string | null; stderr: string | null; isTimeout?: boolean }) => void;
  onStatus?: (msg: string) => void;
  timer: any;
};
const pendingPyodideRequests = new Map<number, PendingPyodideRequest>();

function getOrCreatePyodideWorker(): Worker {
  if (cachedPyodideWorker) {
    return cachedPyodideWorker;
  }

  const pyodideWorkerScript = `
    let pyodideInstance = null;
    let initPromise = null;

    async function loadPyodideRuntime() {
      if (pyodideInstance) return pyodideInstance;
      if (!initPromise) {
        initPromise = (async () => {
          self.postMessage({ type: "status", message: "Fetching Python WASM runtime (Pyodide CDN)..." });
          importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
          self.postMessage({ type: "status", message: "Initializing Pyodide WebAssembly engine..." });
          const py = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
          });
          self.postMessage({ type: "status", message: "Python runtime ready." });
          pyodideInstance = py;
          return py;
        })();
      }
      return initPromise;
    }

    self.onmessage = async function(e) {
      const { id, code, stdin } = e.data;

      try {
        const py = await loadPyodideRuntime();
        const logs = [];
        const errLogs = [];

        py.setStdout({ batched: (msg) => logs.push(msg) });
        py.setStderr({ batched: (msg) => errLogs.push(msg) });

        py.globals.set("__codeorbit_stdin__", stdin || "");
        await py.runPythonAsync(
          "import sys, io\\n" +
          "sys.stdin = io.StringIO(__codeorbit_stdin__)\\n"
        );

        await py.runPythonAsync(code);

        self.postMessage({
          id,
          type: "result",
          stdout: logs.join("\\n"),
          stderr: errLogs.length ? errLogs.join("\\n") : null,
          error: null
        });
      } catch (err) {
        self.postMessage({
          id,
          type: "result",
          stdout: null,
          stderr: err && err.message ? err.message : String(err),
          error: err && err.message ? err.message : String(err)
        });
      }
    };
  `;

  const blob = new Blob([pyodideWorkerScript], { type: "application/javascript" });
  cachedPyodideWorkerUrl = URL.createObjectURL(blob);
  cachedPyodideWorker = new Worker(cachedPyodideWorkerUrl);

  cachedPyodideWorker.onmessage = (event) => {
    const data = event.data;
    if (data.type === "status") {
      // Broadcast status message to all active requests
      for (const req of pendingPyodideRequests.values()) {
        req.onStatus?.(data.message);
      }
      return;
    }

    if (data.type === "result" && typeof data.id === "number") {
      const req = pendingPyodideRequests.get(data.id);
      if (req) {
        clearTimeout(req.timer);
        pendingPyodideRequests.delete(data.id);
        req.resolve({
          stdout: data.stdout,
          stderr: data.stderr || data.error,
        });
      }
    }
  };

  cachedPyodideWorker.onerror = (err) => {
    for (const [id, req] of pendingPyodideRequests.entries()) {
      clearTimeout(req.timer);
      req.resolve({
        stdout: null,
        stderr: `Pyodide worker error: ${err.message}`,
      });
      pendingPyodideRequests.delete(id);
    }
  };

  return cachedPyodideWorker;
}

function runPythonInPyodide(
  code: string,
  stdin: string,
  onStatus?: (msg: string) => void,
  timeoutMs: number = 8000
): Promise<{ stdout: string | null; stderr: string | null; isTimeout?: boolean }> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = getOrCreatePyodideWorker();
    } catch (err: any) {
      resolve({
        stdout: null,
        stderr: err?.message || "Pyodide worker initialization failed.",
      });
      return;
    }

    const id = ++pyodideRequestId;

    const timer = setTimeout(() => {
      pendingPyodideRequests.delete(id);
      // Terminate stuck worker on timeout to avoid hanging the browser thread
      if (cachedPyodideWorker) {
        cachedPyodideWorker.terminate();
        cachedPyodideWorker = null;
        if (cachedPyodideWorkerUrl) {
          try { URL.revokeObjectURL(cachedPyodideWorkerUrl); } catch (_) {}
          cachedPyodideWorkerUrl = null;
        }
      }
      resolve({
        stdout: null,
        stderr: `Time Limit Exceeded (${timeoutMs}ms execution ceiling).`,
        isTimeout: true,
      });
    }, timeoutMs);

    pendingPyodideRequests.set(id, { resolve, onStatus, timer });
    worker.postMessage({ id, code, stdin });
  });
}

// ---------------------------------------------------------------------------
// Main Client Sandbox Orchestrator
// ---------------------------------------------------------------------------

export async function executeInClientSandbox(
  language: string,
  sourceCode: string,
  stdin: string = "",
  expectedOutput?: string,
  problemId?: string,
  onStatus?: (msg: string) => void
): Promise<ClientExecutionResult> {
  const startTime = performance.now();

  const wrappedCode = problemId ? wrapCodeForExecution(problemId, language, sourceCode) : sourceCode;

  let execRes: { stdout: string | null; stderr: string | null; isTimeout?: boolean };

  if (language === "python") {
    onStatus?.("Preparing Python Pyodide sandbox...");
    execRes = await runPythonInPyodide(wrappedCode, stdin, onStatus, 10000);
  } else if (language === "javascript" || language === "typescript") {
    let executableJs = wrappedCode;
    if (language === "typescript") {
      executableJs = stripTypeScriptTypes(executableJs);
    }
    execRes = await runJsInWorker(executableJs, stdin, 3000);
  } else {
    return {
      stdout: null,
      stderr: `Language '${language}' is not supported in the instant client sandbox.`,
      timeSeconds: "0.001",
      memoryKb: 1024,
      status: "Runtime Error",
      judgeStatus: "Error",
      passed: false,
      message: "Language requires server-side Judge0 runner.",
    };
  }

  const elapsedMs = performance.now() - startTime;
  const timeSeconds = (elapsedMs / 1000).toFixed(3);

  if (execRes.isTimeout) {
    return {
      stdout: null,
      stderr: execRes.stderr,
      timeSeconds,
      memoryKb: 4096,
      status: "Time Limit Exceeded",
      judgeStatus: "TLE",
      passed: false,
      message: "Your code exceeded the execution time limit.",
    };
  }

  if (execRes.stderr) {
    return {
      stdout: execRes.stdout ? execRes.stdout.trim() : null,
      stderr: execRes.stderr,
      timeSeconds,
      memoryKb: 4096,
      status: "Runtime Error",
      judgeStatus: "Error",
      passed: false,
      message: `Runtime error: ${execRes.stderr}`,
    };
  }

  const stdout = (execRes.stdout || "").trim();
  let passed: boolean | null = null;
  let status = "Accepted";

  if (expectedOutput !== undefined && expectedOutput !== null && expectedOutput.trim()) {
    const cleanExpected = expectedOutput.trim();
    passed = areOutputsEquivalent(stdout, cleanExpected);
    status = passed ? "Accepted" : "Wrong Answer";
  }

  return {
    stdout,
    stderr: null,
    timeSeconds,
    memoryKb: 4096,
    status,
    judgeStatus: status,
    passed,
    message: passed
      ? "All test checks passed!"
      : status === "Wrong Answer"
        ? "Output does not match expected output."
        : "Execution succeeded.",
  };
}
