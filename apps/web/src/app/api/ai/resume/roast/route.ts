import { NextRequest, NextResponse } from "next/server";
import { resumeRoasterInputSchema } from "@codeorbit/schema";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { getViewerContextFromHeaders } from "@/lib/server/platform-data";
import { roastResumeWithGemini } from "@/lib/server/resume-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "resume_generation", viewer);

    const raw = await request.json().catch(() => null);
    const input = resumeRoasterInputSchema.parse(raw);

    const result = await roastResumeWithGemini(input, viewer);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    console.error("Resume roast API error:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Resume roast failed." },
      { status: 400 }
    );
  }
}
