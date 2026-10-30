import { NextRequest, NextResponse } from "next/server";
import { getTpoBatchAnalyticsData } from "@/lib/server/b2b-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get("cohortId") || undefined;
    const analytics = await getTpoBatchAnalyticsData(cohortId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("TPO batch analytics fetch failed:", error);
    return NextResponse.json({ message: "Unable to load TPO batch analytics." }, { status: 500 });
  }
}
