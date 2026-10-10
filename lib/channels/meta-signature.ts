/**
 * Meta webhook signature verification — WhatsApp, Instagram and Facebook.
 *
 * All three sign with the same scheme: `X-Hub-Signature-256: sha256=<hex>`,
 * an HMAC over the exact request body using the app secret. One implementation
 * covers the three channels, which is most of the reason they share a webhook
 * design.
 *
 * Fail closed, always. A missing secret must refuse the delivery, never accept
 * it — the alternative is an unauthenticated endpoint that creates leads and
 * notifies staff on demand. This codebase already had that bug once, in the
 * Resend webhook, where an unset secret silently returned true.
 *
 * Dependency-free and pure apart from crypto, so the timing-safe comparison is
 * straightforward to test.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Read the body as text without consuming it twice.
 *
 * The signature is computed over the bytes as sent, so the raw string must be
 * what gets verified — parsing first and re-serialising would change key order
 * and whitespace, and every signature would fail.
 */
export async function readRawBody(req: { text: () => Promise<string> }): Promise<string> {
  return await req.text();
}

export interface SignatureCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Verify a Meta `X-Hub-Signature-256` header.
 *
 * Returns a result rather than a boolean so callers can log why — "no secret
 * configured" and "signature did not match" need very different responses from
 * whoever is on call.
 */
export function checkMetaSignature(
  rawBody: string,
  headerValue: string | null | undefined,
  appSecret: string | null | undefined
): SignatureCheck {
  if (!appSecret) return { ok: false, reason: "no app secret configured" };
  if (!headerValue) return { ok: false, reason: "no signature header" };

  const prefix = "sha256=";
  if (!headerValue.startsWith(prefix)) return { ok: false, reason: "unsupported signature scheme" };

  const provided = headerValue.slice(prefix.length).trim();
  if (!/^[0-9a-f]{64}$/i.test(provided)) return { ok: false, reason: "malformed signature" };

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  // Constant-time: a length-varying or early-returning comparison leaks how
  // much of a guessed signature was right.
  const a = Buffer.from(provided.toLowerCase(), "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return { ok: false, reason: "signature length mismatch" };

  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: "signature did not match" };
}

/** Boolean convenience for callers that only branch on the outcome. */
export function verifyMetaSignature(
  rawBody: string,
  headerValue: string | null | undefined,
  appSecret: string | null | undefined
): boolean {
  return checkMetaSignature(rawBody, headerValue, appSecret).ok;
}
