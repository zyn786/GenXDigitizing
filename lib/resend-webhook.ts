// @ts-nocheck
/**
 * Resend (Svix) webhook signature verification.
 *
 * Resend signs webhooks with Svix. Unlike the `t=…,v1=<hex>` scheme some
 * providers use, Svix sends:
 *
 *   svix-id         — message id
 *   svix-timestamp  — unix seconds
 *   svix-signature  — space-separated list of `v1,<base64 hmac>` entries
 *
 * and the signed content is `${svix_id}.${svix_timestamp}.${rawBody}`, HMAC'd
 * with SHA-256 and base64-encoded. The key is the base64-decoded portion of the
 * signing secret *after* its `whsec_` prefix.
 *
 * The previous implementation looked for a `resend-signature` header in the
 * `t=…,v1=<hex>` format, which Resend never sends — so every webhook was
 * rejected with a 401 and the inbox stayed empty.
 *
 * `resend@4.8.0` does not expose `webhooks.verify`, hence the manual HMAC.
 */
import { createHmac, timingSafeEqual } from "crypto";

/** Reject signatures older/newer than this, to limit replay. */
const TOLERANCE_SECONDS = 300;

/** Svix uses `webhook-*` headers on white-labelled plans. */
const ID_HEADERS = ["svix-id", "webhook-id"];
const TIMESTAMP_HEADERS = ["svix-timestamp", "webhook-timestamp"];
const SIGNATURE_HEADERS = ["svix-signature", "webhook-signature"];

function readHeader(headers: any, names: string[]): string | null {
  if (!headers) return null;
  for (var i = 0; i < names.length; i++) {
    var value = typeof headers.get === "function" ? headers.get(names[i]) : headers[names[i]];
    if (value) return value;
  }
  return null;
}

/**
 * Compute the expected `v1,<sig>` payload for a webhook delivery.
 * Exported so tests (and any manual tooling) can produce a signature.
 */
export function signResendWebhook(
  secret: string,
  id: string,
  timestamp: string | number,
  rawBody: string
): string {
  var keyPart = secret.indexOf("whsec_") === 0 ? secret.slice(6) : secret;
  var keyBytes = Buffer.from(keyPart, "base64");
  // Not valid base64 (e.g. a raw secret) — use the literal bytes instead.
  if (keyBytes.length === 0) keyBytes = Buffer.from(secret, "utf8");

  return createHmac("sha256", keyBytes)
    .update(id + "." + timestamp + "." + rawBody)
    .digest("base64");
}

function safeEqual(a: string, b: string): boolean {
  var bufA = Buffer.from(a, "utf8");
  var bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify a Resend webhook delivery.
 *
 * @param rawBody  the untouched request body (never re-stringified JSON)
 * @param headers  Headers instance or plain object
 * @param opts     test seams: `secret` and `now` (unix seconds)
 */
export function verifyResendWebhook(
  rawBody: string,
  headers: any,
  opts: { secret?: string; now?: number } = {}
): boolean {
  var secret = opts.secret !== undefined ? opts.secret : process.env.RESEND_WEBHOOK_SECRET || "";
  var now = opts.now !== undefined ? opts.now : Math.floor(Date.now() / 1000);

  // No secret configured (local dev) — allow, but say so loudly.
  if (!secret) {
    console.warn(
      "[resend-webhook] RESEND_WEBHOOK_SECRET not set — skipping signature verification"
    );
    return true;
  }

  var id = readHeader(headers, ID_HEADERS);
  var timestamp = readHeader(headers, TIMESTAMP_HEADERS);
  var signatureHeader = readHeader(headers, SIGNATURE_HEADERS);

  if (!id || !timestamp || !signatureHeader) {
    console.warn("[resend-webhook] Missing svix-id / svix-timestamp / svix-signature headers");
    return false;
  }

  var age = Math.abs(now - parseInt(timestamp, 10));
  if (!isFinite(age) || age > TOLERANCE_SECONDS) {
    console.warn("[resend-webhook] Signature timestamp outside tolerance:", timestamp);
    return false;
  }

  var expected = signResendWebhook(secret, id, timestamp, rawBody);

  // Header may carry several signatures; any match passes.
  var entries = signatureHeader.split(" ");
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i].trim();
    if (!entry) continue;
    var comma = entry.indexOf(",");
    var sig = comma === -1 ? entry : entry.slice(comma + 1);
    if (safeEqual(sig, expected)) return true;
  }

  console.warn("[resend-webhook] No matching signature");
  return false;
}
