import { NextRequest, NextResponse } from "next/server";
import { runCodeInputSchema } from "@codeorbit/schema";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { executeWithJudge0 } from "@/lib/server/judge0";
import { getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "code_execution", viewer);

    const input = runCodeInputSchema.parse(await request.json());
    const result = await executeWithJudge0({
      language: input.language,
      sourceCode: input.submission,
      stdin: input.stdin,
      expectedOutput: input.expectedOutput,
    });

    return NextResponse.json({
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
    return NextResponse.json({ message: (error as Error).message || "Run failed." }, { status: 400 });
  }
}
