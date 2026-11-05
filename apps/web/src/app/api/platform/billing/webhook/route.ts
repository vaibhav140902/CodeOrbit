import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  processSubscriptionCancellationData,
  processSuccessfulPaymentData,
} from "@/lib/server/platform-data";
import { type PaidBillingPlanId } from "@codeorbit/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAZORPAY_WEBHOOK_SECRET = (process.env.RAZORPAY_WEBHOOK_SECRET ?? "").trim();

// In-memory replay & duplicate event cache (x-razorpay-event-id idempotency)
const PROCESSED_EVENT_IDS = new Set<string>();
const MAX_EVENT_CACHE = 5000;

function recordProcessedEventId(eventId: string): boolean {
  if (PROCESSED_EVENT_IDS.has(eventId)) {
    return false;
  }
  if (PROCESSED_EVENT_IDS.size >= MAX_EVENT_CACHE) {
    const oldest = PROCESSED_EVENT_IDS.values().next().value;
    if (oldest) PROCESSED_EVENT_IDS.delete(oldest);
  }
  PROCESSED_EVENT_IDS.add(eventId);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const eventIdHeader = request.headers.get("x-razorpay-event-id");
    if (eventIdHeader && !recordProcessedEventId(eventIdHeader)) {
      console.log(`Razorpay webhook duplicate event ignored (idempotent): [${eventIdHeader}]`);
      return NextResponse.json({ received: true, duplicate: true, eventId: eventIdHeader });
    }

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
            email?: string;
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
        subscription?: {
          entity?: {
            id?: string;
            plan_id?: string;
            status?: string;
            current_end?: number;
            notes?: Record<string, string>;
          };
        };
        refund?: {
          entity?: {
            id?: string;
            payment_id?: string;
            amount?: number;
            status?: string;
            notes?: Record<string, string>;
          };
        };
      };
    };

    const eventName = event.event ?? "unknown";
    console.log(`Razorpay webhook received: [${eventName}]`);

    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const subscriptionEntity = event.payload?.subscription?.entity;
    const refundEntity = event.payload?.refund?.entity;

    const notes =
      paymentEntity?.notes ||
      orderEntity?.notes ||
      subscriptionEntity?.notes ||
      refundEntity?.notes ||
      {};

    const uid = notes.uid || notes.userId || notes.user_id;
    const email =
      notes.email ||
      notes.customerEmail ||
      notes.customer_email ||
      paymentEntity?.email;

    // 1. Activation & Renewal Events
    if (
      eventName === "payment.captured" ||
      eventName === "order.paid" ||
      eventName === "subscription.activated" ||
      eventName === "subscription.charged"
    ) {
      const orderId = paymentEntity?.order_id || orderEntity?.id || subscriptionEntity?.id;
      const paymentId = paymentEntity?.id || `sub-charge-${orderId}`;
      const amountPaise = paymentEntity?.amount || orderEntity?.amount || 0;
      const currency = paymentEntity?.currency || orderEntity?.currency || "INR";
      const method = paymentEntity?.method || "unknown";

      const rawPlanId = notes.planId || notes.plan_id;
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

    // 2. Cancellation & Refund Events
    if (
      eventName === "payment.refunded" ||
      eventName === "refund.processed" ||
      eventName === "subscription.cancelled" ||
      eventName === "subscription.halted"
    ) {
      const isRefund = eventName.includes("refund");
      const status = isRefund ? "refunded" : "cancelled";
      const orderId = paymentEntity?.order_id || refundEntity?.payment_id || subscriptionEntity?.id;
      const paymentId = refundEntity?.id || paymentEntity?.id;

      if (uid || email) {
        await processSubscriptionCancellationData({
          orderId,
          paymentId,
          uid,
          email,
          status,
          reason: `Razorpay webhook event: ${eventName}`,
        });
        console.log(`Successfully recorded subscription [${status}] for user: ${email || uid}`);
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
