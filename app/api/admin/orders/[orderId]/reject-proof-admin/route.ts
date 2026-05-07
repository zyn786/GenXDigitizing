import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { assertCanTransition, TransitionError } from "@/lib/workflow/transitions";
import { sendProofRejectedByAdminEmail } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const bodySchema = z.object({
  reviewNote: z.string().min(5, "Feedback must be at least 5 characters."),
});

const PROOF_REVIEW_ROLES = ["SUPER_ADMIN", "MANAGER"] as const;

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!PROOF_REVIEW_ROLES.includes(session.user.role as typeof PROOF_REVIEW_ROLES[number])) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
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

  try {
    assertCanTransition({ from: order.status, to: "IN_PROGRESS", actorRole: session.user.role });
  } catch (e) {
    if (e instanceof TransitionError) {
      return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
    }
    throw e;
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
