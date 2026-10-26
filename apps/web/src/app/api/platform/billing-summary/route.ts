import { NextRequest, NextResponse } from "next/server";
import { getBillingSummaryData, getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const summary = await getBillingSummaryData(getViewerContextFromHeaders(request.headers));
  return NextResponse.json({ summary });
}
