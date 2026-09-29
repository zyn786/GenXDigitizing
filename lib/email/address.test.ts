import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  bareAddress,
  displayName,
  composeFrom,
  composeReplyTo,
  isAllowedSender,
  DEFAULT_FROM_ADDRESS,
  DEFAULT_FROM_NAME,
  DEFAULT_REPLY_TO,
} from "./address";

const original = { ...process.env };

beforeEach(() => {
  delete process.env.RESEND_FROM_EMAIL;
  delete process.env.RESEND_FROM_NAME;
  delete process.env.RESEND_REPLY_TO;
  delete process.env.RESEND_FROM_DOMAIN;
});

afterEach(() => {
  process.env = { ...original };
});

describe("bareAddress", () => {
  it("extracts the address from a name/address pair", () => {
    expect(bareAddress("GenX Digitizing <order@genxdigitizing.com>")).toBe(
      "order@genxdigitizing.com"
    );
    expect(bareAddress("<order@genxdigitizing.com>")).toBe("order@genxdigitizing.com");
  });

  it("passes a bare address through, lowercased", () => {
    expect(bareAddress("Order@GenXDigitizing.com")).toBe("order@genxdigitizing.com");
  });

  it("handles empty and nullish", () => {
    expect(bareAddress("")).toBe("");
    expect(bareAddress(null)).toBe("");
    expect(bareAddress(undefined)).toBe("");
  });
});

describe("displayName", () => {
  it("reads the name from a pair", () => {
    expect(displayName("GenX Digitizing <order@genxdigitizing.com>")).toBe("GenX Digitizing");
    expect(displayName('"GenX Digitizing" <order@genxdigitizing.com>')).toBe("GenX Digitizing");
  });

  it("returns empty when there is no name", () => {
    expect(displayName("order@genxdigitizing.com")).toBe("");
    expect(displayName("")).toBe("");
  });
});

describe("composeFrom — the malformed-header regression", () => {
  it("does NOT nest angle brackets when the env value carries a display name", () => {
    // This is the exact input that produced
    //   genxdigitizing <GenX Digitizing <order@genxdigitizing.com>>
    const header = composeFrom("GenX Digitizing <order@genxdigitizing.com>");
    expect(header).toBe("GenX Digitizing <order@genxdigitizing.com>");
    expect(header.match(/</g)).toHaveLength(1);
    expect(header.match(/>/g)).toHaveLength(1);
  });

  it("produces a single valid pair from a bare address", () => {
    const header = composeFrom("order@genxdigitizing.com");
    expect(header).toBe(`${DEFAULT_FROM_NAME} <order@genxdigitizing.com>`);
    expect(header.match(/[<>]/g)).toHaveLength(2);
  });

  it("reads RESEND_FROM_EMAIL when no argument is given", () => {
    process.env.RESEND_FROM_EMAIL = "GenX Digitizing <order@genxdigitizing.com>";
    expect(composeFrom()).toBe("GenX Digitizing <order@genxdigitizing.com>");
  });

  it("prefers an explicit display name argument over the env default", () => {
    process.env.RESEND_FROM_NAME = "Ignored";
    expect(composeFrom("order@genxdigitizing.com", "Billing")).toBe(
      "Billing <order@genxdigitizing.com>"
    );
  });

  it("falls back to a working sender when the env value is empty or junk", () => {
    expect(composeFrom("")).toBe(`${DEFAULT_FROM_NAME} <${DEFAULT_FROM_ADDRESS}>`);
    expect(composeFrom("   ")).toBe(`${DEFAULT_FROM_NAME} <${DEFAULT_FROM_ADDRESS}>`);
    expect(composeFrom(null)).toBe(`${DEFAULT_FROM_NAME} <${DEFAULT_FROM_ADDRESS}>`);
  });

  it("never emits an address containing a bracket", () => {
    for (const input of [
      "GenX Digitizing <order@genxdigitizing.com>",
      "order@genxdigitizing.com",
      "<order@genxdigitizing.com>",
      "",
    ]) {
      const addr = bareAddress(composeFrom(input));
      expect(addr).not.toContain("<");
      expect(addr).not.toContain(">");
    }
  });
});

describe("composeReplyTo", () => {
  it("defaults to the monitored support mailbox", () => {
    expect(composeReplyTo()).toBe(DEFAULT_REPLY_TO);
    expect(composeReplyTo("")).toBe(DEFAULT_REPLY_TO);
  });

  it("reads RESEND_REPLY_TO and strips a display name", () => {
    process.env.RESEND_REPLY_TO = "Support <help@genxdigitizing.com>";
    expect(composeReplyTo()).toBe("help@genxdigitizing.com");
  });
});

describe("isAllowedSender", () => {
  it("accepts our domain, with or without a display name", () => {
    expect(isAllowedSender("order@genxdigitizing.com")).toBe(true);
    expect(isAllowedSender("Billing <billing@genxdigitizing.com>")).toBe(true);
  });

  it("rejects other domains and malformed values", () => {
    expect(isAllowedSender("attacker@evil.com")).toBe(false);
    expect(isAllowedSender("order@genxdigitizing.com.evil.com")).toBe(false);
    expect(isAllowedSender("no-at-sign")).toBe(false);
    expect(isAllowedSender("@genxdigitizing.com")).toBe(false);
    expect(isAllowedSender("")).toBe(false);
  });

  it("honours RESEND_FROM_DOMAIN", () => {
    process.env.RESEND_FROM_DOMAIN = "example.com";
    expect(isAllowedSender("a@example.com")).toBe(true);
    expect(isAllowedSender("a@genxdigitizing.com")).toBe(false);
  });
});
