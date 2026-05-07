import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { getOrderFiles } from "@/lib/payments/repository";
import {
  sendProofSentEmail,
  sendProofApprovedByAdminEmail,
  writeNotificationLog,
} from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const PROOF_REVIEW_ROLES = ["SUPER_ADMIN", "MANAGER"] as const;

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!PROOF_REVIEW_ROLES.includes(session.user.role as typeof PROOF_REVIEW_ROLES[number])) {
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

  if (order.proofStatus !== "PENDING_ADMIN_PROOF_REVIEW") {
    return NextResponse.json(
      { ok: false, message: "Proof is not pending admin review." },
      { status: 422 }
    );
  }

  const proofFiles = await getOrderFiles(orderId, "PROOF_PREVIEW");
  if (proofFiles.length === 0) {
    return NextResponse.json(
      { ok: false, message: "No proof preview files found." },
      { status: 422 }
    );
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      proofStatus: "SENT_TO_CLIENT",
      proofSentAt: new Date(),
      proofSentByUserId: session.user.id,
      proofReviewNote: null,
      progressPercent: 70,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "order.proof_approved_by_admin",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber },
  });

  // Notify client
  if (order.clientUser?.email) {
    try {
      await sendProofSentEmail({
        to: order.clientUser.email,
        clientName: order.clientUser.name ?? "Valued Customer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        recipientUserId: order.clientUser.id,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "PROOF_SENT",
        audience: "CLIENT",
        channel: "EMAIL",
        recipientUserId: order.clientUser.id,
        recipientAddress: order.clientUser.email,
        orderId: order.id,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Notify designer
  if (order.assignedTo?.email) {
    try {
      await sendProofApprovedByAdminEmail({
        to: order.assignedTo.email,
        designerName: order.assignedTo.name ?? "Designer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        recipientUserId: order.assignedTo.id,
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({ ok: true });
}
