import { describe, it, expect, beforeEach, afterAll } from "vitest";
import crypto from "node:crypto";
import { verifyPayoneerWebhookSignature } from "./client";

/**
 * This function guards the only automated path that can mark an invoice paid.
 *
 * It used to end with `return process.env.NODE_ENV !== "production"` while the
 * route only rejected when `NODE_ENV === "production"` — so on a dev server, a
 * preview, a tunnel, or any box that forgot to set NODE_ENV, an unsigned POST
 * marked invoices paid, added to client LTV and emailed payment confirmations.
 *
 * Every test below that omits a secret is a regression test for that.
 */

const SECRET = "test-secret-not-a-real-credential";
const originalSecret = process.env.PAYONEER_WEBHOOK_SECRET;
const originalEnv = process.env.NODE_ENV;

/** @types/node marks NODE_ENV read-only; the cast is the only way to vary it. */
const setNodeEnv = (value: string) => {
  (process.env as Record<string, string>).NODE_ENV = value;
};

const sign = (body: string, secret = SECRET) =>
  crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");

beforeEach(() => {
  process.env.PAYONEER_WEBHOOK_SECRET = SECRET;
});

afterAll(() => {
  if (originalSecret === undefined) delete process.env.PAYONEER_WEBHOOK_SECRET;
  else process.env.PAYONEER_WEBHOOK_SECRET = originalSecret;
  setNodeEnv(originalEnv ?? "test");
});

describe("with no secret configured", () => {
  it("refuses in every environment, not just production", () => {
    delete process.env.PAYONEER_WEBHOOK_SECRET;
    const body = JSON.stringify({ event_type: "PAYMENT_COMPLETED", status: "SUCCESS" });
    const signature = sign(body);

    for (const env of ["production", "development", "test", ""]) {
      setNodeEnv(env);
      expect(verifyPayoneerWebhookSignature(body, signature)).toBe(false);
    }
  });

  it("refuses an unsigned request even with a valid-looking header absent", () => {
    delete process.env.PAYONEER_WEBHOOK_SECRET;
    expect(verifyPayoneerWebhookSignature("{}", null)).toBe(false);
  });
});

describe("with a secret configured", () => {
  const body = JSON.stringify({ payment_id: "p1", order_id: "o1", amount: 42 });

  it("accepts a correct signature", () => {
    expect(verifyPayoneerWebhookSignature(body, sign(body))).toBe(true);
  });

  it("accepts the sha256= prefix the provider may send", () => {
    expect(verifyPayoneerWebhookSignature(body, `sha256=${sign(body)}`)).toBe(true);
    expect(verifyPayoneerWebhookSignature(body, `SHA256=${sign(body)}`)).toBe(true);
  });

  it("refuses a signature for a different body", () => {
    expect(verifyPayoneerWebhookSignature(body, sign("{}"))).toBe(false);
  });

  it("refuses a signature made with a different secret", () => {
    expect(verifyPayoneerWebhookSignature(body, sign(body, "wrong-secret"))).toBe(false);
  });

  it("refuses a missing signature", () => {
    expect(verifyPayoneerWebhookSignature(body, null)).toBe(false);
    expect(verifyPayoneerWebhookSignature(body, "")).toBe(false);
  });

  /**
   * `crypto.timingSafeEqual` THROWS on a length mismatch rather than returning
   * false, so a junk header used to produce a 500 — which tells the provider to
   * retry a request that can never succeed.
   */
  it("returns false for malformed signatures instead of throwing", () => {
    for (const junk of [
      "nonsense",
      "abc",
      "",
      "sha256=",
      "z".repeat(64), // right length, not hex
      "a".repeat(63), // hex, wrong length
      "a".repeat(65),
      "sha256=not-hex-at-all",
    ]) {
      expect(() => verifyPayoneerWebhookSignature(body, junk)).not.toThrow();
      expect(verifyPayoneerWebhookSignature(body, junk)).toBe(false);
    }
  });

  it("accepts an uppercase hex signature", () => {
    expect(verifyPayoneerWebhookSignature(body, sign(body).toUpperCase())).toBe(true);
  });

  it("is not fooled by surrounding whitespace", () => {
    expect(verifyPayoneerWebhookSignature(body, `  ${sign(body)}  `)).toBe(true);
  });
});
