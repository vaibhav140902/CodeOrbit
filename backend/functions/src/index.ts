import { createHmac, timingSafeEqual } from "crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { SUPPORTED_LANGUAGES } from "./utils";

initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 20, region: "asia-south2" });

const MAX_DAILY_FREE_USERS = Number(process.env.MAX_DAILY_FREE_USERS ?? "100");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

type PaidPlanId = "starter-monthly" | "pro-monthly" | "pro-yearly";
type BillingPlanId = "daily-free" | PaidPlanId;

interface BillingPlanConfig {
  id: PaidPlanId;
  name: string;
  amountInPaise: number;
  validityDays: number;
}

const BILLING_PLANS: Record<PaidPlanId, BillingPlanConfig> = {
  "starter-monthly": {
    id: "starter-monthly",
    name: "Starter Monthly",
    amountInPaise: 14900,
    validityDays: 30,
  },
  "pro-monthly": {
    id: "pro-monthly",
    name: "Pro Monthly",
    amountInPaise: 24900,
    validityDays: 30,
  },
  "pro-yearly": {
    id: "pro-yearly",
    name: "Pro Annual",
    amountInPaise: 199900,
    validityDays: 365,
  },
};

const toUtcDateKey = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const endOfUtcDay = (date: Date): Timestamp => {
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
  return Timestamp.fromDate(end);
};

const requireAuthUid = (auth: { uid?: string } | null | undefined): string => {
  const uid = auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  return uid;
};

const ensureRazorpayConfigured = () => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new HttpsError(
      "failed-precondition",
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/functions/.env."
    );
  }
};

const isPaidPlan = (value: string): value is PaidPlanId =>
  value === "starter-monthly" || value === "pro-monthly" || value === "pro-yearly";

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export const helloWorld = onRequest((_request, response) => {
  logger.info("helloWorld ping");
  response.send("Hello from Firebase!");
});

export const getSubmissions = onRequest({ cors: true }, async (request, response) => {
  try {
    const rawLimit = request.method === "GET" ? request.query.limit : (request.body?.limit as unknown);
    const parsedLimit = Number(rawLimit ?? 10);
    const pageSize = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 10;

    const snapshot = await db.collection("submissions").orderBy("submitTime", "desc").limit(pageSize).get();
    const records = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    response.status(200).send({ submissions: records });
  } catch (error) {
    logger.error("getSubmissions failed", error as Error);
    response.status(500).send({ message: "Failed to fetch submissions." });
  }
});

export const submit = onCall(async (request) => {
  const uid = requireAuthUid(request.auth);
  const language = String(request.data.language ?? "");
  const submission = String(request.data.submission ?? "");
  const problemId = String(request.data.problemId ?? "");

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new HttpsError("invalid-argument", "Language not supported.");
  }
  if (!problemId) {
    throw new HttpsError("invalid-argument", "Missing problem id.");
  }

  const problem = await db.collection("problems").doc(problemId).get();
  if (!problem.exists) {
    throw new HttpsError("not-found", "Problem does not exist.");
  }

  const doc = await db.collection("submissions").add({
    language,
    submission,
    problemId,
    userId: uid,
    submitTime: FieldValue.serverTimestamp(),
    workerTryCount: 0,
    status: "PENDING",
  });

  return {
    message: "Submission queued",
    id: doc.id,
  };
});

export const checkDailyFreeQuota = onCall(async () => {
  const dateKey = toUtcDateKey(new Date());
  const quotaRef = db.collection("dailyAccessQuota").doc(dateKey);
  const quotaSnapshot = await quotaRef.get();

  const claimedCount = Number(quotaSnapshot.data()?.claimedCount ?? 0);
  const slotsRemaining = Math.max(MAX_DAILY_FREE_USERS - claimedCount, 0);

  return {
    dateKey,
    maxDailySlots: MAX_DAILY_FREE_USERS,
    claimedCount,
    slotsRemaining,
  };
});

