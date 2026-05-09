import { describe, expect, it } from "vitest";

import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within the window", () => {
    const key = `test-allow-${Date.now()}`;
    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("blocks after maxRequests exceeded", () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after window expires", async () => {
    const key = `test-reset-${Date.now()}`;
    checkRateLimit(key, 1, 50);
    checkRateLimit(key, 1, 50); // hits limit

    await new Promise((resolve) => setTimeout(resolve, 100));

    const after = checkRateLimit(key, 1, 50);
    expect(after.allowed).toBe(true);
  });

  it("uses separate counters for different keys", () => {
    const k1 = `key-a-${Date.now()}`;
    const k2 = `key-b-${Date.now()}`;

    checkRateLimit(k1, 1, 60_000);
    checkRateLimit(k1, 1, 60_000); // k1 blocked

    const k2result = checkRateLimit(k2, 1, 60_000);
    expect(k2result.allowed).toBe(true); // k2 not affected
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.5" });
    expect(getClientIp(headers)).toBe("203.0.113.5");
  });

  it("returns unknown when no IP header present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
