import { NextRequest, NextResponse } from "next/server";
import { resumePdfExportInputSchema } from "@codeorbit/schema";
import { AccessControlError, assertPaidFeatureAccess } from "@/lib/server/access-control";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { getViewerContextFromHeaders } from "@/lib/server/platform-data";
import { buildResumePdfBuffer } from "@/lib/server/resume-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "resume_export", viewer);
    await assertPaidFeatureAccess(request.headers, viewer);

    const payload = resumePdfExportInputSchema.parse(await request.json());
    const pdf = await buildResumePdfBuffer(payload.draft);
    const fileNameBase =
      payload.fileNameHint?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      payload.draft.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      "codeorbit-resume";

    return NextResponse.json({
      fileName: `${fileNameBase}-ats-resume.pdf`,
      base64Pdf: pdf.toString("base64"),
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    if (error instanceof AccessControlError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Resume PDF export route failed:", error);
    return NextResponse.json(
      {
        message: (error as Error).message || "Resume PDF export failed.",
      },
      { status: 400 }
    );
  }
}
