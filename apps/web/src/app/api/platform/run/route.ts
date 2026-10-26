import { NextRequest, NextResponse } from "next/server";
import { runCodeInputSchema } from "@codeorbit/schema";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { executeWithJudge0 } from "@/lib/server/judge0";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`platform-run:${getRequestKey(request)}`, 30, 60_000);
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
    return NextResponse.json({ message: (error as Error).message || "Run failed." }, { status: 400 });
  }
}
