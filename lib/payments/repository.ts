import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { calculateBalanceDue, deriveInvoiceStatus } from "@/lib/billing/status";
import { sendPaymentSubmittedEmail, sendPaymentRejectedEmail } from "@/lib/notifications/email";
import type {
  ManualPaymentAccountRecord,
  OrderFileRecord,
  PaymentProofRecord,
} from "./types";
import type {
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
} from "./schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decimalToNumber(v: Prisma.Decimal | number | null | undefined) {
  if (v == null) return 0;
  return Number(v);
}

function normalizeRole(v?: string | null): Role | undefined {
  const roles: Role[] = [
    "SUPER_ADMIN",
    "MANAGER",
    "DESIGNER",
    "CHAT_SUPPORT",
    "MARKETING",
    "CLIENT",
  ];
  return v && roles.includes(v as Role) ? (v as Role) : undefined;
}

function mapAccount(
  row: Prisma.ManualPaymentAccountGetPayload<Record<string, never>>
): ManualPaymentAccountRecord {
  return {
    id: row.id,
    type: row.type as ManualPaymentAccountRecord["type"],
    displayName: row.displayName,
    accountName: row.accountName,
    accountId: row.accountId,
    instructions: row.instructions,
    paymentLink: row.paymentLink,
    currency: row.currency,
    isActive: row.isActive,
    notes: row.notes,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const proofInclude = {
  invoice: {
    select: {
      invoiceNumber: true,
      clientName: true,
      clientEmail: true,
      order: { select: { orderNumber: true } },
    },
  },
  clientUser: { select: { name: true } },
  paymentAccount: { select: { displayName: true } },
  reviewedBy: { select: { name: true } },
} satisfies Prisma.PaymentProofSubmissionInclude;

type ProofRow = Prisma.PaymentProofSubmissionGetPayload<{
  include: typeof proofInclude;
}>;

function mapProof(row: ProofRow): PaymentProofRecord {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    invoiceNumber: row.invoice.invoiceNumber,
    orderNumber: row.invoice.order.orderNumber,
    clientUserId: row.clientUserId,
    clientName: row.clientUser?.name ?? row.invoice.clientName,
    clientEmail: row.invoice.clientEmail,
    paymentAccountId: row.paymentAccountId,
    paymentAccountName: row.paymentAccount?.displayName ?? null,
    status: row.status as PaymentProofRecord["status"],
    proofImageKey: row.proofImageKey,
    proofImageBucket: row.proofImageBucket,
    amountClaimed: decimalToNumber(row.amountClaimed),
    clientNotes: row.clientNotes,
    rejectionReason: row.rejectionReason,
    reviewedByName: row.reviewedBy?.name ?? null,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    submittedAt: row.submittedAt.toISOString(),
  };
}

function mapOrderFile(
  row: Prisma.OrderFileGetPayload<{ include: { uploadedBy: { select: { name: true } } } }>
): OrderFileRecord {
  return {
    id: row.id,
    orderId: row.orderId,
    fileName: row.fileName,
    objectKey: row.objectKey,
    bucket: row.bucket,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    fileType: (row.fileType as "PROOF_PREVIEW" | "FINAL_FILE") ?? "FINAL_FILE",
    uploadedByName: row.uploadedBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── Payment Accounts ─────────────────────────────────────────────────────────

export async function getPaymentAccounts(activeOnly = false) {
  const rows = await prisma.manualPaymentAccount.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapAccount);
}

export async function getPaymentAccountById(id: string) {
  const row = await prisma.manualPaymentAccount.findUnique({ where: { id } });
  return row ? mapAccount(row) : null;
}

export async function createPaymentAccount(
  input: CreatePaymentAccountInput,
  actor?: { userId?: string | null; email?: string | null; role?: string | null }
) {
  const row = await prisma.manualPaymentAccount.create({
    data: {
      type: input.type,
      displayName: input.displayName,
      accountName: input.accountName,
      accountId: input.accountId,
      instructions: input.instructions ?? null,
      paymentLink: input.paymentLink ?? null,
      currency: input.currency,
      isActive: input.isActive ?? true,
      notes: input.notes ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: actor?.userId ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: normalizeRole(actor?.role),
      action: "payment_account.created",
      entityType: "ManualPaymentAccount",
      entityId: row.id,
      metadata: { type: row.type, displayName: row.displayName },
    },
  }).catch(() => {});

  return mapAccount(row);
}

export async function updatePaymentAccount(
  id: string,
  input: UpdatePaymentAccountInput,
  actor?: { userId?: string | null; email?: string | null; role?: string | null }
) {
  const before = await prisma.manualPaymentAccount.findUnique({ where: { id } });
  if (!before) throw new Error("Payment account not found.");

  const row = await prisma.manualPaymentAccount.update({
    where: { id },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.accountName !== undefined && { accountName: input.accountName }),
      ...(input.accountId !== undefined && { accountId: input.accountId }),
      ...(input.instructions !== undefined && { instructions: input.instructions }),
      ...(input.paymentLink !== undefined && { paymentLink: input.paymentLink }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: actor?.userId ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: normalizeRole(actor?.role),
      action: "payment_account.updated",
      entityType: "ManualPaymentAccount",
      entityId: row.id,
      metadata: {
        before: { isActive: before.isActive, displayName: before.displayName },
        after: { isActive: row.isActive, displayName: row.displayName },
      },
    },
  }).catch(() => {});

  return mapAccount(row);
}

export async function deletePaymentAccount(
  id: string,
  actor?: { userId?: string | null; email?: string | null; role?: string | null }
) {
  const row = await prisma.manualPaymentAccount.findUnique({ where: { id } });
  if (!row) throw new Error("Payment account not found.");

  await prisma.manualPaymentAccount.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      actorUserId: actor?.userId ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: normalizeRole(actor?.role),
      action: "payment_account.deleted",
      entityType: "ManualPaymentAccount",
      entityId: id,
      metadata: { type: row.type, displayName: row.displayName },
    },
  }).catch(() => {});
}

