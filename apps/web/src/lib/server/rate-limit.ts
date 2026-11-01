import crypto from "node:crypto";
import {
  type RateLimitAction,
  type RateLimitStatus,
  type UserTier,
} from "@codeorbit/schema";
import {
  getBillingSummaryData,
  type ViewerContext,
} from "./platform-data.ts";

export class RateLimitError extends Error {
  readonly status: number;
  readonly retryAfterSec: number;
  readonly resetAt: number;
  readonly limit: number;
  readonly remaining: number;
  readonly tier: UserTier;
  readonly action: string;

  constructor(
    message: string,
    retryAfterSec: number,
    resetAt: number,
    limit: number,
    tier: UserTier,
    action: string,
    remaining = 0
  ) {
    super(message);
    this.name = "RateLimitError";
    this.status = 429;
    this.retryAfterSec = retryAfterSec;
    this.resetAt = resetAt;
    this.limit = limit;
    this.remaining = remaining;
    this.tier = tier;
    this.action = action;
  }
}

export interface QuotaConfig {
  limit: number;
  windowMs: number;
}

export const TIER_QUOTAS: Record<RateLimitAction, Record<UserTier, QuotaConfig>> = {
  code_execution: {
    guest: { limit: 15, windowMs: 3_600_000 }, // 15 / hour
    free: { limit: 15, windowMs: 3_600_000 },  // 15 / hour
    pro: { limit: 100, windowMs: 3_600_000 },  // 100 / hour
  },
  resume_generation: {
    guest: { limit: 2, windowMs: 86_400_000 },  // 2 / day
    free: { limit: 2, windowMs: 86_400_000 },   // 2 / day
    pro: { limit: 50, windowMs: 3_600_000 },    // 50 / hour soft ceiling
  },
  resume_export: {
    guest: { limit: 2, windowMs: 86_400_000 },  // 2 / day
    free: { limit: 2, windowMs: 86_400_000 },   // 2 / day
    pro: { limit: 30, windowMs: 3_600_000 },    // 30 / hour
  },
  problem_assist: {
    guest: { limit: 20, windowMs: 86_400_000 }, // 20 / day
    free: { limit: 20, windowMs: 86_400_000 },  // 20 / day
    pro: { limit: 200, windowMs: 86_400_000 },  // 200 / day
  },
  mock_interview: {
    guest: { limit: 2, windowMs: 86_400_000 },  // 2 / day (full interview scorecard)
    free: { limit: 2, windowMs: 86_400_000 },   // 2 / day (full interview scorecard)
    pro: { limit: 20, windowMs: 86_400_000 },   // 20 / day
  },
  mock_interview_turn: {
    guest: { limit: 30, windowMs: 3_600_000 },  // 30 / hour (conversational turns)
    free: { limit: 30, windowMs: 3_600_000 },   // 30 / hour (conversational turns)
    pro: { limit: 300, windowMs: 3_600_000 },  // 300 / hour
  },
  mock_interview_live: {
    guest: { limit: 60, windowMs: 3_600_000 },  // 60 / hour (live coaching micro-cues)
    free: { limit: 60, windowMs: 3_600_000 },   // 60 / hour (live coaching micro-cues)
    pro: { limit: 600, windowMs: 3_600_000 },  // 600 / hour
  },
  readiness_score: {
    guest: { limit: 30, windowMs: 3_600_000 },  // 30 / hour
    free: { limit: 30, windowMs: 3_600_000 },   // 30 / hour
    pro: { limit: 120, windowMs: 3_600_000 },   // 120 / hour
  },
  billing_action: {
    guest: { limit: 15, windowMs: 900_000 },    // 15 / 15 mins
    free: { limit: 15, windowMs: 900_000 },     // 15 / 15 mins
    pro: { limit: 30, windowMs: 900_000 },      // 30 / 15 mins
  },
};

interface BucketRecord {
  count: number;
  resetAt: number;
  windowMs: number;
}

const buckets = new Map<string, BucketRecord>();
let lastPruneTime = 0;
const PRUNE_INTERVAL_MS = 60_000;

export const pruneExpiredBuckets = (force = false): number => {
  const now = Date.now();
  if (!force && now - lastPruneTime < PRUNE_INTERVAL_MS) {
    return 0;
  }
  lastPruneTime = now;
  let prunedCount = 0;
  for (const [key, record] of buckets.entries()) {
    if (record.resetAt <= now) {
      buckets.delete(key);
      prunedCount += 1;
    }
  }
  return prunedCount;
};

