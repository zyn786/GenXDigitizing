import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { assertCanTransition, TransitionError } from "@/lib/workflow/transitions";
import { sendProofApprovedPaymentRequiredEmail, sendNewOrderOpsEmail, sendClientProofApprovedDesignerEmail, writeNotificationLog } from "@/lib/notifications/email";

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
      assignedTo: { select: { id: true, name: true, email: true } },
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

  try {
    assertCanTransition({ from: order.status, to: "APPROVED", actorRole: session.user.role });
  } catch (e) {
    if (e instanceof TransitionError) {
      return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
    }
    throw e;
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

  // Notify ops about client proof approval (non-fatal)
  const opsEmail = process.env.OPS_EMAIL ?? process.env.EMAIL_FROM_ADDRESS ?? process.env.EMAIL_FROM;
  const opsEmailAddress = opsEmail?.includes("<")
    ? opsEmail.match(/<(.+)>/)?.[1] ?? opsEmail
    : opsEmail;
  if (opsEmailAddress) {
    try {
      await sendNewOrderOpsEmail({
        to: opsEmailAddress,
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName: order.clientUser?.name ?? session.user.name ?? "Client",
        clientEmail: order.clientUser?.email ?? session.user.email ?? "",
        serviceType: "Proof approved by client",
      });
    } catch {
      // non-fatal
    }
  }

  // Notify assigned designer about client proof approval (non-fatal)
  if (order.assignedTo?.email) {
    try {
      await sendClientProofApprovedDesignerEmail({
        to: order.assignedTo.email,
        designerName: order.assignedTo.name ?? "Designer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName: order.clientUser?.name ?? session.user.name ?? "Client",
        recipientUserId: order.assignedTo.id,
      });
    } catch {
      // non-fatal
    }
  }

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
