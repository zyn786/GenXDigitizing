import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { deriveInvoiceStatus } from "@/lib/billing/status";
import { sendFilesUnlockedEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

function makeReceiptNumber() {
  return `RCT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false, message: "Only Super Admin or Manager can manually unlock files." }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          filesUnlocked: true,
          totalAmount: true,
          paidAmount: true,
          balanceDue: true,
          currency: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    if (order.invoice) {
      const totalAmount = Number(order.invoice.totalAmount);
      const currentPaid = Number(order.invoice.paidAmount);

      // Record a payment for the remaining balance to keep accounting consistent
      if (totalAmount > currentPaid) {
        const remainingBalance = totalAmount - currentPaid;
        await tx.payment.create({
          data: {
            receiptNumber: makeReceiptNumber(),
            invoiceId: order.invoice.id,
            amount: remainingBalance,
            currency: order.invoice.currency,
            method: "OTHER",
            reference: "Admin manual unlock",
            clientEmail: order.clientUser?.email ?? "",
            receivedAt: new Date(),
            note: `Manually recorded by ${session.user.name ?? session.user.email} (admin override — files unlocked).`,
          },
        });
      }

      const allPayments = await tx.payment.findMany({
        where: { invoiceId: order.invoice.id },
        select: { amount: true },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDue = Math.max(0, totalAmount - totalPaid);

      const nextStatus = deriveInvoiceStatus({
        status: order.invoice.status,
        dueDate: order.invoice.dueDate.toISOString(),
        total: totalAmount,
        payments: allPayments.map((p) => ({ amount: Number(p.amount) })),
      });

      await tx.invoice.update({
        where: { id: order.invoice.id },
        data: {
          filesUnlocked: true,
          paidAmount: totalPaid,
          balanceDue,
          status: nextStatus,
        },
      });
    }

    await tx.workflowOrder.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    });
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role },
    action: "files.manually_unlocked",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { invoiceId: order.invoice?.id ?? null },
  });

  const clientEmail = order.clientUser?.email;
  const clientName = order.clientUser?.name ?? "Valued Customer";
  if (clientEmail && order.invoice) {
    try {
      await sendFilesUnlockedEmail({
        to: clientEmail,
        clientName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        invoiceNumber: order.invoice.invoiceNumber,
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

  return NextResponse.json({ ok: true });
}
