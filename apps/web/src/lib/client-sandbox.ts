/**
 * CodeOrbit Instant 0ms Client-Side Sandbox
 * Executes JavaScript & TypeScript sample runs directly in an isolated browser Worker/Sandbox,
 * offloading server compute and eliminating 2-3s Judge0 network latency.
 */

import { wrapCodeForExecution } from "@/lib/code-harness";

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
  return language === "javascript" || language === "typescript";
}

export async function executeInClientSandbox(
  language: string,
  sourceCode: string,
  stdin: string = "",
  expectedOutput?: string,
  problemId?: string
): Promise<ClientExecutionResult> {
  const startTime = performance.now();

  return new Promise((resolve) => {
    const wrappedCode = problemId ? wrapCodeForExecution(problemId, language, sourceCode) : sourceCode;

    // Strip TypeScript types or declare keywords if TS
    let executableJs = wrappedCode;
    if (language === "typescript") {
      executableJs = executableJs
        .replace(/declare\s+const\s+require\s*:\s*any\s*;?/g, "")
        .replace(/:\s*(string|number|boolean|any|void|number\[\]|string\[\]|Interval\[\])\b/g, "")
        .replace(/type\s+[A-Za-z0-9_]+\s*=\s*[^;]+;/g, "");
    }

    const workerScript = `
      self.onmessage = function(e) {
        const { code, stdin } = e.data;
        const logs = [];
        let errStr = null;

        const fakeFs = {
          readFileSync: function(fd, encoding) {
            return stdin;
          }
        };

        const fakeRequire = function(moduleName) {
          if (moduleName === "fs") return fakeFs;
          throw new Error("Cannot require module '" + moduleName + "' in sandbox");
        };

        const customConsole = {
          log: function(...args) {
            logs.push(args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' '));
          },
          error: function(...args) {
            logs.push(args.join(' '));
          },
          warn: function(...args) {
            logs.push(args.join(' '));
          }
        };

        try {
          const runner = new Function("require", "console", "process", code);
          runner(fakeRequire, customConsole, { stdin: { read: () => stdin } });
        } catch (err) {
          errStr = err && err.message ? err.message : String(err);
        }

        self.postMessage({ logs, error: errStr });
      };
    `;

    let blob: Blob;
    let workerUrl: string;
    let worker: Worker;

    try {
      blob = new Blob([workerScript], { type: "application/javascript" });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
    } catch {
      // If Web Worker instantiation fails (e.g., SSR or strict CSP), reject
      resolve({
        stdout: null,
        stderr: "Client worker initialization unavailable.",
        timeSeconds: "0.001",
        memoryKb: 1024,
        status: "Runtime Error",
        judgeStatus: "Error",
        passed: false,
        message: "Fallback to server runner required.",
      });
      return;
    }

    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        stdout: null,
        stderr: "Time Limit Exceeded (2000ms client-side execution ceiling).",
        timeSeconds: "2.000",
        memoryKb: 2048,
        status: "Time Limit Exceeded",
        judgeStatus: "TLE",
        passed: false,
        message: "Your code exceeded the execution time limit.",
      });
    }, 2000);

    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      const elapsedMs = performance.now() - startTime;
      const timeSeconds = (elapsedMs / 1000).toFixed(3);
      const { logs, error } = event.data;

      if (error) {
        resolve({
          stdout: logs.length ? logs.join("\n") : null,
          stderr: error,
          timeSeconds,
          memoryKb: 2048,
          status: "Runtime Error",
          judgeStatus: "Error",
          passed: false,
          message: `Runtime error: ${error}`,
        });
        return;
      }

      const stdout = logs.join("\n").trim();
      let passed: boolean | null = null;
      let status = "Accepted";

      if (expectedOutput !== undefined && expectedOutput !== null && expectedOutput.trim()) {
        const cleanExpected = expectedOutput.trim();
        passed = stdout === cleanExpected;
        status = passed ? "Accepted" : "Wrong Answer";
      }

      resolve({
        stdout,
        stderr: null,
        timeSeconds,
        memoryKb: 2048,
        status,
        judgeStatus: status,
        passed,
        message: passed ? "All test checks passed!" : status === "Wrong Answer" ? "Output does not match expected output." : "Execution succeeded.",
      });
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve({
        stdout: null,
        stderr: err.message,
        timeSeconds: ((performance.now() - startTime) / 1000).toFixed(3),
        memoryKb: 1024,
        status: "Runtime Error",
        judgeStatus: "Error",
        passed: false,
        message: `Worker error: ${err.message}`,
      });
    };

    worker.postMessage({ code: executableJs, stdin });
  });
}