// ─── Payment Proof Submissions ────────────────────────────────────────────────

export async function getPaymentProofs(status?: "PENDING" | "APPROVED" | "REJECTED") {
  const rows = await prisma.paymentProofSubmission.findMany({
    where: status ? { status } : undefined,
    include: proofInclude,
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(mapProof);
}

export async function getClientPaymentProofs(clientUserId: string, invoiceId: string) {
  const rows = await prisma.paymentProofSubmission.findMany({
    where: { clientUserId, invoiceId },
    include: proofInclude,
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(mapProof);
}

export async function getPaymentProofById(id: string) {
  const row = await prisma.paymentProofSubmission.findUnique({
    where: { id },
    include: proofInclude,
  });
  return row ? mapProof(row) : null;
}

export async function submitPaymentProof(input: {
  invoiceId: string;
  clientUserId: string;
  paymentAccountId?: string | null;
  proofImageKey: string;
  proofImageBucket: string;
  amountClaimed: number;
  clientNotes?: string | null;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    select: {
      id: true,
      clientName: true,
      invoiceNumber: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          clientUserId: true,
          proofStatus: true,
          paymentStatus: true,
        },
      },
    },
  });

  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.order.clientUserId !== input.clientUserId) throw new Error("Forbidden.");

  // Guard: payment proof can be submitted only after client proof approval.
  // Allow NOT_UPLOADED for no-proof jobs where proof workflow is not used.
  const allowedProofStatuses = ["CLIENT_APPROVED", "NOT_UPLOADED"];
  if (!allowedProofStatuses.includes(invoice.order.proofStatus)) {
    throw new Error("Payment proof can be submitted after proof approval.");
  }

  const allowedPaymentStatuses = ["PAYMENT_PENDING", "REJECTED", "PARTIALLY_PAID"];
  if (!allowedPaymentStatuses.includes(invoice.order.paymentStatus)) {
    throw new Error("Payment is not currently pending for this order.");
  }

  const row = await prisma.paymentProofSubmission.create({
    data: {
      invoiceId: input.invoiceId,
      clientUserId: input.clientUserId,
      paymentAccountId: input.paymentAccountId ?? null,
      proofImageKey: input.proofImageKey,
      proofImageBucket: input.proofImageBucket,
      amountClaimed: input.amountClaimed,
      clientNotes: input.clientNotes ?? null,
      status: "PENDING",
    },
    include: proofInclude,
  });

  await prisma.billingAuditLog.create({
    data: {
      invoiceId: input.invoiceId,
      entityType: "PAYMENT",
      entityId: row.id,
      actorUserId: input.clientUserId,
      action: "PROOF_SUBMITTED",
      reason: "Client submitted payment proof.",
      afterJson: {
        proofId: row.id,
        amountClaimed: input.amountClaimed,
        paymentAccountId: input.paymentAccountId ?? null,
      },
    },
  }).catch(() => {});

  // Notify admin/manager about new payment proof (non-fatal)
  const opsEmail = process.env.OPS_EMAIL ?? process.env.EMAIL_FROM_ADDRESS ?? process.env.EMAIL_FROM;
  const opsEmailAddress = opsEmail?.includes("<")
    ? opsEmail.match(/<(.+)>/)?.[1] ?? opsEmail
    : opsEmail;
  if (opsEmailAddress) {
    try {
      await sendPaymentSubmittedEmail({
        to: opsEmailAddress,
        adminName: "Admin",
        orderNumber: invoice.order.orderNumber,
        orderId: invoice.order.id,
        clientName: invoice.clientName,
        amount: input.amountClaimed,
        currency: "USD",
      });
    } catch {
      // non-fatal
    }
  }

  return mapProof(row);
}

