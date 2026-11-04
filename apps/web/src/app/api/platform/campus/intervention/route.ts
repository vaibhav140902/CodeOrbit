import { NextRequest, NextResponse } from "next/server";
import { campusCohortInterventionSchema } from "@codeorbit/schema";
import { saveCampusCohortInterventionData } from "@/lib/server/b2b-platform";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request.headers);
    const payload = campusCohortInterventionSchema.omit({ updatedAtIso: true }).parse(await request.json());
    const saved = await saveCampusCohortInterventionData({
      cohortId: payload.cohortId,
      priorityFocus: payload.priorityFocus,
      note: payload.note || "",
    });
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }
    console.error("Save campus intervention failed:", error);
    return NextResponse.json({ message: "Failed to save intervention." }, { status: 400 });
  }
}
