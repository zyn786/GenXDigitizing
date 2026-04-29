import type { InvoiceStatus } from "@/lib/billing/types";

type StatusInput = {
  status?: InvoiceStatus;
  dueDate: string | Date;
  total: number;
  payments: { amount: number }[];
};

type TotalInput = {
  lineItems: { lineTotal: number }[];
  discountLines: { appliedAmount: number; percentage: number }[];
  taxAmount: number;
};

type BalanceInput = {
  total: number;
  payments: { amount: number }[];
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateInvoiceTotal(input: TotalInput) {
  const subtotal = roundMoney(
    input.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
  );

  const computedDiscount = roundMoney(
    input.discountLines.reduce((sum, item) => {
      if (item.appliedAmount > 0) {
        return sum + item.appliedAmount;
      }

      return sum + subtotal * (item.percentage / 100);
    }, 0)
  );

  const total = roundMoney(
    Math.max(0, subtotal - computedDiscount + input.taxAmount)
  );

  return {
    subtotal,
    discountAmount: computedDiscount,
    total,
  };
}

export function calculateBalanceDue(input: BalanceInput) {
  const paid = roundMoney(
    input.payments.reduce((sum, payment) => sum + payment.amount, 0)
  );

  return roundMoney(Math.max(0, input.total - paid));
}

export function deriveInvoiceStatus(input: StatusInput): InvoiceStatus {
  if (input.status === "CANCELLED") {
    return "CANCELLED";
  }

  const paid = roundMoney(
    input.payments.reduce((sum, payment) => sum + payment.amount, 0)
  );

  if (paid >= input.total && input.total > 0) {
    return "PAID";
  }

  if (paid > 0 && paid < input.total) {
    return "PARTIALLY_PAID";
  }

  const dueAt = new Date(input.dueDate);
  const isOverdue =
    !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < Date.now();

  if (isOverdue && (input.status === "SENT" || input.status === "OVERDUE")) {
    return "OVERDUE";
  }

  return input.status ?? "DRAFT";
}