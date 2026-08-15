interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfterMs?: number;
}

/**
 * 内存级简单限流：每 key（默认按 IP）每 60 秒最多 30 次请求。
 */
export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - bucket.count };
}

// 定期清理过期条目，防止 Map 无限增长
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
  if (buckets.size > MAX_BUCKETS) {
    for (const key of buckets.keys()) {
      const bucket = buckets.get(key);
      if (bucket && now - bucket.resetAt > -WINDOW_MS) {
        buckets.delete(key);
      }
      if (buckets.size <= MAX_BUCKETS) break;
    }
  }
}, WINDOW_MS).unref();
