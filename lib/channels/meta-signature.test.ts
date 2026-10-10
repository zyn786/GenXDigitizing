import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { checkMetaSignature, verifyMetaSignature } from "./meta-signature";

const SECRET = "test-app-secret";
const BODY = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

function sign(body: string, secret = SECRET): string {
  return "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

describe("checkMetaSignature", () => {
  it("accepts a correctly signed body", () => {
    expect(checkMetaSignature(BODY, sign(BODY), SECRET)).toEqual({ ok: true });
  });

  it("rejects a body that changed by one character", () => {
    const tampered = BODY.replace("whatsapp_business_account", "whatsapp_business_account ");
    const res = checkMetaSignature(tampered, sign(BODY), SECRET);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/did not match/);
  });

  it("rejects a signature made with the wrong secret", () => {
    expect(checkMetaSignature(BODY, sign(BODY, "not-the-secret"), SECRET).ok).toBe(false);
  });

  it("fails closed when no secret is configured", () => {
    // The bug this codebase already shipped once in the Resend webhook: an
    // unset secret returning true turns the endpoint public, and this one
    // creates leads and notifies staff.
    for (const missing of [null, undefined, ""]) {
      const res = checkMetaSignature(BODY, sign(BODY), missing as any);
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/no app secret/);
    }
  });

  it("rejects a missing or malformed header rather than throwing", () => {
    expect(checkMetaSignature(BODY, null, SECRET).ok).toBe(false);
    expect(checkMetaSignature(BODY, "", SECRET).ok).toBe(false);
    expect(checkMetaSignature(BODY, "sha1=deadbeef", SECRET).ok).toBe(false);
    expect(checkMetaSignature(BODY, "sha256=nothex", SECRET).ok).toBe(false);
    expect(checkMetaSignature(BODY, "sha256=" + "a".repeat(64), SECRET).ok).toBe(false);
  });

  it("accepts an uppercase hex signature", () => {
    const upper = sign(BODY).toUpperCase().replace("SHA256=", "sha256=");
    expect(checkMetaSignature(BODY, upper, SECRET).ok).toBe(true);
  });

  it("verifies the exact bytes, not a re-serialised object", () => {
    // Key order and whitespace differ after a parse/stringify round trip, so a
    // route that parses before verifying fails every genuine delivery.
    const spaced = '{ "a" : 1 }';
    expect(checkMetaSignature(spaced, sign(spaced), SECRET).ok).toBe(true);
    expect(checkMetaSignature(JSON.stringify(JSON.parse(spaced)), sign(spaced), SECRET).ok).toBe(
      false
    );
  });
});

describe("verifyMetaSignature", () => {
  it("is the boolean view of the same check", () => {
    expect(verifyMetaSignature(BODY, sign(BODY), SECRET)).toBe(true);
    expect(verifyMetaSignature(BODY, sign(BODY), null as any)).toBe(false);
  });
});