export async function reviewPaymentProof(
  proofId: string,
  action: "approve" | "reject",
  actor: { userId: string; email?: string | null; role?: string | null },
  rejectionReason?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const proof = await tx.paymentProofSubmission.findUnique({
      where: { id: proofId },
      include: {
        invoice: {
          include: {
            payments: true,
            order: true,
          },
        },
      },
    });

    if (!proof) throw new Error("Payment proof not found.");
    if (proof.status !== "PENDING") throw new Error("Proof already reviewed.");

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    const updatedProof = await tx.paymentProofSubmission.update({
      where: { id: proofId },
      data: {
        status: newStatus,
        reviewedByUserId: actor.userId,
        reviewedAt: new Date(),
        rejectionReason: action === "reject" ? (rejectionReason ?? null) : null,
      },
    });

    if (action === "approve") {
      const invoice = proof.invoice;
      const paidAmount = invoice.payments.reduce(
        (sum, p) => sum + decimalToNumber(p.amount),
        0
      ) + decimalToNumber(proof.amountClaimed);

      const total = decimalToNumber(invoice.totalAmount);
      const payments = invoice.payments.map((p) => ({
        amount: decimalToNumber(p.amount),
      }));
      payments.push({ amount: decimalToNumber(proof.amountClaimed) });

      const balanceDue = calculateBalanceDue({ total, payments });
      const nextStatus = deriveInvoiceStatus({
        status: invoice.status,
        dueDate: invoice.dueDate,
        total,
        payments,
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount,
          balanceDue,
          status: nextStatus,
          filesUnlocked: true,
          closedAt: nextStatus === "PAID" ? new Date() : invoice.closedAt,
        },
      });

      // Update the WorkflowOrder to reflect payment approval.
      // Only advance to DELIVERED if currently in APPROVED state.
      const order = invoice.order;
      if (order.status === "APPROVED") {
        await tx.workflowOrder.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "DELIVERED",
            progressPercent: 100,
          },
        });
      } else {
        // Order may have been manually advanced — still mark as paid.
        await tx.workflowOrder.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID" },
        });
      }

      await tx.billingAuditLog.create({
        data: {
          invoiceId: invoice.id,
          entityType: "PAYMENT",
          entityId: proofId,
          actorUserId: actor.userId,
          actorEmail: actor.email ?? null,
          actorRole: normalizeRole(actor.role),
          action: "PROOF_APPROVED",
          reason: "Payment proof approved — files unlocked.",
          beforeJson: { invoiceStatus: invoice.status, filesUnlocked: false },
          afterJson: { invoiceStatus: nextStatus, filesUnlocked: true, paidAmount },
        },
      });
    } else {
      // Mark order payment as rejected so client can resubmit.
      await tx.workflowOrder.update({
        where: { id: proof.invoice.orderId },
        data: { paymentStatus: "REJECTED" },
      });

      await tx.billingAuditLog.create({
        data: {
          invoiceId: proof.invoiceId,
          entityType: "PAYMENT",
          entityId: proofId,
          actorUserId: actor.userId,
          actorEmail: actor.email ?? null,
          actorRole: normalizeRole(actor.role),
          action: "PROOF_REJECTED",
          reason: rejectionReason ?? "Payment proof rejected.",
          afterJson: { rejectionReason: rejectionReason ?? null },
        },
      });
    }

    return updatedProof;
  });

  // Send client notification after transaction commits (non-fatal)
  if (action === "reject") {
    try {
      const proof = await prisma.paymentProofSubmission.findUnique({
        where: { id: proofId },
        select: {
          invoice: {
            select: {
              invoiceNumber: true,
              clientName: true,
              clientEmail: true,
              orderId: true,
              order: { select: { orderNumber: true, clientUserId: true } },
            },
          },
        },
      });
      if (proof?.invoice.clientEmail) {
        const i = proof!.invoice;
        await sendPaymentRejectedEmail({
          to: i.clientEmail,
          clientName: i.clientName,
          orderNumber: i.order.orderNumber,
          orderId: i.orderId,
          invoiceNumber: i.invoiceNumber,
          rejectionReason: rejectionReason ?? null,
          recipientUserId: i.order.clientUserId,
        });
      }
    } catch {
      // non-fatal
    }
  }
}

