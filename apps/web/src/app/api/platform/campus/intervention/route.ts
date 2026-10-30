import { NextRequest, NextResponse } from "next/server";
import { campusCohortInterventionSchema } from "@codeorbit/schema";
import { saveCampusCohortInterventionData } from "@/lib/server/b2b-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = campusCohortInterventionSchema.omit({ updatedAtIso: true }).parse(await request.json());
    const saved = await saveCampusCohortInterventionData({
      cohortId: payload.cohortId,
      priorityFocus: payload.priorityFocus,
      note: payload.note || "",
    });
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Save campus intervention failed:", error);
    return NextResponse.json({ message: "Failed to save intervention." }, { status: 400 });
  }
}
