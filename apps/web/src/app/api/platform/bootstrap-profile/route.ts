import { NextRequest, NextResponse } from "next/server";
import { bootstrapProfileInputSchema } from "@codeorbit/schema";
import { bootstrapUserProfileData, getViewerContextFromHeaders } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = bootstrapProfileInputSchema.parse(await request.json());
    const viewer = getViewerContextFromHeaders(request.headers);
    const profile = await bootstrapUserProfileData(viewer, input);

    if (!profile) {
      return NextResponse.json({ message: "Viewer context unavailable." }, { status: 401 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Invalid bootstrap payload." },
      { status: 400 }
    );
  }
}
