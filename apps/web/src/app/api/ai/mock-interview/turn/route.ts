import { NextRequest, NextResponse } from "next/server";
import { mockInterviewTurnInputSchema } from "@codeorbit/schema";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";
import { generateMockInterviewTurn } from "@/lib/server/mock-interview-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireAuth(request.headers);
    await assertTierRateLimit(request, "mock_interview_turn", viewer);

    const payload = mockInterviewTurnInputSchema.parse(await request.json());
    const turnResponse = await generateMockInterviewTurn(payload);

    return NextResponse.json(turnResponse);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { message: "Sign in required to practice AI Mock Interviews." },
        { status: 401 }
      );
    }
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    console.error("Mock interview turn route failed:", error);
    const message = (error as Error).message || "Turn generation failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
