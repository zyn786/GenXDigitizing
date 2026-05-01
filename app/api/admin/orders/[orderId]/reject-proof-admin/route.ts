import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";
import { sendProofRejectedByAdminEmail } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const bodySchema = z.object({
  reviewNote: z.string().min(5, "Feedback must be at least 5 characters."),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  if (session.user.role === "DESIGNER") {
    return NextResponse.json({ ok: false, message: "Designers cannot reject proofs." }, { status: 403 });
  }

  const { orderId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const { reviewNote } = parsed.data;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: {
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

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      proofStatus: "PROOF_REJECTED_BY_ADMIN",
      proofReviewNote: reviewNote,
      status: "IN_PROGRESS",
      progressPercent: 50,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "order.proof_rejected_by_admin",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, reviewNote },
  });

  // Notify designer
  if (order.assignedTo?.email) {
    try {
      await sendProofRejectedByAdminEmail({
        to: order.assignedTo.email,
        designerName: order.assignedTo.name ?? "Designer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        reviewNote,
        recipientUserId: order.assignedTo.id,
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({ ok: true });
}