export const resetRateLimitBuckets = () => {
  buckets.clear();
  lastPruneTime = 0;
};

export const getRateLimitBucket = (key: string): BucketRecord | undefined => {
  return buckets.get(key);
};

export const setRateLimitBucket = (key: string, count: number, resetAt: number, windowMs: number) => {
  buckets.set(key, { count, resetAt, windowMs });
};

const hashClientIp = (ip: string): string => {
  return crypto.createHash("sha256").update(ip.trim().toLowerCase()).digest("hex").slice(0, 16);
};

export const resolveClientKey = (
  request: Request,
  viewer?: ViewerContext | null
): { key: string; isGuest: boolean } => {
  if (viewer?.uid) {
    return { key: `user:${viewer.uid}`, isGuest: false };
  }

  const allowDevAuth =
    process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_HEADER_AUTH === "true";
  if (allowDevAuth) {
    const devUid = request.headers.get("x-codeorbit-viewer-uid");
    if (devUid) {
      return { key: `user:${devUid}`, isGuest: false };
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const rawIp = forwardedFor?.split(",")[0]?.trim() || realIp || "127.0.0.1";

  return { key: `guest:${hashClientIp(rawIp)}`, isGuest: true };
};

export const resolveViewerTier = async (viewer?: ViewerContext | null): Promise<UserTier> => {
  if (!viewer || (!viewer.uid && !viewer.email)) {
    return "guest";
  }

  try {
    const billing = await getBillingSummaryData(viewer);
    return billing.premiumActive ? "pro" : "free";
  } catch {
    return "free";
  }
};

const formatWindowDuration = (windowMs: number): string => {
  if (windowMs >= 86_400_000) {
    const days = Math.round(windowMs / 86_400_000);
    return days === 1 ? "day" : `${days} days`;
  }
  if (windowMs >= 3_600_000) {
    const hours = Math.round(windowMs / 3_600_000);
    return hours === 1 ? "hour" : `${hours} hours`;
  }
  const mins = Math.round(windowMs / 60_000);
  return mins === 1 ? "minute" : `${mins} minutes`;
};

export const assertTierRateLimit = async (
  request: Request,
  action: RateLimitAction,
  viewer?: ViewerContext | null
): Promise<RateLimitStatus> => {
  pruneExpiredBuckets();

  const { key: clientKey } = resolveClientKey(request, viewer);
  const tier = await resolveViewerTier(viewer);
  const quota = TIER_QUOTAS[action][tier];
  const now = Date.now();
  const bucketKey = `${action}:${clientKey}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + quota.windowMs, windowMs: quota.windowMs });
    return {
      limit: quota.limit,
      remaining: quota.limit - 1,
      resetAt: now + quota.windowMs,
      tier,
      action,
    };
  }

  if (current.count >= quota.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    const durationLabel = formatWindowDuration(quota.windowMs);
    throw new RateLimitError(
      `Rate limit exceeded for ${action}. ${tier.toUpperCase()} tier ceiling is ${quota.limit} requests per ${durationLabel}. Please retry in ${retryAfterSec}s.`,
      retryAfterSec,
      current.resetAt,
      quota.limit,
      tier,
      action,
      0
    );
  }

  current.count += 1;
  buckets.set(bucketKey, current);

  return {
    limit: quota.limit,
    remaining: quota.limit - current.count,
    resetAt: current.resetAt,
    tier,
    action,
  };
};

export const assertRateLimit = (key: string, limit: number, windowMs: number) => {
  pruneExpiredBuckets();
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs, windowMs });
    return;
  }

  if (current.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new RateLimitError(
      `Rate limit exceeded. Please try again in ${retryAfterSec}s.`,
      retryAfterSec,
      current.resetAt,
      limit,
      "free",
      key,
      0
    );
  }

  current.count += 1;
  buckets.set(key, current);
};

export const rateLimitResponse = (error: RateLimitError): Response => {
  return Response.json(
    {
      error: "RATE_LIMIT_EXCEEDED",
      message: error.message,
      retryAfterSec: error.retryAfterSec,
      resetAt: error.resetAt,
      limit: error.limit,
      tier: error.tier,
      action: error.action,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(error.retryAfterSec),
        "X-RateLimit-Limit": String(error.limit),
        "X-RateLimit-Remaining": String(error.remaining),
        "X-RateLimit-Reset": String(Math.ceil(error.resetAt / 1000)),
      },
    }
  );
};
