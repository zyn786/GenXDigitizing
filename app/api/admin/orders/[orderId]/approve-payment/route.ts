import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { assertCanTransition, TransitionError } from "@/lib/workflow/transitions";
import { sendFilesUnlockedEmail, sendPaymentRejectedEmail, writeNotificationLog } from "@/lib/notifications/email";

const PAYMENT_APPROVAL_ROLES = ["SUPER_ADMIN", "MANAGER"] as const;

type Props = { params: Promise<{ orderId: string }> };

const schema = z.object({
  proofSubmissionId: z.string().optional(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!PAYMENT_APPROVAL_ROLES.includes(session.user.role as typeof PAYMENT_APPROVAL_ROLES[number])) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          filesUnlocked: true,
          proofSubmissions: {
            where: { status: "PENDING" },
            orderBy: { submittedAt: "desc" },
            take: 1,
            select: { id: true, amountClaimed: true },
          },
        },
      },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  const { action, reason, proofSubmissionId } = parsed.data;
  const invoice = order.invoice;

  if (!invoice) {
    return NextResponse.json({ ok: false, message: "No invoice found for this order." }, { status: 422 });
  }

  if (action === "approve") {
    // Business rule: payment approval requires proof-approved state.
    // The transition guard also enforces APPROVED → DELIVERED,
    // this check provides a clearer error message and defense-in-depth.
    if (order.status !== "APPROVED") {
      return NextResponse.json(
        { ok: false, message: "Order must be in Approved state before payment can be approved." },
        { status: 422 }
      );
    }

    try {
      assertCanTransition({ from: order.status, to: "DELIVERED", actorRole: session.user.role });
    } catch (e) {
      if (e instanceof TransitionError) {
        return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
      }
      throw e;
    }

    const submissionId = proofSubmissionId ?? invoice.proofSubmissions[0]?.id;

    await prisma.$transaction(async (tx) => {
      if (submissionId) {
        await tx.paymentProofSubmission.update({
          where: { id: submissionId },
          data: { status: "APPROVED", reviewedByUserId: session.user.id, reviewedAt: new Date() },
        });
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { filesUnlocked: true, status: "PAID" },
      });

      await tx.workflowOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "DELIVERED",
          progressPercent: 100,
        },
      });
    });

    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "payment.approved_files_unlocked",
      entityType: "WorkflowOrder",
      entityId: orderId,
      metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
    });

    const clientEmail = order.clientUser?.email;
    const clientName = order.clientUser?.name ?? "Valued Customer";
    if (clientEmail) {
      try {
        await sendFilesUnlockedEmail({
          to: clientEmail,
          clientName,
          orderNumber: order.orderNumber,
          orderId: order.id,
          invoiceNumber: invoice.invoiceNumber,
          recipientUserId: order.clientUser?.id ?? null,
        });
      } catch (err) {
        await writeNotificationLog({
          eventType: "FILES_UNLOCKED",
          audience: "CLIENT",
          channel: "EMAIL",
          recipientUserId: order.clientUser?.id ?? null,
          recipientAddress: clientEmail,
          orderId: order.id,
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ ok: true, action: "approved" });
  }

  // reject payment
  const submissionId = proofSubmissionId ?? invoice.proofSubmissions[0]?.id;
  if (submissionId) {
    await prisma.paymentProofSubmission.update({
      where: { id: submissionId },
      data: {
        status: "REJECTED",
        reviewedByUserId: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason ?? null,
      },
    });
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: { paymentStatus: "REJECTED" },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "payment.rejected",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { reason: reason ?? null, invoiceId: invoice.id },
  });

  // Notify client of payment rejection
  const clientEmail = order.clientUser?.email;
  const clientName = order.clientUser?.name ?? "Valued Customer";
  if (clientEmail) {
    try {
      await sendPaymentRejectedEmail({
        to: clientEmail,
        clientName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        invoiceNumber: invoice.invoiceNumber,
        rejectionReason: reason ?? null,
        recipientUserId: order.clientUser?.id ?? null,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "PAYMENT_PENDING",
        audience: "CLIENT",
        channel: "EMAIL",
        recipientUserId: order.clientUser?.id ?? null,
        recipientAddress: clientEmail,
        orderId: order.id,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ ok: true, action: "rejected" });
}
