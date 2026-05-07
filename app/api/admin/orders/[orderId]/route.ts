import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";
import { assertCanTransition, TransitionError } from "@/lib/workflow/transitions";
import { sendWorkStartedEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const assignSchema = z.object({
  action: z.literal("assign"),
  designerId: z.string().nullable(),
});

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const { designerId } = parsed.data;

  if (designerId !== null) {
    const designer = await prisma.user.findUnique({
      where: { id: designerId, role: "DESIGNER" },
      select: { id: true },
    });
    if (!designer) {
      return NextResponse.json({ ok: false, message: "Designer not found." }, { status: 404 });
    }
  }

  const existing = await prisma.workflowOrder.findUnique({ where: { id: orderId }, select: { id: true, status: true } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  if (designerId !== null) {
    try {
      assertCanTransition({ from: existing.status, to: "ASSIGNED_TO_DESIGNER", actorRole: session.user.role }, { allowAdminOverride: true });
    } catch (e) {
      if (e instanceof TransitionError) {
        return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
      }
      throw e;
    }

    const updatedOrder = await prisma.workflowOrder.update({
      where: { id: orderId },
      data: {
        assignedToUserId: designerId,
        status: "ASSIGNED_TO_DESIGNER",
        progressPercent: 35,
      },
      include: {
        clientUser: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { name: true } },
      },
    });

    // Send work-started email to client
    if (updatedOrder.clientUser?.email) {
      try {
        await sendWorkStartedEmail({
          to: updatedOrder.clientUser.email,
          clientName: updatedOrder.clientUser.name ?? "Valued Customer",
          orderNumber: updatedOrder.orderNumber,
          orderId: updatedOrder.id,
          designerName: updatedOrder.assignedTo?.name ?? "our designer",
          recipientUserId: updatedOrder.clientUser.id,
        });
      } catch (err) {
        await writeNotificationLog({
          eventType: "WORK_STARTED",
          audience: "CLIENT",
          channel: "EMAIL",
          recipientUserId: updatedOrder.clientUser.id,
          recipientAddress: updatedOrder.clientUser.email,
          orderId: updatedOrder.id,
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  } else {
    try {
      assertCanTransition({ from: existing.status, to: "UNDER_REVIEW", actorRole: session.user.role }, { allowAdminOverride: true });
    } catch (e) {
      if (e instanceof TransitionError) {
        return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
      }
      throw e;
    }

    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: {
        assignedToUserId: null,
        status: "UNDER_REVIEW",
        progressPercent: 20,
        proofReviewNote: null,
      },
    });
  }

  await logActivity({
    actor: { id: session.user.id, email: session.user.email ?? undefined, role: session.user.role ?? undefined },
    action: "designer.assigned",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { designerId: designerId ?? "unassigned" },
  });

  return NextResponse.json({ ok: true });
}
