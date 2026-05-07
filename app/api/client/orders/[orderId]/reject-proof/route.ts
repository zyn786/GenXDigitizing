import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { assertCanTransition, TransitionError } from "@/lib/workflow/transitions";
import { sendClientProofRejectedEmail } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const bodySchema = z.object({
  reason: z.string().min(1, "A reason is required to reject the proof.").max(2000),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "A rejection reason is required." },
      { status: 400 }
    );
  }

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      proofStatus: true,
      clientUser: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  if (order.status !== "PROOF_READY") {
    return NextResponse.json(
      { ok: false, message: "No proof is awaiting your review." },
      { status: 422 }
    );
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
      status: "IN_PROGRESS",
      proofStatus: "INTERNAL_REVIEW",
      proofReviewNote: parsed.data.reason,
      progressPercent: 50,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "order.proof_rejected_by_client",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, reason: parsed.data.reason },
  });

  // Notify ops + assigned designer about client proof rejection (non-fatal)
  const clientName = order.clientUser?.name ?? session.user.name ?? "Client";
  const opsEmail = process.env.OPS_EMAIL ?? process.env.EMAIL_FROM_ADDRESS ?? process.env.EMAIL_FROM;
  const opsEmailAddress = opsEmail?.includes("<")
    ? opsEmail.match(/<(.+)>/)?.[1] ?? opsEmail
    : opsEmail;
  if (opsEmailAddress) {
    try {
      await sendClientProofRejectedEmail({
        to: opsEmailAddress,
        recipientName: "Admin",
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName,
        rejectionReason: parsed.data.reason,
        role: "ops",
      });
    } catch {
      // non-fatal
    }
  }
  if (order.assignedTo?.email) {
    try {
      await sendClientProofRejectedEmail({
        to: order.assignedTo.email,
        recipientName: order.assignedTo.name ?? "Designer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName,
        rejectionReason: parsed.data.reason,
        role: "designer",
        recipientUserId: order.assignedTo.id,
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({ ok: true });
}
