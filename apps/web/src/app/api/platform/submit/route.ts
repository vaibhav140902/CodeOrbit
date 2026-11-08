import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { executeWithJudge0, Judge0ExecutionResult } from "@/lib/server/judge0";
import { wrapCodeForExecution } from "@/lib/server/code-harness";
import { recordSubmissionData } from "@/lib/server/platform-data";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";
import { getProblemTestSuite } from "@/lib/server/problem-test-suites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submitSchema = z.object({
  problemId: z.string().min(1),
  language: z.string().min(1),
  submission: z.string().min(1).max(50_000),
  // Optional client fields are accepted for schema compatibility but STRIPPED/IGNORED
  // to eliminate client-side test-spoofing vulnerabilities.
  stdin: z.string().max(20_000).optional(),
  expectedOutput: z.string().max(20_000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireAuth(request.headers);
    await assertTierRateLimit(request, "code_execution", viewer);

    const input = submitSchema.parse(await request.json());
    const sourceCode = wrapCodeForExecution(input.problemId, input.language, input.submission);
    const testCases = getProblemTestSuite(input.problemId);

    let finalResult: Judge0ExecutionResult;

    if (testCases.length > 0) {
      // 1. Run the public/sample test case
      const sampleCase = testCases.find((tc) => !tc.isHidden) || testCases[0];
      const sampleResult = await executeWithJudge0({
        language: input.language,
        sourceCode,
        stdin: sampleCase.stdin,
        expectedOutput: sampleCase.expectedOutput,
      });

      if (sampleResult.status !== "Accepted" || !sampleResult.passed) {
        // Failed on sample case
        finalResult = {
          ...sampleResult,
          message: sampleResult.compileOutput
            ? "Compilation failed"
            : sampleResult.stderr
            ? "Runtime error"
            : `Failed on test case "${sampleCase.name}".`,
        };
      } else {
        // 2. Sample passed: evaluate against hidden test cases
        const hiddenCases = testCases.filter((tc) => tc.isHidden);
        let allHiddenPassed = true;
        let failingHiddenResult: Judge0ExecutionResult | null = null;

        for (const hiddenCase of hiddenCases) {
          const hiddenResult = await executeWithJudge0({
            language: input.language,
            sourceCode,
            stdin: hiddenCase.stdin,
            expectedOutput: hiddenCase.expectedOutput,
          });

          if (hiddenResult.status !== "Accepted" || !hiddenResult.passed) {
            allHiddenPassed = false;
            failingHiddenResult = hiddenResult;
            break;
          }
        }

        if (allHiddenPassed) {
          finalResult = {
            ...sampleResult,
            status: "Accepted",
            judgeStatus: "Accepted",
            passed: true,
            message: `All ${testCases.length} test cases passed (including hidden evaluation suite).`,
          };
        } else {
          finalResult = {
            ...failingHiddenResult!,
            status: "Wrong Answer",
            judgeStatus: "Wrong Answer",
            passed: false,
            // Do NOT leak hidden test stdin/expectedOutput to client
            stdout: null,
            expectedOutput: null,
            message: "Failed on hidden test case. Review edge cases and time/space constraints.",
          };
        }
      }
    } else {
      // Fallback for custom or unseeded problems
      finalResult = await executeWithJudge0({
        language: input.language,
        sourceCode: input.submission,
        stdin: input.stdin,
        expectedOutput: input.expectedOutput,
      });
    }

    let persistedId: string | null = null;
    if (viewer.uid || viewer.email) {
      const persisted = await recordSubmissionData(viewer, {
        problemId: input.problemId,
        language: input.language,
        status: finalResult.status,
        runtimeMs: finalResult.timeSeconds ? parseFloat(finalResult.timeSeconds) * 1000 : null,
        memoryKb: finalResult.memoryKb,
        sourceCode: input.submission,
        passed: finalResult.passed ?? undefined,
      });
      persistedId = persisted?.id ?? null;
    }

    return NextResponse.json({
      id: persistedId ?? randomUUID(),
      message: finalResult.message,
      status: finalResult.status,
      judgeStatus: finalResult.judgeStatus,
      stdout: finalResult.stdout,
      stderr: finalResult.stderr,
      compileOutput: finalResult.compileOutput,
      timeSeconds: finalResult.timeSeconds,
      memoryKb: finalResult.memoryKb,
      passed: finalResult.passed,
      expectedOutput: finalResult.expectedOutput,
      language: finalResult.language,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { message: "Sign in required to submit solutions to your candidate proof record." },
        { status: 401 }
      );
    }
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message || "Submit failed." }, { status: 400 });
  }
}
