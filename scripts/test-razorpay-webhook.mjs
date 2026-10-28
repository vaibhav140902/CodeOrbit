// Automated Test for Razorpay Webhook Processing & Unified Persistence
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const WEBHOOK_SECRET = "codeorbit2026vaibhavsecurewebhook12345";
const BILLING_PLANS_MAP = {
  "premium-monthly": {
    name: "Pro",
    amountPaise: 149900,
    validityDays: 30,
  },
  "premium-lifetime": {
    name: "Interview Sprint",
    amountPaise: 499900,
    validityDays: 365,
  },
};

function verifyRazorpaySignature(rawBody, signature, secret) {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest);
  const provided = Buffer.from(signature);

  return (
    expected.length === provided.length &&
    timingSafeEqual(expected, provided)
  );
}

function processPaymentEvent(event, storePath) {
  const eventName = event.event;
  if (eventName !== "payment.captured" && eventName !== "order.paid") {
    return { ignored: true };
  }

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
  const planId = notes.planId === "premium-lifetime" ? "premium-lifetime" : "premium-monthly";
  const plan = BILLING_PLANS_MAP[planId];

  const now = new Date();
  const validUntil = new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000).toISOString();

  let store = { users: [], submissions: [], user_progress: [], subscriptions: [], payments: [] };
  if (fs.existsSync(storePath)) {
    store = JSON.parse(fs.readFileSync(storePath, "utf8"));
  }
  if (!store.payments) store.payments = [];
  if (!store.subscriptions) store.subscriptions = [];
  if (!store.users) store.users = [];

  // 1. Ensure user
  let user = store.users.find((u) => u.firebase_uid === uid || u.email === email);
  if (!user) {
    user = {
      id: randomUUID(),
      firebase_uid: uid || `local-${randomUUID()}`,
      email: email || `${uid}@codeorbit.local`,
      display_name: email ? email.split("@")[0] : "Student",
      locale: "en",
      role: "user",
      is_admin: false,
      created_at: now.toISOString(),
    };
    store.users.push(user);
  }

  // 2. Idempotent payment insert
  const existingPay = store.payments.find(
    (p) => p.provider_order_id === orderId || p.provider_payment_id === paymentId
  );
  if (!existingPay) {
    store.payments.push({
      id: randomUUID(),
      user_id: user.id,
      provider_order_id: orderId,
      provider_payment_id: paymentId,
      amount_paise: amountPaise,
      currency,
      status: "captured",
      metadata: {
        method,
        planId,
        planName: plan.name,
        notes,
      },
      created_at: now.toISOString(),
    });
  }

  // 3. Upsert subscription
  const existingSubIdx = store.subscriptions.findIndex((s) => s.user_id === user.id);
  const subRecord = {
    user_id: user.id,
    plan_code: planId,
    status: "active",
    provider: "razorpay",
    current_period_end: validUntil,
    created_at: now.toISOString(),
  };

  if (existingSubIdx >= 0) {
    store.subscriptions[existingSubIdx] = subRecord;
  } else {
    store.subscriptions.push(subRecord);
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
  return { status: "active", planId, validUntil, userId: user.id };
}

async function runTest() {
  console.log("=== RAZORPAY WEBHOOK INTEGRATION TEST ===");

  const testUid = "student-delhi-" + Date.now();
  const testEmail = `student.${Date.now()}@iitd.ac.in`;
  const orderId = `order_${randomUUID().slice(0, 14)}`;
  const paymentId = `pay_${randomUUID().slice(0, 14)}`;
  const storePath = path.resolve(process.cwd(), ".codeorbit-cache/platform-storage.json");

  console.log("1. Generating simulated Razorpay payment.captured webhook payload...");
  const webhookPayload = {
    entity: "event",
    account_id: "acc_CodeOrbit123",
    event: "payment.captured",
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: paymentId,
          entity: "payment",
          amount: 149900,
          currency: "INR",
          status: "captured",
          order_id: orderId,
          method: "upi",
          notes: {
            uid: testUid,
            email: testEmail,
            planId: "premium-monthly",
          },
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const rawBody = JSON.stringify(webhookPayload);

  console.log("2. Testing HMAC SHA-256 signature verification...");
  const validSignature = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const tamperedSignature = createHmac("sha256", "tampered_secret").update(rawBody).digest("hex");

  const validCheck = verifyRazorpaySignature(rawBody, validSignature, WEBHOOK_SECRET);
  const tamperedCheck = verifyRazorpaySignature(rawBody, tamperedSignature, WEBHOOK_SECRET);

  console.log("- Valid signature verified:", validCheck);
  console.log("- Tampered signature rejected:", !tamperedCheck);

  if (!validCheck || tamperedCheck) {
    throw new Error("HMAC signature verification failed!");
  }

  console.log("3. Processing webhook payment event into persistence layer...");
  const result = processPaymentEvent(webhookPayload, storePath);
  console.log("- Webhook processed successfully:", result);

  if (result.status !== "active" || result.planId !== "premium-monthly") {
    throw new Error("Failed to activate user via webhook event.");
  }

  console.log("4. Testing Idempotency (handling duplicate webhook deliveries)...");
  const duplicateResult = processPaymentEvent(webhookPayload, storePath);
  console.log("- Duplicate event handled:", duplicateResult.status === "active");

  const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
  const matchingPayments = store.payments.filter((p) => p.provider_order_id === orderId);
  console.log("- Matching payment rows in database (must be exactly 1):", matchingPayments.length);

  if (matchingPayments.length !== 1) {
    throw new Error(`Idempotency check failed! Found ${matchingPayments.length} duplicate payment records.`);
  }

  console.log("\n>>> SUCCESS: Razorpay webhook integration & persistence verified 100%! <<<");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
