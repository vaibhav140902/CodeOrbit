import { NextRequest, NextResponse } from "next/server";
import { getActivitySummaryData, getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const viewer = await getViewerContextFromHeaders(request.headers);
  const summary = await getActivitySummaryData(viewer);
  return NextResponse.json({ summary });
}
