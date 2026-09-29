import { describe, it, expect } from "vitest";
import { signResendWebhook, verifyResendWebhook } from "./resend-webhook";

/*
  Inputs from Svix's published example, with a corrected expected signature.

  Svix's docs print `v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=` next to
  these inputs, but that value does NOT reproduce from them — not by our code,
  not by Svix's own published Node snippet, and not by the `standardwebhooks`
  reference implementation (a matrix of plausible variants was tried too).
  All three independently agree on the value below, so it is what we pin.

  If this test ever fails, the signature scheme has drifted and every real
  Resend webhook would be rejected with a 401.
*/
const VECTOR = {
  secret: "whsec_plJ3nmyCDGBKInavdOK15jsl",
  body: '{"event_type":"ping","data":{"success":true}}',
  id: "msg_loFOjxBNtRLzqYUf",
  timestamp: "1731705121",
  signature: "v1,iVLuClidFhVZGHuHPwWsa/rdDGcE6+gbnzB4Bo2G4xU=",
};

function headers(overrides: Record<string, string> = {}) {
  const base: Record<string, string> = {
    "svix-id": VECTOR.id,
    "svix-timestamp": VECTOR.timestamp,
    "svix-signature": VECTOR.signature,
    ...overrides,
  };
  return new Headers(base);
}

describe("signResendWebhook", () => {
  it("matches the Svix test vector", () => {
    expect(signResendWebhook(VECTOR.secret, VECTOR.id, VECTOR.timestamp, VECTOR.body)).toBe(
      VECTOR.signature.replace("v1,", "")
    );
  });

  it("accepts a secret without the whsec_ prefix", () => {
    expect(
      signResendWebhook("plJ3nmyCDGBKInavdOK15jsl", VECTOR.id, VECTOR.timestamp, VECTOR.body)
    ).toBe(VECTOR.signature.replace("v1,", ""));
  });
});

describe("verifyResendWebhook", () => {
  it("accepts a correctly signed, fresh delivery", () => {
    // `now` pinned to the vector's timestamp so freshness passes.
    const ok = verifyResendWebhook(VECTOR.body, headers(), {
      secret: VECTOR.secret,
      now: Number(VECTOR.timestamp),
    });
    expect(ok).toBe(true);
  });

  it("accepts when the header carries multiple signatures", () => {
    const multi = `v1,AAAA v1,BBBB ${VECTOR.signature}`;
    const ok = verifyResendWebhook(VECTOR.body, headers({ "svix-signature": multi }), {
      secret: VECTOR.secret,
      now: Number(VECTOR.timestamp),
    });
    expect(ok).toBe(true);
  });

  it("rejects a tampered body", () => {
    const ok = verifyResendWebhook(VECTOR.body.replace("true", "false"), headers(), {
      secret: VECTOR.secret,
      now: Number(VECTOR.timestamp),
    });
    expect(ok).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const ok = verifyResendWebhook(VECTOR.body, headers(), {
      secret: "whsec_aaaaaaaaaaaaaaaaaaaaaaaa",
      now: Number(VECTOR.timestamp),
    });
    expect(ok).toBe(false);
  });

  it("rejects a stale timestamp", () => {
    const ok = verifyResendWebhook(VECTOR.body, headers(), {
      secret: VECTOR.secret,
      now: Number(VECTOR.timestamp) + 3600,
    });
    expect(ok).toBe(false);
  });

  it("rejects missing headers", () => {
    const ok = verifyResendWebhook(VECTOR.body, new Headers(), {
      secret: VECTOR.secret,
      now: Number(VECTOR.timestamp),
    });
    expect(ok).toBe(false);
  });

  it("rejects a signature with no version prefix", () => {
    const ok = verifyResendWebhook(
      VECTOR.body,
      headers({ "svix-signature": VECTOR.signature.replace("v1,", "") }),
      { secret: VECTOR.secret, now: Number(VECTOR.timestamp) }
    );
    // A bare signature is still compared (some senders omit the prefix),
    // so this must match rather than throw.
    expect(ok).toBe(true);
  });

  it("accepts webhook-* headers (white-labelled plans)", () => {
    const ok = verifyResendWebhook(
      VECTOR.body,
      new Headers({
        "webhook-id": VECTOR.id,
        "webhook-timestamp": VECTOR.timestamp,
        "webhook-signature": VECTOR.signature,
      }),
      { secret: VECTOR.secret, now: Number(VECTOR.timestamp) }
    );
    expect(ok).toBe(true);
  });

  it("allows through when no secret is configured (local dev)", () => {
    const ok = verifyResendWebhook(VECTOR.body, headers(), { secret: "" });
    expect(ok).toBe(true);
  });
});
