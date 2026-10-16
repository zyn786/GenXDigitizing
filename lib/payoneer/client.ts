import crypto from "crypto";

/**
 * Verify a Payoneer webhook signature. Fails closed, always.
 *
 * This used to end with `return process.env.NODE_ENV !== "production"`, and the
 * caller only rejected when `NODE_ENV === "production"` — so on any deployment
 * that was not literally production (a dev server, a preview, a tunnel, a
 * container that forgot to set NODE_ENV) an unsigned POST was accepted and
 * marked invoices paid, added to client LTV, and emailed payment confirmations.
 *
 * The meta and whatsapp routes never had that escape hatch: unset secret means
 * refuse, everywhere. This now matches them. There is no environment in which
 * an unverifiable payment event should be trusted.
 *
 * The signature is validated as hex before decoding, because
 * `crypto.timingSafeEqual` THROWS on a length mismatch rather than returning
 * false — so a header of "nonsense" produced a 500 instead of a clean 401, and
 * a 500 tells the provider to retry a request that can never succeed.
 */
export function verifyPayoneerWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYONEER_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const provided = signature.replace(/^sha256=/i, "").trim();
  // sha256 hex is exactly 64 characters. Anything else cannot be a match, and
  // must not reach timingSafeEqual.
  if (!/^[0-9a-f]{64}$/i.test(provided)) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(provided.toLowerCase(), "hex")
  );
}
