import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { applyOrderIntakeValidation } from "@/lib/workflow/order-intake-validator";

type Props = { params: Promise<{ orderId: string }> };

const CANCELLABLE_STATUSES = new Set(["SUBMITTED", "DRAFT"]);
const EDITABLE_STATUSES = new Set(["SUBMITTED", "DRAFT"]);

const cancelSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().max(500).optional(),
});

const editSchema = z.object({
  action: z.literal("edit"),
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).optional().nullable(),
  placement: z.string().max(100).optional().nullable(),
  fabricType: z.string().max(100).optional().nullable(),
  designHeightIn: z.number().positive().max(30).optional().nullable(),
  designWidthIn: z.number().positive().max(30).optional().nullable(),
  colorQuantity: z.number().int().min(1).max(200).optional().nullable(),
  specialInstructions: z.string().max(2000).optional().nullable(),
});

const schema = z.discriminatedUnion("action", [cancelSchema, editSchema]);

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
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

  if (parsed.data.action === "cancel") {
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

  // Edit action
  if (!EDITABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      { ok: false, message: "Order cannot be edited once production has started." },
      { status: 422 }
    );
  }

  const { title, notes, placement, fabricType, designHeightIn, designWidthIn, colorQuantity, specialInstructions } =
    parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.workflowOrder.update as any)({
    where: { id: orderId },
    data: {
      ...(title !== undefined && { title }),
      ...(notes !== undefined && { notes }),
      ...(placement !== undefined && { placement }),
      ...(fabricType !== undefined && { fabricType }),
      ...(designHeightIn !== undefined && { designHeightIn }),
      ...(designWidthIn !== undefined && { designWidthIn }),
      ...(colorQuantity !== undefined && { colorQuantity }),
      ...(specialInstructions !== undefined && { specialInstructions }),
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email ?? undefined, role: session.user.role ?? undefined },
    action: "order.updated",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { updatedFields: Object.keys(parsed.data).filter((k) => k !== "action") },
  });

  // Re-validate order intake — status may change to DRAFT if missing details, or SUBMITTED if now complete
  await applyOrderIntakeValidation({
    orderId,
    actor: { id: session.user.id, email: session.user.email ?? undefined, role: session.user.role ?? undefined },
  }).catch(() => {
    // non-fatal — validation failure should not break the edit response
  });

  return NextResponse.json({ ok: true });
}
