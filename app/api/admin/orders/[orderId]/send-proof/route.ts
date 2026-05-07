import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";
import { getOrderFiles } from "@/lib/payments/repository";
import { assertCanTransition, TransitionError } from "@/lib/workflow/transitions";
import {
  sendProofSentEmail,
  sendProofPendingAdminReviewEmail,
  writeNotificationLog,
} from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

// PROOF_REJECTED_BY_ADMIN is a ProofStatus value, not a WorkflowOrderStatus.
// It was dead code in this WorkflowOrderStatus check and has been removed.
const SENDABLE_STATUSES = ["ASSIGNED_TO_DESIGNER", "IN_PROGRESS", "REVISION_REQUESTED"];

async function isAdminReviewEnabled(): Promise<boolean> {
  const config = await prisma.pricingConfig.findUnique({
    where: { key: "admin_proof_review_enabled" },
    select: { value: true },
  });
  return config?.value === "true";
}

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  if (!SENDABLE_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { ok: false, message: "Order must be assigned, in progress, in revision state, or proof rejected to submit proof." },
      { status: 422 }
    );
  }

  const proofFiles = await getOrderFiles(orderId, "PROOF_PREVIEW");
  if (proofFiles.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Upload at least one proof preview image before sending." },
      { status: 422 }
    );
  }

  const adminReview = await isAdminReviewEnabled();

  try {
    assertCanTransition({ from: order.status, to: "PROOF_READY", actorRole: session.user.role });
  } catch (e) {
    if (e instanceof TransitionError) {
      return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
    }
    throw e;
  }

  if (adminReview && session.user.role === "DESIGNER") {
    // Route to admin review queue instead of sending directly to client
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: {
        status: "PROOF_READY",
        proofStatus: "PENDING_ADMIN_PROOF_REVIEW",
        proofReviewNote: null,
        progressPercent: 65,
      },
    });

    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "order.proof_submitted_for_admin_review",
      entityType: "WorkflowOrder",
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber },
    });

    // Notify ops/admin team
    const opsEmail = process.env.OPS_EMAIL ?? process.env.EMAIL_FROM_ADDRESS ?? process.env.EMAIL_FROM;
    const opsEmailAddress = opsEmail?.includes("<")
      ? opsEmail.match(/<(.+)>/)?.[1] ?? opsEmail
      : opsEmail;
    if (opsEmailAddress) {
      try {
        await sendProofPendingAdminReviewEmail({
          to: opsEmailAddress,
          adminName: "Admin",
          orderNumber: order.orderNumber,
          orderId: order.id,
          designerName: order.assignedTo?.name ?? session.user.name ?? "Designer",
        });
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ ok: true, adminReview: true });
  }

  // Send directly to client (admin review disabled or sender is admin/manager)
  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      status: "PROOF_READY",
      proofStatus: "SENT_TO_CLIENT",
      proofSentAt: new Date(),
      proofSentByUserId: session.user.id,
      proofReviewNote: null,
      progressPercent: 70,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "order.proof_sent_to_client",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber },
  });

  const clientEmail = order.clientUser?.email;
  const clientName = order.clientUser?.name ?? "Valued Customer";
  if (clientEmail) {
    try {
      await sendProofSentEmail({
        to: clientEmail,
        clientName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        recipientUserId: order.clientUser?.id ?? null,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "PROOF_SENT",
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

  return NextResponse.json({ ok: true, adminReview: false });
}
