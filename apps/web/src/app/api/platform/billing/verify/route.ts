import { NextRequest, NextResponse } from "next/server";
import { paidBillingPlanIdSchema } from "@codeorbit/schema";
import { z } from "zod";
import { getViewerContextFromHeaders, verifyBillingPaymentData } from "@/lib/server/platform-data";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifyInputSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
  planId: paidBillingPlanIdSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "billing_action", viewer);

    const body = await request.json().catch(() => null);
    const input = verifyInputSchema.parse(body);

    if (!viewer.uid || !viewer.email) {
      return NextResponse.json({ message: "Sign in required to verify payment." }, { status: 401 });
    }

    const verification = await verifyBillingPaymentData(viewer, input);
    return NextResponse.json(verification);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    return NextResponse.json(
      { message: (error as Error).message || "Payment verification failed." },
      { status: 400 }
    );
  }
}
