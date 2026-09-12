import "server-only";
import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

/**
 * In-memory fixed-window limiter. Good enough for a single Node server; swap the
 * store for Redis (or Vercel KV) when running multiple instances.
 */
const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitResult = { ok: boolean; retryAfter: number; remaining: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000), remaining: 0 };
  }
  return { ok: true, retryAfter: 0, remaining: limit - bucket.count };
}

export function limitRequest(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return rateLimit(`${scope}:${clientIp(req)}`, limit, windowMs);
}
