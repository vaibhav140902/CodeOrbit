import { NextRequest, NextResponse } from "next/server";
import { viewerPreferencesInputSchema } from "@codeorbit/schema";
import { updateViewerPreferencesData } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const input = viewerPreferencesInputSchema.parse(await request.json());
    return NextResponse.json(updateViewerPreferencesData(input));
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message || "Invalid preferences payload." }, { status: 400 });
  }
}
