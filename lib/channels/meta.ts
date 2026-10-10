/**
 * Instagram / Facebook Graph webhook → the shape lib/channels/inbound
 * understands.
 *
 * One parser for both, because Meta delivers them through the same envelope:
 * the same `object` / `entry[].messaging[]` shape, the same signature. The only
 * difference is the `object` value, which decides the channel a message is
 * filed under.
 *
 * Kept out of the route file because Next.js validates a route module's
 * exports, and because this is pure parsing that deserves tests.
 */

import type { InboundMessage } from "@/lib/channels";

export function extractMetaMessages(payload: any): InboundMessage[] {
  const out: InboundMessage[] = [];
  const channel = payload?.object === "instagram" ? "instagram" : "facebook";

  for (const entry of payload?.entry ?? []) {
    for (const event of entry?.messaging ?? []) {
      // Our own outgoing message, echoed back for confirmation. Recording it as
      // inbound would show the customer a reply from themselves that they never
      // wrote.
      if (event?.message?.is_echo) continue;

      const senderId = event?.sender?.id;
      if (!/^\d{5,}$/.test(String(senderId ?? ""))) {
        console.warn(`[meta] skipping a ${channel} event with an unusable sender id`);
        continue;
      }

      const attachment = event?.message?.attachments?.[0];
      const text =
        event?.message?.text ??
        (attachment ? `[${attachment.type ?? "attachment"}]` : null) ??
        // A postback is a button tap — a deliberate action, so it counts even
        // though the customer typed nothing.
        event?.postback?.title ??
        event?.postback?.payload ??
        null;

      // Read receipts, deliveries and reactions carry none of the above.
      if (!text) continue;

      out.push({
        channel,
        externalId: String(senderId),
        displayName: null,
        email: null,
        body: String(text),
        providerMessageId: event?.message?.mid ?? null,
        attachments: event?.message?.attachments ? { raw: event.message.attachments } : null,
        receivedAt: event?.timestamp
          ? new Date(Number(event.timestamp)).toISOString()
          : new Date().toISOString(),
      });
    }
  }

  return out;
}
