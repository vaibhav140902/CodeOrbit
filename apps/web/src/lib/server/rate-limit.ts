const buckets = new Map<string, { count: number; resetAt: number }>();

export const assertRateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error("Rate limit exceeded. Please try again in a moment.");
  }

  current.count += 1;
  buckets.set(key, current);
};
