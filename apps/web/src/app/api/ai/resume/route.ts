import { NextRequest, NextResponse } from "next/server";
import { AccessControlError, assertPaidFeatureAccess } from "@/lib/server/access-control";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { getViewerContextFromHeaders } from "@/lib/server/platform-data";
import { generateResumeDraftWithGemini, parseResumeRequest } from "@/lib/server/resume-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "resume_generation", viewer);

    const input = await parseResumeRequest(request);
    if (!input.sampleMode) {
      await assertPaidFeatureAccess(request.headers, viewer);
    }
    const draft = await generateResumeDraftWithGemini(input, viewer);
    return NextResponse.json(draft);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    if (error instanceof AccessControlError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Resume draft route failed:", error);
    return NextResponse.json(
      {
        message: (error as Error).message || "Resume generation failed.",
      },
      { status: 400 }
    );
  }
}
