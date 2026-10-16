import { describe, it, expect } from "vitest";
import {
  MAX_REPLY_LENGTH,
  REPLYABLE_CHANNELS,
  WHATSAPP_WINDOW_MS,
  describeSendFailure,
  isReplyable,
  replyContext,
  validateReplyBody,
  windowClosesAt,
} from "./reply";

const NOW = new Date("2026-10-16T12:00:00.000Z");
const HOURS = (n: number) => new Date(NOW.getTime() - n * 3600_000).toISOString();

/**
 * The reply box must never be offered where a send cannot land. These pin the
 * two ways that happens: a channel with no send path, and a closed window.
 */
describe("reply gating", () => {
  it("allows WhatsApp inside the window", () => {
    const ctx = replyContext({ channel: "whatsapp", lastInboundAt: HOURS(1), now: NOW });
    expect(ctx.allowed).toBe(true);
    expect(ctx.reason).toBeUndefined();
    // Closes exactly 24h after the customer's message, not 24h from now.
    expect(ctx.windowClosesAt).toBe(
      new Date(new Date(HOURS(1)).getTime() + WHATSAPP_WINDOW_MS).toISOString()
    );
  });

  it("blocks every channel that has no send path, whatever the timing", () => {
    // A fresh inbound message would satisfy the window; the channel still wins.
    for (const channel of ["instagram", "facebook", "email", "website"]) {
      const ctx = replyContext({ channel, lastInboundAt: HOURS(0.1), now: NOW });
      expect(ctx.allowed).toBe(false);
      expect(ctx.reason).toBe("unsupported_channel");
      expect(ctx.message.length).toBeGreaterThan(20); // a real sentence, not "no"
    }
  });

  it("names the provider's own app for a channel we cannot send on", () => {
    expect(replyContext({ channel: "instagram", lastInboundAt: null }).message).toMatch(
      /Instagram app/
    );
    expect(replyContext({ channel: "facebook", lastInboundAt: null }).message).toMatch(
      /Page inbox/
    );
  });

  it("does not claim a send path exists for a channel it has never heard of", () => {
    const ctx = replyContext({ channel: "telegram", lastInboundAt: HOURS(0.1), now: NOW });
    expect(ctx.allowed).toBe(false);
    expect(ctx.reason).toBe("unsupported_channel");
  });

  it("blocks a thread whose contact has never written", () => {
    const ctx = replyContext({ channel: "whatsapp", lastInboundAt: null, now: NOW });
    expect(ctx.allowed).toBe(false);
    expect(ctx.reason).toBe("no_inbound");
  });

  it("treats an unparseable timestamp as no window rather than an open one", () => {
    const ctx = replyContext({ channel: "whatsapp", lastInboundAt: "not a date", now: NOW });
    expect(ctx.allowed).toBe(false);
    expect(ctx.reason).toBe("no_inbound");
    expect(windowClosesAt("not a date")).toBeNull();
    expect(windowClosesAt("")).toBeNull();
    expect(windowClosesAt(undefined)).toBeNull();
  });
});

/** The boundary is the whole rule, so it gets tested to the millisecond. */
describe("the 24-hour window boundary", () => {
  it("is open one millisecond before it closes", () => {
    const justInside = new Date(NOW.getTime() - (WHATSAPP_WINDOW_MS - 1)).toISOString();
    expect(replyContext({ channel: "whatsapp", lastInboundAt: justInside, now: NOW }).allowed).toBe(
      true
    );
  });

  it("is closed exactly on the boundary, not one tick later", () => {
    const exactly = new Date(NOW.getTime() - WHATSAPP_WINDOW_MS).toISOString();
    const ctx = replyContext({ channel: "whatsapp", lastInboundAt: exactly, now: NOW });
    expect(ctx.allowed).toBe(false);
    expect(ctx.reason).toBe("window_closed");
  });

  it("is closed one millisecond after", () => {
    const justOutside = new Date(NOW.getTime() - (WHATSAPP_WINDOW_MS + 1)).toISOString();
    expect(replyContext({ channel: "whatsapp", lastInboundAt: justOutside, now: NOW }).reason).toBe(
      "window_closed"
    );
  });

  it("says what to do about a closed window, not just that it is closed", () => {
    const ctx = replyContext({ channel: "whatsapp", lastInboundAt: HOURS(30), now: NOW });
    expect(ctx.message).toMatch(/24 hours/);
    expect(ctx.message).toMatch(/template/);
  });
});

describe("reply body validation", () => {
  it("trims and accepts ordinary text", () => {
    expect(validateReplyBody("  hello there  ")).toEqual({ ok: true, body: "hello there" });
  });

  it("rejects empty and whitespace-only", () => {
    expect(validateReplyBody("").ok).toBe(false);
    expect(validateReplyBody("   \n\t ").ok).toBe(false);
    expect(validateReplyBody(null).ok).toBe(false);
    expect(validateReplyBody(42).ok).toBe(false);
  });

  it("accepts exactly the limit and rejects one character more", () => {
    const atLimit = "a".repeat(MAX_REPLY_LENGTH);
    expect(validateReplyBody(atLimit).ok).toBe(true);

    const over = validateReplyBody("a".repeat(MAX_REPLY_LENGTH + 1));
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.message).toMatch(String(MAX_REPLY_LENGTH));
  });

  it("measures the trimmed body, so trailing whitespace cannot push it over", () => {
    const padded = `${"a".repeat(MAX_REPLY_LENGTH)}   `;
    expect(validateReplyBody(padded).ok).toBe(true);
  });
});

describe("provider failure messages", () => {
  it("explains the closed-window rejection in the sender's terms", () => {
    expect(describeSendFailure("(#131047) Re-engagement message", 131047)).toMatch(
      /24-hour window closed/
    );
  });

  it("explains an undeliverable number", () => {
    expect(describeSendFailure("(#131026) Message undeliverable", 131026)).toMatch(
      /cannot receive messages/
    );
  });

  it("explains a bad token", () => {
    expect(describeSendFailure("Invalid OAuth access token", 190)).toMatch(/WHATSAPP_ACCESS_TOKEN/);
  });

  it("passes an unrecognised error through rather than inventing a cause", () => {
    expect(describeSendFailure("Something new", 999999)).toBe("Something new");
    expect(describeSendFailure("no code given")).toBe("no code given");
  });
});

describe("the replyable channel list", () => {
  it("is WhatsApp only — adding a channel here claims a send path exists", () => {
    // If this fails, someone widened the list. That is only correct once the
    // channel's outbound API is actually wired and tested with a real account.
    expect([...REPLYABLE_CHANNELS]).toEqual(["whatsapp"]);
  });

  it("agrees with isReplyable for every known channel", () => {
    for (const channel of ["whatsapp", "instagram", "facebook", "email", "website"]) {
      expect(isReplyable(channel)).toBe(REPLYABLE_CHANNELS.includes(channel as never));
    }
  });
});
