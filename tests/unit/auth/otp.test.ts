import { describe, expect, it } from "vitest";

import { buildOtpExpiry, generateOtpCode, hashOtpCode, verifyOtpCode } from "@/lib/auth/otp";

describe("otp helpers", () => {
  it("creates a six digit code and verifies its hash", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);

    const hash = hashOtpCode(code);
    expect(verifyOtpCode(code, hash)).toBe(true);
    expect(verifyOtpCode("000000", hash)).toBe(false);
  });

  it("builds a future expiry date", () => {
    const expiry = buildOtpExpiry(10);
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});
