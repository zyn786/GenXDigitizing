import { describe, it, expect } from "vitest";
import {
  CHANNELS,
  INBOUND_PIPELINE,
  conversationKey,
  isChannel,
  normaliseEmail,
  normaliseExternalId,
  normalisePhone,
} from "./channels";

describe("normalisePhone", () => {
  it("strips the shapes WhatsApp actually sends", () => {
    // Spaced, bare and trunk-prefixed forms of the same handset must all land
    // on one string, or the same customer becomes three contacts.
    expect(normalisePhone("+92 300 1234567")).toBe("923001234567");
    expect(normalisePhone("923001234567")).toBe("923001234567");
    expect(normalisePhone("03001234567")).toBe("3001234567");
  });

  it("drops a national trunk zero", () => {
    // E.164 never carries one, and keeping it makes a second contact.
    expect(normalisePhone("0092300123456")).toBe("92300123456");
    expect(normalisePhone("092300123456")).toBe("92300123456");
  });

  it("refuses anything it cannot be sure about", () => {
    // A wrong number silently merges two customers — worse than no match.
    expect(normalisePhone("")).toBeNull();
    expect(normalisePhone(null)).toBeNull();
    expect(normalisePhone(undefined)).toBeNull();
    expect(normalisePhone("12345")).toBeNull(); // too short
    expect(normalisePhone("1234567890123456789")).toBeNull(); // beyond E.164
    expect(normalisePhone("not a phone")).toBeNull();
  });
});

describe("normaliseEmail", () => {
  it("lowercases and trims so the same address is one contact", () => {
    expect(normaliseEmail("  Dana@Example.COM ")).toBe("dana@example.com");
    expect(normaliseEmail("dana@example.com")).toBe("dana@example.com");
  });

  it("rejects what is not an address", () => {
    expect(normaliseEmail("dana@")).toBeNull();
    expect(normaliseEmail("dana.example.com")).toBeNull();
    expect(normaliseEmail("")).toBeNull();
    expect(normaliseEmail(null)).toBeNull();
  });
});

describe("normaliseExternalId", () => {
  it("routes each channel to its own rule", () => {
    expect(normaliseExternalId("whatsapp", "+92 300 1234567")).toBe("923001234567");
    expect(normaliseExternalId("email", "A@B.COM")).toBe("a@b.com");
    expect(normaliseExternalId("instagram", "17841400000000000")).toBe("17841400000000000");
    expect(normaliseExternalId("facebook", "  17841400000000000 ")).toBe("17841400000000000");
  });

  it("rejects a Meta scoped id that is not numeric", () => {
    expect(normaliseExternalId("instagram", "dana_whitfield")).toBeNull();
    expect(normaliseExternalId("facebook", "abc")).toBeNull();
  });

  it("does not treat a phone as an email or vice versa", () => {
    expect(normaliseExternalId("email", "923001234567")).toBeNull();
    expect(normaliseExternalId("whatsapp", "dana@example.com")).toBeNull();
  });
});

describe("conversationKey", () => {
  it("is namespaced by channel, so two channels cannot collide on one id", () => {
    // A Meta scoped id and a phone number could theoretically be equal strings.
    expect(conversationKey("whatsapp", "923001234567")).toBe("whatsapp:923001234567");
    expect(conversationKey("instagram", "923001234567")).not.toBe(
      conversationKey("whatsapp", "923001234567")
    );
  });
});

describe("channel vocabulary", () => {
  it("agrees with the CHECK constraint in migration 057", () => {
    // The database rejects anything outside this list; keep them in step.
    expect([...CHANNELS]).toEqual(["whatsapp", "instagram", "facebook", "email", "website"]);
  });

  it("recognises a channel and refuses anything else", () => {
    expect(isChannel("whatsapp")).toBe(true);
    expect(isChannel("telegram")).toBe(false);
    expect(isChannel(null)).toBe(false);
  });
});

describe("the documented pipeline", () => {
  it("puts verification before anything that writes", () => {
    const names = INBOUND_PIPELINE.map((s) => s.step);
    expect(names[0]).toBe("verify");
    expect(names.indexOf("verify")).toBeLessThan(names.indexOf("create"));
  });

  it("dedupes before it creates, because webhooks are delivered at least once", () => {
    const names = INBOUND_PIPELINE.map((s) => s.step);
    expect(names.indexOf("dedupe")).toBeLessThan(names.indexOf("create"));
  });

  it("never sends a reply automatically", () => {
    const draft = INBOUND_PIPELINE.find((s) => s.step === "draft");
    expect(draft!.detail).toMatch(/never send it automatically/i);
  });
});
