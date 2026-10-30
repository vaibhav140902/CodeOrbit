import { NextRequest, NextResponse } from "next/server";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { getReadinessScoreData, getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "readiness_score", viewer);

    const score = await getReadinessScoreData(viewer);
    return NextResponse.json(score);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    return NextResponse.json(
      { message: (error as Error).message || "Failed to retrieve readiness score." },
      { status: 500 }
    );
  }
}
