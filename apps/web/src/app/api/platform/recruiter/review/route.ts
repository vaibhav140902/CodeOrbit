import { NextRequest, NextResponse } from "next/server";
import { recruiterCandidateReviewSchema } from "@codeorbit/schema";
import { saveRecruiterCandidateReviewData } from "@/lib/server/b2b-platform";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const payload = recruiterCandidateReviewSchema.omit({ updatedAtIso: true }).parse(await request.json());
    const saved = await saveRecruiterCandidateReviewData({
      candidateHandle: payload.candidateHandle,
      status: payload.status,
      note: payload.note || "",
    });
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    console.error("Save candidate review failed:", error);
    return NextResponse.json({ message: "Failed to save review." }, { status: 400 });
  }
}