// ─── Order Files ──────────────────────────────────────────────────────────────

export async function getOrderFiles(orderId: string, fileType?: "PROOF_PREVIEW" | "FINAL_FILE") {
  const rows = await prisma.orderFile.findMany({
    where: { orderId, ...(fileType ? { fileType } : {}) },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapOrderFile);
}

export async function getOrderFileById(fileId: string) {
  const row = await prisma.orderFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      orderId: true,
      fileName: true,
      objectKey: true,
      bucket: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return row ?? null;
}

export async function createOrderFile(input: {
  orderId: string;
  uploadedByUserId?: string | null;
  fileName: string;
  objectKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  fileType?: "PROOF_PREVIEW" | "FINAL_FILE";
}) {
  const row = await prisma.orderFile.create({
    data: {
      orderId: input.orderId,
      uploadedByUserId: input.uploadedByUserId ?? null,
      fileName: input.fileName,
      objectKey: input.objectKey,
      bucket: input.bucket,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      fileType: input.fileType ?? "FINAL_FILE",
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: input.uploadedByUserId ?? null,
      action: "order_file.uploaded",
      entityType: "OrderFile",
      entityId: row.id,
      metadata: { orderId: input.orderId, fileName: input.fileName },
    },
  }).catch(() => {});

  return mapOrderFile(row);
}

export async function deleteOrderFile(fileId: string) {
  await prisma.orderFile.delete({ where: { id: fileId } });
}

export async function isInvoiceFilesUnlocked(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { filesUnlocked: true },
  });
  return invoice?.filesUnlocked ?? false;
}
