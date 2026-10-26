import { NextRequest, NextResponse } from "next/server";
import { resumePdfExportInputSchema } from "@codeorbit/schema";
import { AccessControlError, assertPaidFeatureAccess } from "@/lib/server/access-control";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { buildResumePdfBuffer } from "@/lib/server/resume-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`resume-pdf:${getRequestKey(request)}`, 10, 60_000);
    await assertPaidFeatureAccess(request.headers);
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
    console.error("Resume PDF export route failed:", error);
    if (error instanceof AccessControlError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        message: (error as Error).message || "Resume PDF export failed.",
      },
      { status: 400 }
    );
  }
}
