import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";
import { purgeUserDataByDpdp } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireAuth(request.headers);
    const result = await purgeUserDataByDpdp(viewer);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Authentication required to request data erasure." }, { status: 401 });
    }
    console.error("DPDP Account deletion failed:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Data erasure request failed." },
      { status: 500 }
    );
  }
}
