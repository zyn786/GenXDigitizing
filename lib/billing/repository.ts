import { InvoiceStatus, PaymentMethod, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { calculateBalanceDue, deriveInvoiceStatus } from "@/lib/billing/status";
import type {
  InvoiceDetailRecord,
  InvoiceRecord,
  PaymentRecord,
  InvoiceLineItemRecord,
  InvoiceDiscountRecord,
} from "@/lib/billing/types";

const invoiceListInclude = {
  order: true,
} satisfies Prisma.InvoiceInclude;

const invoiceDetailInclude = {
  order: true,
  lineItems: {
    orderBy: { position: "asc" as const },
  },
  discountLines: true,
  payments: {
    orderBy: { receivedAt: "desc" as const },
  },
} satisfies Prisma.InvoiceInclude;

type AuditActor = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
  keyUnlockUsed?: boolean;
  reason?: string | null;
};

type AddPaymentInput = {
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string | null;
  clientEmail: string;
  backupEmail?: string | null;
  receivedAt?: string;
  note?: string | null;
};

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeRole(value?: string | null): Role | undefined {
  if (!value) return undefined;

  const roles: Role[] = [
    "SUPER_ADMIN",
    "MANAGER",
    "DESIGNER",
    "CHAT_SUPPORT",
    "MARKETING",
    "CLIENT",
  ];

  return roles.includes(value as Role) ? (value as Role) : undefined;
}

function mapInvoiceListRecord(
  invoice: Prisma.InvoiceGetPayload<{ include: typeof invoiceListInclude }>
): InvoiceRecord {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    backupEmail: invoice.backupEmail,
    currency: invoice.currency,
    status: invoice.status,
    dueDate: toDateOnly(invoice.dueDate),
    subtotal: decimalToNumber(invoice.subtotalAmount),
    taxAmount: decimalToNumber(invoice.taxAmount),
    discountAmount: decimalToNumber(invoice.discountAmount),
    total: decimalToNumber(invoice.totalAmount),
    paidAmount: decimalToNumber(invoice.paidAmount),
    balanceDue: decimalToNumber(invoice.balanceDue),
    sentAt: toIsoDate(invoice.sentAt),
    notes: invoice.notes,
  };
}

function mapLineItem(
  item: Prisma.InvoiceLineItemGetPayload<Record<string, never>>
): InvoiceLineItemRecord {
  return {
    id: item.id,
    label: item.label,
    description: item.description,
    quantity: item.quantity,
    unitPrice: decimalToNumber(item.unitPrice),
    lineTotal: decimalToNumber(item.lineTotal),
    position: item.position,
  };
}

function mapDiscount(
  item: Prisma.InvoiceDiscountGetPayload<Record<string, never>>
): InvoiceDiscountRecord {
  return {
    id: item.id,
    label: item.label,
    source: item.source,
    percentage: decimalToNumber(item.percentage),
    appliedAmount: decimalToNumber(item.appliedAmount),
    approvalNote: item.approvalNote,
  };
}

function mapPayment(
  item: Prisma.PaymentGetPayload<Record<string, never>>
): PaymentRecord {
  return {
    id: item.id,
    receiptNumber: item.receiptNumber,
    amount: decimalToNumber(item.amount),
    currency: item.currency,
    method: item.method,
    reference: item.reference,
    clientEmail: item.clientEmail,
    backupEmail: item.backupEmail,
    receiptSentAt: toIsoDate(item.receiptSentAt),
    receivedAt: item.receivedAt.toISOString(),
    note: item.note,
  };
}

function mapInvoiceDetailRecord(
  invoice: Prisma.InvoiceGetPayload<{ include: typeof invoiceDetailInclude }>
): InvoiceDetailRecord {
  return {
    ...mapInvoiceListRecord(invoice),
    lineItems: invoice.lineItems.map(mapLineItem),
    discountLines: invoice.discountLines.map(mapDiscount),
    payments: invoice.payments.map(mapPayment),
  };
}

