import { describe, expect, it } from "vitest";
import { calculateBalanceDue, calculateInvoiceTotal, deriveInvoiceStatus } from "@/lib/billing/status";

describe("billing status helpers", () => {
  it("calculates totals with percentage discounts and tax", () => {
    expect(
      calculateInvoiceTotal({
        lineItems: [{ lineTotal: 100 }],
        discountLines: [{ percentage: 10, appliedAmount: 0 }],
        taxAmount: 5,
      })
    ).toEqual({ subtotal: 100, discountAmount: 10, total: 95 });
  });

  it("marks invoice partially paid when some balance remains", () => {
    expect(
      deriveInvoiceStatus({
        status: "SENT",
        dueDate: "2099-01-01",
        total: 100,
        payments: [{ amount: 25 }],
      })
    ).toBe("PARTIALLY_PAID");
  });

  it("calculates balance due", () => {
    expect(
      calculateBalanceDue({
        total: 100,
        payments: [{ amount: 30 }],
      })
    ).toBe(70);
  });
});