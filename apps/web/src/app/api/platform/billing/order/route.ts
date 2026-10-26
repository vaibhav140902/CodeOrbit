import { NextRequest, NextResponse } from "next/server";
import { paidBillingPlanIdSchema } from "@codeorbit/schema";
import { z } from "zod";
import { createBillingOrderData, getViewerContextFromHeaders } from "@/lib/server/platform-data";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createOrderInputSchema = z.object({
  planId: paidBillingPlanIdSchema,
});

const getRequestKey = (request: NextRequest) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(`billing-order:${getRequestKey(request)}`, 15, 60_000);
    const body = await request.json().catch(() => null);
    const input = createOrderInputSchema.parse(body);
    const viewer = getViewerContextFromHeaders(request.headers);

    if (!viewer.uid || !viewer.email) {
      return NextResponse.json({ message: "Sign in required to create an order." }, { status: 401 });
    }

    const order = await createBillingOrderData(viewer, input.planId);
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Failed to create billing order." },
      { status: 400 }
    );
  }
}
