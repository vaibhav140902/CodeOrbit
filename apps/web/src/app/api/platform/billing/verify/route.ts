import { NextRequest, NextResponse } from "next/server";
import { paidBillingPlanIdSchema } from "@codeorbit/schema";
import { z } from "zod";
import { getViewerContextFromHeaders, verifyBillingPaymentData } from "@/lib/server/platform-data";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifyInputSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
  planId: paidBillingPlanIdSchema.optional(),
});

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`billing-verify:${getRequestKey(request)}`, 15, 60_000);
    const body = await request.json().catch(() => null);
    const input = verifyInputSchema.parse(body);
    const viewer = getViewerContextFromHeaders(request.headers);

    if (!viewer.uid || !viewer.email) {
      return NextResponse.json({ message: "Sign in required to verify payment." }, { status: 401 });
    }

    const verification = await verifyBillingPaymentData(viewer, input);
    return NextResponse.json(verification);
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Payment verification failed." },
      { status: 400 }
    );
  }
}
