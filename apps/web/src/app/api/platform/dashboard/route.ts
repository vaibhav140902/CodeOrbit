import { NextRequest, NextResponse } from "next/server";
import { getDashboardSummaryData, getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const summary = await getDashboardSummaryData(getViewerContextFromHeaders(request.headers));
  return NextResponse.json({ summary });
}
