import { NextRequest, NextResponse } from "next/server";
import { getCampusBetaWorkspaceData } from "@/lib/server/b2b-platform";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const data = await getCampusBetaWorkspaceData();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    console.error("Campus workspace fetch failed:", error);
    return NextResponse.json({ message: "Unable to load campus workspace." }, { status: 500 });
  }
}
