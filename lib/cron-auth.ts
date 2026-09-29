import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Authorise a Vercel Cron invocation.
 *
 * Two problems with the previous inline check (`process.env.CRON_SECRET && secret !== ...`):
 *
 *   1. It read only `x-cron-secret`, but Vercel Cron sends
 *      `Authorization: Bearer $CRON_SECRET`. So when the secret WAS configured,
 *      every legitimate cron invocation was rejected with 401 and the job never
 *      ran — silently, since nothing watched the cron.
 *   2. When the secret was NOT configured the guard short-circuited to `true`,
 *      leaving the endpoint fully public. Anyone could POST to it and trigger
 *      mass notifications or subscription mutations.
 *
 * This fails closed: no secret configured means no access. Set CRON_SECRET in
 * the deployment environment or the cron jobs will not run.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const header = (req.headers.get("x-cron-secret") || "").trim();

  return safeEqual(bearer, secret) || safeEqual(header, secret);
}

/** Constant-time string comparison that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
