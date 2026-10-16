/**
 * Whether a thread can be replied to, and what to say when it cannot.
 *
 * The inbox can read five channels and, today, write to one. Rather than
 * offering a reply box that fails on submit, every thread carries a decision:
 * this channel has a send path or it does not, and this customer is inside the
 * provider's reply window or they are not.
 *
 * All of it is pure — no Supabase, no fetch, no clock of its own — so the rules
 * can be tested at the boundaries (23h59m vs 24h01m, exactly zero inbound
 * messages) without a network or a database.
 *
 * THE WHATSAPP WINDOW, because it is the rule most likely to be half-remembered:
 * the Cloud API allows free-form `type: "text"` only within 24 hours of the
 * customer's last inbound message. Outside it Meta rejects the send with error
 * 131047. A pre-approved template lifts the restriction; none exists for this
 * business yet, so outside the window the honest answer is "you cannot reply
 * here" rather than a send that silently fails.
 */

import type { Channel } from "@/lib/channels";

/** Channels with a working outbound send path. One, deliberately. */
export const REPLYABLE_CHANNELS: Channel[] = ["whatsapp"];

/** WhatsApp's customer service window: 24 hours from the customer's last message. */
export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

/** WhatsApp rejects a text body over 4096 characters. */
export const MAX_REPLY_LENGTH = 4096;

export type ReplyBlockReason = "unsupported_channel" | "no_inbound" | "window_closed";

export interface ReplyContext {
  channel: string;
  allowed: boolean;
  reason?: ReplyBlockReason;
  /** A sentence for the person looking at the thread. Always set when blocked. */
  message: string;
  /** When the window shuts, if it is open. Null when the channel has no window. */
  windowClosesAt: string | null;
  maxLength: number;
}

export function isReplyable(channel: string): boolean {
  return (REPLYABLE_CHANNELS as readonly string[]).includes(channel);
}

/**
 * When a reply window closes, or null if it never opened.
 *
 * Null covers both "no inbound message yet" and "unparseable timestamp": a
 * thread we cannot date is a thread we cannot safely write to.
 */
export function windowClosesAt(lastInboundAt: string | null | undefined): Date | null {
  if (!lastInboundAt) return null;
  const then = new Date(lastInboundAt).getTime();
  if (Number.isNaN(then)) return null;
  return new Date(then + WHATSAPP_WINDOW_MS);
}

const UNSUPPORTED: Record<string, string> = {
  instagram:
    "Replies are not wired up for Instagram yet — there is no send path for it, so replies must go through the Instagram app.",
  facebook:
    "Replies are not wired up for Facebook yet — there is no send path for it, so replies must go through the Page inbox.",
  email: "Replies are not wired up for email yet — reply from the mailbox instead.",
  website: "This is a form submission, not a thread. Reply by email.",
};

export function replyContext(input: {
  channel: string;
  lastInboundAt: string | null | undefined;
  now?: Date;
}): ReplyContext {
  const now = input.now ?? new Date();
  const base = { channel: input.channel, maxLength: MAX_REPLY_LENGTH, windowClosesAt: null };

  if (!isReplyable(input.channel)) {
    return {
      ...base,
      allowed: false,
      reason: "unsupported_channel",
      message:
        UNSUPPORTED[input.channel] ??
        `Replies are not wired up for ${input.channel} yet. Reply from the provider's own app.`,
    };
  }

  const closes = windowClosesAt(input.lastInboundAt);

  if (!closes) {
    return {
      ...base,
      allowed: false,
      reason: "no_inbound",
      message:
        "This contact has not messaged us, so WhatsApp will not deliver a free-form reply. Wait for them to write first.",
    };
  }

  if (closes.getTime() <= now.getTime()) {
    return {
      ...base,
      allowed: false,
      reason: "window_closed",
      message:
        "The 24-hour reply window has closed. WhatsApp only allows a free-form reply within 24 hours of the customer's last message, and no approved template exists yet.",
    };
  }

  return {
    ...base,
    allowed: true,
    message: "Free-form replies are open until the window closes.",
    windowClosesAt: closes.toISOString(),
  };
}

export type ReplyBodyResult = { ok: true; body: string } | { ok: false; message: string };

/**
 * Trim, reject empty, cap at the provider's limit.
 *
 * Over-length is rejected rather than truncated: silently cutting a customer
 * reply mid-sentence is worse than asking the sender to shorten it.
 */
export function validateReplyBody(raw: unknown): ReplyBodyResult {
  if (typeof raw !== "string") return { ok: false, message: "A reply must be text." };
  const body = raw.trim();
  if (!body) return { ok: false, message: "A reply cannot be empty." };
  if (body.length > MAX_REPLY_LENGTH) {
    return {
      ok: false,
      message: `That reply is ${body.length} characters; the limit is ${MAX_REPLY_LENGTH}.`,
    };
  }
  return { ok: true, body };
}

/**
 * Meta's error code for "outside the 24-hour window", surfaced as an
 * actionable message rather than a raw provider string.
 *
 * The window is checked before sending, so reaching this means the clock moved
 * between the check and the send — rare, but the person deserves to know why
 * their reply bounced rather than seeing a Graph API error.
 */
export function describeSendFailure(error: string, code?: number): string {
  if (code === 131047) {
    return "WhatsApp refused the reply: the 24-hour window closed before it was sent. Ask the customer to message again.";
  }
  if (code === 131026) {
    return "WhatsApp refused the reply: the number cannot receive messages (not on WhatsApp, or it has blocked the business).";
  }
  if (code === 190) {
    return "WhatsApp refused the reply: the access token is invalid or expired. Rotate WHATSAPP_ACCESS_TOKEN.";
  }
  return error;
}
