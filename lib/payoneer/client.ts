/**
 * Payoneer — NO API integration is used.
 *
 * How payment collection works:
 *   1. Admin generates a "Request a Payment" link from the Payoneer dashboard
 *      (payoneer.com → Billing Service → Request a Payment)
 *   2. Admin pastes the link into the invoice → POST /api/invoices/[id]/checkout
 *   3. Client receives a notification and clicks the link to pay
 *
 * How designer payouts work:
 *   Admin uses Payoneer's "Make a Payment" feature directly from the dashboard.
 *   The /api/designers/[id]/payout endpoint is no longer functional.
 *
 * The webhook endpoint (/api/webhooks/payoneer) still works if you configure
 * Payoneer to send payment confirmations. Signature verification is relaxed
 * in non-production environments.
 */

import crypto from "crypto";

// ── Stub: no API integration ───────────────────────────────────

export async function createCheckoutSession(_params: any): Promise<{ checkout_url: string }> {
  throw new Error(
    "Payoneer API integration is disabled. Use manual link entry instead: " +
    "Generate a payment link from payoneer.com → Billing Service → Request a Payment, " +
    "then paste it into the admin invoice panel."
  );
}

export async function sendPayout(_payout: any): Promise<{ payout_id: string; status: string }> {
  throw new Error(
    "Payoneer API integration is disabled. Use Payoneer dashboard directly: " +
    "payoneer.com → Payments → Make a Payment to send designer payouts."
  );
}

// ── Webhook signature verification ─────────────────────────────

export function verifyPayoneerWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  // In production with a configured webhook secret, verify properly
  const secret = process.env.PAYONEER_WEBHOOK_SECRET;
  if (secret && signature) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature.replace("sha256=", ""), "hex")
    );
  }

  // In dev/sandbox without a webhook secret configured, accept all
  return process.env.NODE_ENV !== "production";
}
