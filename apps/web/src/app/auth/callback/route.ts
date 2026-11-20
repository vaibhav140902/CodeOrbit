import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  // If OAuth code is provided, redirect to client with query intact for client-side session hydration
  if (code) {
    const redirectUrl = new URL(next, requestUrl.origin);
    redirectUrl.searchParams.set("auth_code", code);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
