import { NextRequest, NextResponse } from "next/server";
import { paidBillingPlanIdSchema } from "@codeorbit/schema";
import { z } from "zod";
import { createBillingOrderData } from "@/lib/server/platform-data";
import { requireAuth, AuthenticationError } from "@/lib/server/auth-guard";
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
    const viewer = await requireAuth(request.headers);
    await assertTierRateLimit(request, "billing_action", viewer);

    const body = await request.json().catch(() => null);
    const input = createOrderInputSchema.parse(body);

    const order = await createBillingOrderData(viewer, input.planId);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Sign in required to create a billing order." }, { status: 401 });
    }
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    return NextResponse.json(
      { message: (error as Error).message || "Failed to create billing order." },
      { status: 400 }
    );
  }
}
