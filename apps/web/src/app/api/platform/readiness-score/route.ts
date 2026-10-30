import { NextRequest, NextResponse } from "next/server";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { getReadinessScoreData, getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function GET(request: NextRequest) {
  try {
    assertRateLimit(`platform-readiness:${getRequestKey(request)}`, 30, 60_000);
    const viewer = await getViewerContextFromHeaders(request.headers);
    const score = await getReadinessScoreData(viewer);

    return NextResponse.json(score);
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Failed to retrieve readiness score." },
      { status: 500 }
    );
  }
}
