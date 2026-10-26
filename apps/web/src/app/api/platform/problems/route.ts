import { NextResponse } from "next/server";
import { listProblemsData } from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const problems = await listProblemsData();
  return NextResponse.json({ problems });
}
