import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSummaryData,
  getViewerContextFromHeaders,
  getViewerProfileData,
} from "@/lib/server/platform-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "vaibhavmaurya.1409@gmail.com,test12@gmail.com,vaibhav.test@codeorbit.in")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export async function GET(request: NextRequest) {
  const viewer = await getViewerContextFromHeaders(request.headers);
  if (!viewer.uid || !viewer.email) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const profile = await getViewerProfileData(viewer);
  const isAuthorized =
    profile?.isAdmin === true ||
    profile?.role === "admin" ||
    ADMIN_EMAILS.has(viewer.email.toLowerCase());

  if (!isAuthorized) {
    return NextResponse.json({ message: "Access forbidden. Admin role required." }, { status: 403 });
  }

  const summary = await getAdminSummaryData();
  return NextResponse.json({ summary });
}
