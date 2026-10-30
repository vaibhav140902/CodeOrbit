import { NextRequest, NextResponse } from "next/server";
import { recruiterExportInputSchema } from "@codeorbit/schema";
import { exportRecruiterCandidatesWithDpdp } from "@/lib/server/b2b-platform";
import { getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    const payload = recruiterExportInputSchema.parse(await request.json());
    const exportResult = await exportRecruiterCandidatesWithDpdp(payload, viewer.email || "recruiter@codeorbit.app");
    return NextResponse.json(exportResult);
  } catch (error) {
    console.error("Recruiter export failed:", error);
    return NextResponse.json({ message: "Failed to export candidates." }, { status: 400 });
  }
}
