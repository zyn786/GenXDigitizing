import { describe, expect, it } from "vitest";
import {
  paymentInputSchema,
  auditCodeInputSchema,
  invoiceSendPayloadSchema,
} from "@/lib/billing/schemas";

describe("billing schemas", () => {
  it("accepts valid payment input", () => {
    expect(
      paymentInputSchema.safeParse({
        amount: 120,
        currency: "USD",
        method: "BANK_TRANSFER",
        clientEmail: "client@example.com",
        note: "Paid by client",
      }).success
    ).toBe(true);
  });

  it("rejects payment with non-positive amount", () => {
    expect(
      paymentInputSchema.safeParse({
        amount: -5,
        currency: "USD",
        method: "CARD",
        clientEmail: "client@example.com",
      }).success
    ).toBe(false);
  });

  it("normalises payment method to uppercase", () => {
    const result = paymentInputSchema.safeParse({
      amount: 50,
      currency: "GBP",
      method: "card",
      clientEmail: "client@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.method).toBe("CARD");
  });

  it("rejects invalid audit code (too short)", () => {
    expect(
      auditCodeInputSchema.safeParse({ code: "12" }).success
    ).toBe(false);
  });

  it("accepts valid 6-digit audit code", () => {
    expect(
      auditCodeInputSchema.safeParse({ code: "123456" }).success
    ).toBe(true);
  });

  it("accepts invoice send payload", () => {
    expect(
      invoiceSendPayloadSchema.safeParse({
        clientEmail: "client@example.com",
        backupEmail: "records@example.com",
        reason: "Sending final invoice.",
      }).success
    ).toBe(true);
  });

  it("accepts invoice send payload with no fields (all optional)", () => {
    expect(invoiceSendPayloadSchema.safeParse({}).success).toBe(true);
  });
});