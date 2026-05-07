import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { assertCanTransition, TransitionError } from "@/lib/workflow/transitions";
import { sendRevisionPendingEmail, sendClientRevisionRequestedEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const revisionSchema = z.object({
  clientNotes: z.string().min(5).max(2000),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = revisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Please describe what needs to be revised." }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  if (order.status !== "PROOF_READY") {
    return NextResponse.json({ ok: false, message: "Revision can only be requested when a proof is ready." }, { status: 422 });
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
    assertCanTransition({ from: order.status, to: "REVISION_REQUESTED", actorRole: session.user.role });
  } catch (e) {
    if (e instanceof TransitionError) {
      return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
    }
    throw e;
  }

  await prisma.$transaction([
    prisma.workflowOrder.update({
      where: { id: orderId },
      data: {
        status: "REVISION_REQUESTED",
        proofStatus: "REVISION_REQUESTED",
        revisionCount: { increment: 1 },
        progressPercent: 75,
      },
    }),
    prisma.orderRevision.create({
      data: {
        orderId,
        status: "REQUESTED_BY_CLIENT",
        requestedByUserId: session.user.id,
        clientNotes: parsed.data.clientNotes,
        versionLabel: `Revision ${(order.revisionCount ?? 0) + 1}`,
      },
    }),
  ]);

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "order.revision_requested_by_client",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, notes: parsed.data.clientNotes },
  });

  const clientEmail = order.clientUser?.email;
  const clientName = order.clientUser?.name ?? "Valued Customer";
  if (clientEmail) {
    try {
      await sendRevisionPendingEmail({
        to: clientEmail,
        clientName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        recipientUserId: order.clientUser?.id ?? null,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "REVISION_PENDING",
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

  // Notify ops + assigned designer about revision request (non-fatal)
  const opsEmail = process.env.OPS_EMAIL ?? process.env.EMAIL_FROM_ADDRESS ?? process.env.EMAIL_FROM;
  const opsEmailAddress = opsEmail?.includes("<")
    ? opsEmail.match(/<(.+)>/)?.[1] ?? opsEmail
    : opsEmail;
  const newRevisionCount = (order.revisionCount ?? 0) + 1;
  if (opsEmailAddress) {
    try {
      await sendClientRevisionRequestedEmail({
        to: opsEmailAddress,
        recipientName: "Admin",
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName: clientName,
        clientNotes: parsed.data.clientNotes,
        revisionCount: newRevisionCount,
        role: "ops",
      });
    } catch {
      // non-fatal
    }
  }
  if (order.assignedTo?.email) {
    try {
      await sendClientRevisionRequestedEmail({
        to: order.assignedTo.email,
        recipientName: order.assignedTo.name ?? "Designer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName: clientName,
        clientNotes: parsed.data.clientNotes,
        revisionCount: newRevisionCount,
        role: "designer",
        recipientUserId: order.assignedTo.id,
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({ ok: true });
}
