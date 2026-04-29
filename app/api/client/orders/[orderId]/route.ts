import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";

type Props = { params: Promise<{ orderId: string }> };

const CANCELLABLE_STATUSES = new Set(["SUBMITTED", "DRAFT"]);

const cancelSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().max(500).optional(),
});

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      {
        ok: false,
        blocked: true,
        message:
          "This order is already in production and cannot be cancelled. Please contact support if you need assistance.",
      },
      { status: 422 }
    );
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      progressPercent: 0,
      cancelledAt: new Date(),
      cancelReason: parsed.data.reason ?? null,
      cancelledByUserId: session.user.id,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email ?? undefined, role: session.user.role ?? undefined },
    action: "order.cancelled",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { reason: parsed.data.reason ?? null },
  });

  return NextResponse.json({ ok: true });
}
