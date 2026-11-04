import { NextRequest, NextResponse } from "next/server";
import { recruiterExportInputSchema } from "@codeorbit/schema";
import { exportRecruiterCandidatesWithDpdp } from "@/lib/server/b2b-platform";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireAuth(request.headers);
    const payload = recruiterExportInputSchema.parse(await request.json());
    const exportResult = await exportRecruiterCandidatesWithDpdp(payload, viewer.email || "recruiter@codeorbit.app");
    return NextResponse.json(exportResult);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Authentication required to export candidate reports." }, { status: 401 });
    }
    console.error("Recruiter export failed:", error);
    return NextResponse.json({ message: "Failed to export candidates." }, { status: 400 });
  }
}
