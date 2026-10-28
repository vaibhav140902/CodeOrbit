import { NextRequest, NextResponse } from "next/server";
import { getBillingSummaryData, getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const viewer = await getViewerContextFromHeaders(request.headers);
  const summary = await getBillingSummaryData(viewer);
  return NextResponse.json({ summary });
}
