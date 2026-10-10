/**
 * Channel identity, normalisation and the inbound pipeline's shared vocabulary.
 *
 * Every inbound channel — WhatsApp, Instagram, Facebook, email, the website
 * form — has to answer the same three questions before anything else can
 * happen:
 *
 *   1. Who is this?      → a normalised external id
 *   2. Which thread?     → a conversation key
 *   3. What did they say? → a body, and the provider's message id
 *
 * This module answers those in one place so five channels do not become five
 * lead systems. It is deliberately pure and dependency-free: no Supabase, no
 * fetch, no clock. Everything here is testable without a network.
 *
 * Why normalisation matters more than it looks: WhatsApp gives a phone number
 * as `923001234567` with no plus, sometimes with a leading zero, and Instagram
 * gives a numeric scoped id while Facebook gives a different one for the same
 * person. Match on the raw value and the same customer becomes several
 * contacts, which is the exact failure the brief calls out.
 */

export const CHANNELS = ["whatsapp", "instagram", "facebook", "email", "website"] as const;
export type Channel = (typeof CHANNELS)[number];

export function isChannel(value: unknown): value is Channel {
  return typeof value === "string" && (CHANNELS as readonly string[]).includes(value);
}

/** Channels a message can arrive on. `website` is a form, not a thread. */
export const MESSAGE_CHANNELS: Channel[] = ["whatsapp", "instagram", "facebook", "email"];

export interface InboundMessage {
  channel: Channel;
  /** Normalised by the caller using the helpers below. */
  externalId: string;
  displayName?: string | null;
  /** Only present when the channel gives us one. WhatsApp does not. */
  email?: string | null;
  body: string;
  /** The provider's message id, used to make a retried webhook a no-op. */
  providerMessageId?: string | null;
  attachments?: Record<string, unknown> | null;
  /** The provider's own timestamp when it sends one. */
  receivedAt?: string | null;
}

/**
 * WhatsApp sends numbers without a leading `+`, sometimes with a national
 * trunk `0`, and occasionally with formatting. Store one shape: digits only,
 * country code first, no plus.
 *
 * Returns null rather than guessing when there is nothing usable — a wrong
 * number is worse than no number, because it silently merges two customers.
 */
export function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 15) return null; // E.164 is 8–15
  // A leading zero is a national trunk prefix; E.164 never has one.
  return digits.replace(/^0+/, "") || null;
}

/** Emails are matched case-insensitively; the local part is not rewritten. */
export function normaliseEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * The identifier for a channel, normalised.
 *
 * Meta's messaging channels (Instagram, Facebook) key on a page- or
 * app-scoped id that is opaque and numeric — it is compared, never parsed.
 */
export function normaliseExternalId(
  channel: Channel,
  raw: string | null | undefined
): string | null {
  switch (channel) {
    case "whatsapp":
      return normalisePhone(raw);
    case "email":
    case "website":
      return normaliseEmail(raw);
    case "instagram":
    case "facebook": {
      const id = String(raw ?? "").trim();
      return /^\d{5,}$/.test(id) ? id : null;
    }
  }
}

/**
 * The key a conversation is stored under.
 *
 * One thread per contact per channel: a customer who messages on WhatsApp and
 * also emails has two threads but one lead, which is what the identity map is
 * for. Keeping the key in one function is what stops one webhook writing
 * `whatsapp:92300…` and another writing `92300…`.
 */
export function conversationKey(channel: Channel, externalId: string): string {
  return `${channel}:${externalId}`;
}

export interface PipelineStep {
  step: string;
  detail: string;
}

/**
 * The documented order an inbound message moves through. Not executed here —
 * the webhook does the work — but a single description of it means the route,
 * the docs and the brief cannot drift into three different stories.
 */
export const INBOUND_PIPELINE: PipelineStep[] = [
  { step: "verify", detail: "Signature checked against the provider secret; fail closed" },
  { step: "normalise", detail: "External id, body and provider message id normalised" },
  { step: "dedupe", detail: "Provider message id already stored? Stop — webhooks retry" },
  { step: "identify", detail: "contact_channels lookup by (channel, external_id)" },
  { step: "create", detail: "No contact? Create one, and a lead to go with it" },
  { step: "thread", detail: "Find or open the conversation for this contact on this channel" },
  { step: "record", detail: "Append the message; bump last_message_at and unread_count" },
  { step: "event", detail: "Write a lead_events row so the timeline shows it" },
  { step: "notify", detail: "Tell admin and crm a message arrived" },
  { step: "draft", detail: "Optionally prepare a reply — never send it automatically" },
];
