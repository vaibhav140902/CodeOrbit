import { NextRequest, NextResponse } from "next/server";
import { paidBillingPlanIdSchema } from "@codeorbit/schema";
import { z } from "zod";
import { createBillingOrderData, getViewerContextFromHeaders } from "@/lib/server/platform-data";
import {
  assertTierRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createOrderInputSchema = z.object({
  planId: paidBillingPlanIdSchema,
});

export async function POST(request: NextRequest) {
  try {
    const viewer = await getViewerContextFromHeaders(request.headers);
    await assertTierRateLimit(request, "billing_action", viewer);

    const body = await request.json().catch(() => null);
    const input = createOrderInputSchema.parse(body);

    if (!viewer.uid || !viewer.email) {
      return NextResponse.json({ message: "Sign in required to create an order." }, { status: 401 });
    }

    const order = await createBillingOrderData(viewer, input.planId);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    return NextResponse.json(
      { message: (error as Error).message || "Failed to create billing order." },
      { status: 400 }
    );
  }
}
