import { NextRequest, NextResponse } from "next/server";
import { mockInterviewInputSchema } from "@codeorbit/schema";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";
import { recordInterviewSessionData } from "@/lib/server/platform-data";
import { evaluateMockInterviewWithGemini } from "@/lib/server/mock-interview-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireAuth(request.headers);

    // Enforce tier-aware rate limit (2/day for guest & free, 20/day for pro)
    await assertTierRateLimit(request, "mock_interview", viewer);

    const payload = mockInterviewInputSchema.parse(await request.json());

    // Evaluate with Gemini or deterministic rubric engine
    const evaluation = await evaluateMockInterviewWithGemini(payload);

    // Persist session telemetry to feed candidate readiness score
    void recordInterviewSessionData(viewer, {
      company: payload.company,
      role: payload.role,
      overallScore: evaluation.overallScore,
      transcript: payload.transcript,
      feedback: evaluation as unknown as Record<string, unknown>,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { message: "Sign in required to evaluate AI Mock Interviews." },
        { status: 401 }
      );
    }
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    console.error("Mock interview evaluation route failed:", error);
    const message = (error as Error).message || "Mock interview evaluation failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
