import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processSuccessfulPaymentData } from "@/lib/server/platform-data";
import { type PaidBillingPlanId } from "@codeorbit/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAZORPAY_WEBHOOK_SECRET = (process.env.RAZORPAY_WEBHOOK_SECRET ?? "").trim();

export async function POST(request: NextRequest) {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("Razorpay webhook rejected because RAZORPAY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ message: "Razorpay webhook is not configured." }, { status: 503 });
    }

    const signature = request.headers.get("x-razorpay-signature") || "";
    if (!signature) {
      return NextResponse.json({ message: "Missing Razorpay webhook signature." }, { status: 400 });
    }

    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ message: "Empty webhook payload." }, { status: 400 });
    }

    // Cryptographic HMAC-SHA256 signature verification
    const digest = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const expected = Buffer.from(digest);
    const provided = Buffer.from(signature);

    const isSignatureValid =
      expected.length === provided.length &&
      timingSafeEqual(expected as unknown as Uint8Array, provided as unknown as Uint8Array);

    if (!isSignatureValid) {
      console.warn("Security Alert: Invalid Razorpay webhook signature rejected.");
      return NextResponse.json({ message: "Invalid cryptographic signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            currency?: string;
            status?: string;
            method?: string;
            notes?: Record<string, string>;
          };
        };
        order?: {
          entity?: {
            id?: string;
            amount?: number;
            currency?: string;
            status?: string;
            notes?: Record<string, string>;
          };
        };
      };
    };

    const eventName = event.event ?? "unknown";
    console.log(`Razorpay webhook received: [${eventName}]`);

    // Handle payment.captured or order.paid
    if (eventName === "payment.captured" || eventName === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id || `webhook-${orderId}`;
      const amountPaise = paymentEntity?.amount || orderEntity?.amount || 0;
      const currency = paymentEntity?.currency || orderEntity?.currency || "INR";
      const method = paymentEntity?.method || "unknown";

      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const uid = notes.uid;
      const email = notes.email;
      const rawPlanId = notes.planId;
      const planId: PaidBillingPlanId =
        rawPlanId === "premium-lifetime" ? "premium-lifetime" : "premium-monthly";

      if (orderId && (uid || email)) {
        await processSuccessfulPaymentData({
          orderId,
          paymentId,
          planId,
          amountPaise,
          currency,
          uid,
          email,
          method,
          metadata: {
            webhookEvent: eventName,
            notes,
          },
        });
        console.log(`Successfully processed [${eventName}] for user: ${email || uid}`);
      } else {
        console.warn(`Webhook notice: missing orderId or user notes in event [${eventName}]`);
      }
    }

    return NextResponse.json({ received: true, event: eventName });
  } catch (error) {
    console.error("Razorpay webhook handler error:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Webhook processing failed." },
      { status: 500 }
    );
  }
}
