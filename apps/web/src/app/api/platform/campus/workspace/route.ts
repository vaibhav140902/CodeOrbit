import { NextRequest, NextResponse } from "next/server";
import { getCampusBetaWorkspaceData } from "@/lib/server/b2b-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const data = await getCampusBetaWorkspaceData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Campus workspace fetch failed:", error);
    return NextResponse.json({ message: "Unable to load campus workspace." }, { status: 500 });
  }
}
