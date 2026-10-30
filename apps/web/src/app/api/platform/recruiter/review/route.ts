import { NextRequest, NextResponse } from "next/server";
import { recruiterCandidateReviewSchema } from "@codeorbit/schema";
import { saveRecruiterCandidateReviewData } from "@/lib/server/b2b-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = recruiterCandidateReviewSchema.omit({ updatedAtIso: true }).parse(await request.json());
    const saved = await saveRecruiterCandidateReviewData({
      candidateHandle: payload.candidateHandle,
      status: payload.status,
      note: payload.note || "",
    });
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Save candidate review failed:", error);
    return NextResponse.json({ message: "Failed to save review." }, { status: 400 });
  }
}