function makeReceiptNumber() {
  return `RCT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function getClientInvoices(clientUserId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      order: {
        clientUserId,
      },
    },
    include: invoiceListInclude,
    orderBy: { createdAt: "desc" },
  });

  return invoices.map(mapInvoiceListRecord);
}

export async function getAdminInvoices() {
  const invoices = await prisma.invoice.findMany({
    include: invoiceListInclude,
    orderBy: { createdAt: "desc" },
  });

  return invoices.map(mapInvoiceListRecord);
}

export async function getClientInvoiceById(
  clientUserId: string,
  invoiceId: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      order: {
        clientUserId,
      },
    },
    include: invoiceDetailInclude,
  });

  return invoice ? mapInvoiceDetailRecord(invoice) : null;
}

export async function getAdminInvoiceById(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: invoiceDetailInclude,
  });

  return invoice ? mapInvoiceDetailRecord(invoice) : null;
}

export async function addPayment(
  invoiceId: string,
  input: AddPaymentInput,
  actor?: AuditActor
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        recordedByUserId: actor?.userId ?? null,
        receiptNumber: makeReceiptNumber(),
        amount: input.amount,
        currency: input.currency,
        method: input.method,
        reference: input.reference ?? null,
        clientEmail: input.clientEmail,
        backupEmail: input.backupEmail ?? null,
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
        note: input.note ?? null,
      },
    });

    const payments = [...invoice.payments, payment].map((item) => ({
      amount: decimalToNumber(item.amount),
    }));

    const paidAmount = payments.reduce((sum, item) => sum + item.amount, 0);
    const total = decimalToNumber(invoice.totalAmount);
    const balanceDue = calculateBalanceDue({
      total,
      payments,
    });

    const nextStatus = deriveInvoiceStatus({
      status: invoice.status,
      dueDate: invoice.dueDate,
      total,
      payments,
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount,
        balanceDue,
        status: nextStatus,
        closedAt: nextStatus === "PAID" ? new Date() : invoice.closedAt,
      },
    });

    await tx.billingAuditLog.create({
      data: {
        invoiceId: invoice.id,
        paymentId: payment.id,
        entityType: "PAYMENT",
        entityId: payment.id,
        actorUserId: actor?.userId ?? null,
        actorEmail: actor?.email ?? null,
        actorRole: normalizeRole(actor?.role),
        action: "PAYMENT_RECORDED",
        reason: actor?.reason ?? "Manual payment recorded.",
        beforeJson: Prisma.JsonNull,
        afterJson: {
          receiptNumber: payment.receiptNumber,
          amount: payment.amount.toString(),
          currency: payment.currency,
          invoiceStatus: updatedInvoice.status,
        },
        keyUnlockUsed: actor?.keyUnlockUsed ?? false,
      },
    });

    return { payment, invoice: updatedInvoice };
  });
}

export async function markInvoiceSent(invoiceId: string, actor?: AuditActor) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    const computedStatus: InvoiceStatus =
      invoice.balanceDue.gt(0) && invoice.dueDate.getTime() < Date.now()
        ? "OVERDUE"
        : invoice.status === "PAID"
          ? "PAID"
          : "SENT";

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        sentAt: invoice.sentAt ?? new Date(),
        status: computedStatus,
      },
    });

    await tx.billingAuditLog.create({
      data: {
        invoiceId: invoice.id,
        entityType: "INVOICE",
        entityId: invoice.id,
        actorUserId: actor?.userId ?? null,
        actorEmail: actor?.email ?? null,
        actorRole: normalizeRole(actor?.role),
        action: "INVOICE_SENT",
        reason: actor?.reason ?? "Invoice marked as sent.",
        beforeJson: {
          status: invoice.status,
          sentAt: invoice.sentAt?.toISOString() ?? null,
        },
        afterJson: {
          status: updatedInvoice.status,
          sentAt: updatedInvoice.sentAt?.toISOString() ?? null,
        },
        keyUnlockUsed: actor?.keyUnlockUsed ?? false,
      },
    });

    return updatedInvoice;
  });
}