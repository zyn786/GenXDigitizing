import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

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

  const existing = await prisma.workflowOrder.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: { assignedToUserId: designerId },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email ?? undefined, role: session.user.role ?? undefined },
    action: "designer.assigned",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { designerId: designerId ?? "unassigned" },
  });

  return NextResponse.json({ ok: true });
}
