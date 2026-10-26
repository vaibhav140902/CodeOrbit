import { NextRequest, NextResponse } from "next/server";
import { getProblemDetailData } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ problemId: string }> }
) {
  const { problemId } = await context.params;
  const problem = await getProblemDetailData(problemId);

  if (!problem) {
    return NextResponse.json({ message: "Problem not found." }, { status: 404 });
  }

  return NextResponse.json({ problem });
}
