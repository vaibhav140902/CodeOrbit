import { NextRequest, NextResponse } from "next/server";
import { getViewerContextFromHeaders, getViewerProfileData } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const viewer = await getViewerContextFromHeaders(request.headers);
  const profile = await getViewerProfileData(viewer);

  if (!profile) {
    return NextResponse.json({ message: "Viewer context unavailable." }, { status: 401 });
  }

  return NextResponse.json({ profile });
}
