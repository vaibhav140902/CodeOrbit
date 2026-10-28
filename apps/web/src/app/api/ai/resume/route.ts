import { NextRequest, NextResponse } from "next/server";
import { AccessControlError, assertPaidFeatureAccess } from "@/lib/server/access-control";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { getViewerContextFromHeaders } from "@/lib/server/platform-data";
import { generateResumeDraftWithGemini, parseResumeRequest } from "@/lib/server/resume-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`resume-draft:${getRequestKey(request)}`, 8, 60_000);
    const input = await parseResumeRequest(request);
    if (!input.sampleMode) {
      await assertPaidFeatureAccess(request.headers);
    }
    const viewer = await getViewerContextFromHeaders(request.headers);
    const draft = await generateResumeDraftWithGemini(input, viewer);
    return NextResponse.json(draft);
  } catch (error) {
    console.error("Resume draft route failed:", error);
    if (error instanceof AccessControlError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        message: (error as Error).message || "Resume generation failed.",
      },
      { status: 400 }
    );
  }
}
