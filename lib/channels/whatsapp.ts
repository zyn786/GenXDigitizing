/**
 * WhatsApp Cloud API payload → the shape lib/channels/inbound understands.
 *
 * Lives here rather than in the route file because Next.js validates a route
 * module's exports and rejects anything that is not an HTTP handler or a
 * known config value — and because parsing a provider's JSON is exactly the
 * kind of pure work that should be testable without a webhook.
 *
 * Meta's envelope is entry[].changes[].value.{contacts,messages}[] and every
 * level is optional in practice: a read receipt arrives as `statuses` with no
 * `messages` at all, and a partially populated payload should yield fewer
 * messages rather than a crash.
 */

import { normalisePhone, type InboundMessage } from "@/lib/channels";

export function extractWhatsAppMessages(payload: any): InboundMessage[] {
  const out: InboundMessage[] = [];

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value) continue;

      const contacts = value.contacts ?? [];

      for (const m of value.messages ?? []) {
        const phone = normalisePhone(m?.from);
        // No usable number means we cannot say who this is. Skip rather than
        // invent an identity — a wrong one silently merges two customers.
        if (!phone) {
          console.warn("[whatsapp] skipping a message with an unusable sender number");
          continue;
        }

        const contact = contacts.find((c: any) => c?.wa_id === m.from) ?? contacts[0];

        // A media message with no caption still carries meaning: the customer
        // sent something. Say so rather than storing an empty body.
        const body =
          m.text?.body ??
          m.button?.text ??
          m.interactive?.list_reply?.title ??
          m.interactive?.button_reply?.title ??
          (m.image ? "[image]" : m.document ? "[document]" : m.audio ? "[audio]" : "");

        out.push({
          channel: "whatsapp",
          externalId: phone,
          displayName: contact?.profile?.name ?? null,
          // WhatsApp does not give us an email address.
          email: null,
          body: body || "[unsupported message type]",
          providerMessageId: m.id ?? null,
          attachments:
            m.image || m.document || m.audio
              ? { type: m.type ?? null, raw: m[m.type] ?? null }
              : null,
          receivedAt: m.timestamp
            ? new Date(Number(m.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
        });
      }
    }
  }

  return out;
}
