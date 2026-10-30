import { NextRequest, NextResponse } from "next/server";
import { getRecruiterBetaWorkspaceData } from "@/lib/server/b2b-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const data = await getRecruiterBetaWorkspaceData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Recruiter workspace fetch failed:", error);
    return NextResponse.json({ message: "Unable to load recruiter workspace." }, { status: 500 });
  }
}
