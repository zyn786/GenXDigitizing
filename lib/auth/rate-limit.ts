/**
 * Lightweight in-memory rate limiter.
 *
 * NOTE: This is a per-process map; in a multi-instance deployment each
 * instance keeps its own counter. For production use behind a load balancer,
 * back this with Redis (or another shared store) — the surface here matches
 * what such a swap would look like.
 */
type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Best-effort client IP extraction from incoming headers (Next.js Request).
 * Falls back to "unknown" if no proxy headers are present.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
