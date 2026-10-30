import { NextRequest, NextResponse } from "next/server";
import { getRecruiterBetaWorkspaceData, verifyProofBadgeIntegrity } from "@/lib/server/b2b-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await context.params;
    const { candidates } = await getRecruiterBetaWorkspaceData();
    const candidate = candidates.find((c) => c.handle === handle);

    if (!candidate || !candidate.verifiedBadge) {
      return NextResponse.json(
        { message: "Candidate proof badge not found or unverified." },
        { status: 404 }
      );
    }

    const isValid = verifyProofBadgeIntegrity(candidate.verifiedBadge);

    return NextResponse.json({
      badge: candidate.verifiedBadge,
      cryptographicallyValid: isValid,
      verifiedCandidate: {
        handle: candidate.handle,
        fullName: candidate.fullName,
        headline: candidate.headline,
        readinessScore: candidate.readinessScore,
        targetRoles: candidate.targetRoleSlugs,
      },
    });
  } catch (error) {
    console.error("Proof badge verification failed:", error);
    return NextResponse.json({ message: "Verification check failed." }, { status: 500 });
  }
}
