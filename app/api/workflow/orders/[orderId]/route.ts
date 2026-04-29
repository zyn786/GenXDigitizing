import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { getAdminOrder } from "@/lib/workflow/repository";
import { logActivity } from "@/lib/activity/logger";
import {
  sendProofReadyEmail,
  sendRevisionPendingEmail,
  sendFilesDeliveredEmail,
  writeNotificationLog,
} from "@/lib/notifications/email";

type Props = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;
  const order = await getAdminOrder(orderId);

  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}

const PROGRESS: Record<string, number> = {
  SUBMITTED: 15,
  IN_PROGRESS: 50,
  PROOF_READY: 70,
  REVISION_REQUESTED: 75,
  APPROVED: 90,
  DELIVERED: 100,
  CLOSED: 100,
  CANCELLED: 0,
};

const patchSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "IN_PROGRESS",
    "PROOF_READY",
    "REVISION_REQUESTED",
    "APPROVED",
    "DELIVERED",
    "CLOSED",
    "CANCELLED",
  ]),
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const { status } = parsed.data;

  const existing = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, staffProfile: { select: { id: true, commissionType: true, commissionRate: true } } } },
    },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: { status, progressPercent: PROGRESS[status] ?? 0 },
  });

  // Auto-generate commission record when order is delivered
  if (status === "DELIVERED" && existing.assignedToUserId && existing.assignedTo?.staffProfile) {
    const profile = existing.assignedTo.staffProfile;
    const rate = Number(profile.commissionRate);
    const type = profile.commissionType;
    const base = existing.estimatedPrice != null ? Number(existing.estimatedPrice) : 0;
    const amount = type === "PERCENTAGE" ? parseFloat(((base * rate) / 100).toFixed(2)) : rate;
    const existing_commission = await prisma.designerCommission.findUnique({ where: { orderId } });
    if (!existing_commission && amount > 0) {
      await prisma.designerCommission.create({
        data: {
          designerId: existing.assignedToUserId,
          staffProfileId: profile.id,
          orderId,
          amount,
          rate,
          type,
          status: "PENDING",
        },
      }).catch(() => null);
    }
  }

  await logActivity({
    actor: { id: session.user.id, email: session.user.email ?? undefined, role: session.user.role ?? undefined },
    action: "order.status_changed",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { status },
  });

  // Fire email notifications for client-facing status changes (non-fatal)
  const clientEmail = existing.clientUser?.email;
  const clientName = existing.clientUser?.name ?? "Valued Customer";
  const clientUserId = existing.clientUser?.id ?? null;
  if (clientEmail) {
    const emailOpts = {
      to: clientEmail,
      clientName,
      orderNumber: existing.orderNumber,
      orderId: existing.id,
      recipientUserId: clientUserId,
    };
    try {
      if (status === "PROOF_READY") await sendProofReadyEmail(emailOpts);
      else if (status === "REVISION_REQUESTED") await sendRevisionPendingEmail(emailOpts);
      else if (status === "DELIVERED") await sendFilesDeliveredEmail(emailOpts);
    } catch (err) {
      await writeNotificationLog({
        eventType: status === "PROOF_READY" ? "PROOF_READY" : status === "DELIVERED" ? "FILE_DELIVERED" : "REVISION_PENDING",
        audience: "CLIENT",
        channel: "EMAIL",
        recipientUserId: clientUserId,
        recipientAddress: clientEmail,
        orderId: existing.id,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ ok: true });
}