export const claimDailyFreePass = onCall(async (request) => {
  const uid = requireAuthUid(request.auth);
  const now = new Date();
  const dateKey = toUtcDateKey(now);
  const quotaRef = db.collection("dailyAccessQuota").doc(dateKey);
  const subscriptionRef = db.collection("subscriptions").doc(uid);

  const transactionResult = await db.runTransaction(async (transaction) => {
    const quotaSnapshot = await transaction.get(quotaRef);
    const data = quotaSnapshot.exists ? quotaSnapshot.data() ?? {} : {};
    const claimedCount = Number(data.claimedCount ?? 0);
    const claimedUsers = (data.claimedUsers ?? {}) as Record<string, boolean>;
    const alreadyClaimed = Boolean(claimedUsers[uid]);

    if (!alreadyClaimed && claimedCount >= MAX_DAILY_FREE_USERS) {
      return {
        granted: false,
        claimedCount,
      };
    }

    const nextClaimedCount = alreadyClaimed ? claimedCount : claimedCount + 1;
    const nextClaimedUsers = alreadyClaimed ? claimedUsers : { ...claimedUsers, [uid]: true };

    transaction.set(
      quotaRef,
      {
        dateKey,
        maxDailySlots: MAX_DAILY_FREE_USERS,
        claimedCount: nextClaimedCount,
        claimedUsers: nextClaimedUsers,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      subscriptionRef,
      {
        userId: uid,
        planId: "daily-free",
        planName: "Daily Free Pass",
        status: "active",
        source: "daily-quota",
        startsAt: FieldValue.serverTimestamp(),
        validUntil: endOfUtcDay(now),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      granted: true,
      claimedCount: nextClaimedCount,
    };
  });

  const slotsRemaining = Math.max(MAX_DAILY_FREE_USERS - transactionResult.claimedCount, 0);

  return {
    granted: transactionResult.granted,
    dateKey,
    maxDailySlots: MAX_DAILY_FREE_USERS,
    claimedCount: transactionResult.claimedCount,
    slotsRemaining,
  };
});

export const createBillingOrder = onCall(async (request) => {
  const uid = requireAuthUid(request.auth);
  ensureRazorpayConfigured();

  const planIdRaw = String(request.data.planId ?? "");
  if (!isPaidPlan(planIdRaw)) {
    throw new HttpsError("invalid-argument", "Invalid paid plan id.");
  }
  const plan = BILLING_PLANS[planIdRaw];

  const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;
  const receipt = `${uid.slice(0, 8)}-${Date.now()}`;

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: plan.amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        uid,
        planId: plan.id,
        planName: plan.name,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("Razorpay order creation failed", { status: response.status, body: errorBody });
    if (response.status === 401) {
      throw new HttpsError(
        "failed-precondition",
        "Razorpay authentication failed. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/functions/.env and ensure test/live mode matches."
      );
    }
    throw new HttpsError("internal", "Failed to create payment order.");
  }

  const order = (await response.json()) as RazorpayOrderResponse;

  await db.collection("billingOrders").doc(order.id).set(
    {
      orderId: order.id,
      userId: uid,
      planId: plan.id,
      planName: plan.name,
      amountInPaise: order.amount,
      currency: order.currency,
      status: "created",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
    planId: plan.id as BillingPlanId,
    planName: plan.name,
  };
});

export const verifyBillingPayment = onCall(async (request) => {
  const uid = requireAuthUid(request.auth);
  ensureRazorpayConfigured();

  const orderId = String(request.data.orderId ?? "");
  const paymentId = String(request.data.paymentId ?? "");
  const signature = String(request.data.signature ?? "");

  if (!orderId || !paymentId || !signature) {
    throw new HttpsError("invalid-argument", "Missing payment verification fields.");
  }

  const digest = createHmac("sha256", RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  const expected = Buffer.from(digest);
  const provided = Buffer.from(signature);
  const isValid =
    expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!isValid) {
    throw new HttpsError("permission-denied", "Invalid payment signature.");
  }

  const orderRef = db.collection("billingOrders").doc(orderId);
  const subscriptionRef = db.collection("subscriptions").doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) {
      throw new HttpsError("not-found", "Order not found.");
    }

    const order = orderSnapshot.data() as { userId?: string; planId?: string; status?: string; planName?: string };
    if (order.userId !== uid) {
      throw new HttpsError("permission-denied", "Order does not belong to this user.");
    }

    const paidPlanId = String(order.planId ?? "");
    if (!isPaidPlan(paidPlanId)) {
      throw new HttpsError("failed-precondition", "Invalid order plan.");
    }

    const plan = BILLING_PLANS[paidPlanId];
    const now = new Date();
    const validUntil = Timestamp.fromDate(new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000));

    transaction.set(
      orderRef,
      {
        status: "paid",
        paymentId,
        signature,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      subscriptionRef,
      {
        userId: uid,
        planId: plan.id,
        planName: plan.name,
        status: "active",
        source: "razorpay",
        startsAt: FieldValue.serverTimestamp(),
        validUntil,
        latestOrderId: orderId,
        latestPaymentId: paymentId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      status: "active",
      planId: plan.id,
      validUntil: validUntil.toDate().toISOString(),
    };
  });

  return result;
});

export const razorpayWebhook = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      response.status(200).send({ message: "Webhook secret is not configured. Event ignored." });
      return;
    }

    const signature = String(request.headers["x-razorpay-signature"] ?? "");
    if (!signature) {
      response.status(400).send({ message: "Missing signature." });
      return;
    }

    const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body || {}));
    const digest = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const expected = Buffer.from(digest);
    const provided = Buffer.from(signature);

    if (!(expected.length === provided.length && timingSafeEqual(expected, provided))) {
      response.status(401).send({ message: "Invalid webhook signature." });
      return;
    }

    const eventPayload = (request.body || {}) as { event?: string; payload?: Record<string, unknown> };
    logger.info("Razorpay webhook received", {
      event: eventPayload.event ?? "unknown",
    });

    response.status(200).send({ ok: true });
  } catch (error) {
    logger.error("razorpayWebhook failed", error as Error);
    response.status(500).send({ message: "Webhook processing failed." });
  }
});
