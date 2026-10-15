/**
 * Outbound WhatsApp — the one place the business sends a message.
 *
 * Inbound is handled by app/api/webhooks/whatsapp and lib/channels/*. This is
 * the mirror image: a short text pushed to a recipient via the WhatsApp Cloud
 * API (the `messages` endpoint on Graph).
 *
 * Two things gate whether a send actually lands:
 *
 *   1. Credentials — WHATSAPP_ACCESS_TOKEN (a Meta system-user token with the
 *      whatsapp_business_messaging scope) and WHATSAPP_PHONE_NUMBER_ID (the
 *      business number's id). Both fail closed: missing either is a logged
 *      no-op, never a crash.
 *
 *   2. The 24-hour window — free-form text (type: "text") may only be sent to a
 *      number that has messaged the business within the last 24 hours. Outside
 *      that window Meta rejects the send with an error 131047. Sending a
 *      template instead lifts the window, but a template must be submitted and
 *      approved first — this module deliberately stays on free-form text and
 *      reports the rejection rather than pretending a template exists.
 */

const GRAPH_VERSION = "v25.0";

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppText(to: string, text: string): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    const err = "WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not set";
    console.error("[whatsapp/send]", err);
    return { ok: false, error: err };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const err = json?.error?.message ?? `HTTP ${res.status}`;
      console.error("[whatsapp/send] failed:", err);
      return { ok: false, error: err };
    }

    return { ok: true, messageId: json?.messages?.[0]?.id };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error("[whatsapp/send] error:", err);
    return { ok: false, error: err };
  }
}

/**
 * Ping the owner's own WhatsApp number.
 *
 * The business number is the sender, so the owner's notification goes to a
 * separate personal number held in WHATSAPP_ADMIN_NUMBER. Best-effort by
 * design: an order must never fail because a WhatsApp ping did.
 */
export function notifyOwnerOnWhatsApp(text: string): Promise<WhatsAppSendResult> {
  const to = process.env.WHATSAPP_ADMIN_NUMBER;
  if (!to) {
    console.error("[whatsapp/send] WHATSAPP_ADMIN_NUMBER is not set — no owner notification sent");
    return Promise.resolve({ ok: false, error: "no owner number configured" });
  }
  return sendWhatsAppText(to, text);
}
