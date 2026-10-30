import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runCodeInputSchema } from "@codeorbit/schema";
import { z } from "zod";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { executeWithJudge0 } from "@/lib/server/judge0";
import { getViewerContextFromHeaders, recordSubmissionData } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submitSchema = runCodeInputSchema.extend({
  problemId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "code_execution", viewer);

    const input = submitSchema.parse(await request.json());
    const result = await executeWithJudge0({
      language: input.language,
      sourceCode: input.submission,
      stdin: input.stdin,
      expectedOutput: input.expectedOutput,
    });

    let persistedId: string | null = null;
    if (viewer.uid || viewer.email) {
      const persisted = await recordSubmissionData(viewer, {
        problemId: input.problemId,
        language: input.language,
        status: result.status,
        runtimeMs: result.timeSeconds ? parseFloat(result.timeSeconds) * 1000 : null,
        memoryKb: result.memoryKb,
        sourceCode: input.submission,
        passed: result.passed ?? undefined,
      });
      persistedId = persisted?.id ?? null;
    }

    return NextResponse.json({
      id: persistedId ?? randomUUID(),
      message: result.message,
      status: result.status,
      judgeStatus: result.judgeStatus,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      timeSeconds: result.timeSeconds,
      memoryKb: result.memoryKb,
      passed: result.passed,
      expectedOutput: result.expectedOutput,
      language: result.language,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message || "Submit failed." }, { status: 400 });
  }
}
