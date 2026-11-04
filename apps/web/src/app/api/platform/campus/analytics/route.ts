import { NextRequest, NextResponse } from "next/server";
import { getTpoBatchAnalyticsData } from "@/lib/server/b2b-platform";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get("cohortId") || undefined;
    const analytics = await getTpoBatchAnalyticsData(cohortId);
    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    console.error("TPO batch analytics fetch failed:", error);
    return NextResponse.json({ message: "Unable to load TPO batch analytics." }, { status: 500 });
  }
}
