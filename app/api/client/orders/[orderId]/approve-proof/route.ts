import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { sendProofApprovedPaymentRequiredEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, currency: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  if (order.status !== "PROOF_READY") {
    return NextResponse.json({ ok: false, message: "No proof is awaiting your approval." }, { status: 422 });
  }
  if (
    order.proofStatus !== "SENT_TO_CLIENT" &&
    order.proofStatus !== "CLIENT_REVIEWING"
  ) {
    return NextResponse.json(
      { ok: false, message: "Proof is not available for review." },
      { status: 400 }
    );
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      status: "APPROVED",
      proofStatus: "CLIENT_APPROVED",
      proofApprovedAt: new Date(),
      paymentStatus: "PAYMENT_PENDING",
      progressPercent: 90,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "order.proof_approved_by_client",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber },
  });

  const clientEmail = order.clientUser?.email;
  const clientName = order.clientUser?.name ?? "Valued Customer";
  if (clientEmail && order.invoice) {
    try {
      await sendProofApprovedPaymentRequiredEmail({
        to: clientEmail,
        clientName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        invoiceId: order.invoice.id,
        amount: Number(order.invoice.totalAmount),
        currency: order.invoice.currency,
        recipientUserId: order.clientUser?.id ?? null,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "PAYMENT_REQUIRED",
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
