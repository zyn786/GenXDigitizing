// @ts-nocheck
/**
 * Shared in-memory rate limiter for public API endpoints.
 * Not a replacement for a distributed rate limiter (e.g. Upstash),
 * but sufficient for moderate-traffic public forms.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Check if a request should be allowed.
 * @param bucket  Namespace (e.g. "subscribe", "blog-comments")
 * @param key     Identifier (usually IP address)
 * @param max     Max requests allowed in the window
 * @param windowMs Window size in milliseconds (default 15 min)
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  bucket: string,
  key: string,
  max: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  if (!stores.has(bucket)) stores.set(bucket, new Map());
  const map = stores.get(bucket)!;

  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/** Clean up stale entries periodically (call once per invocation) */
export function cleanupRateLimit(bucket: string): void {
  const map = stores.get(bucket);
  if (!map) return;
  const now = Date.now();
  for (const [key, entry] of map) {
    if (now > entry.resetAt) map.delete(key);
  }
}
