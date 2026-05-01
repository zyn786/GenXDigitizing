import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";
import { sendRevisionAssignedEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const createSchema = z.object({
  action: z.enum(["create", "assign", "update_status"]),
  assignedToUserId: z.string().optional(),
  adminNotes: z.string().max(2000).optional(),
  revisionId: z.string().optional(),
  status: z.enum([
    "REQUESTED_BY_CLIENT",
    "CREATED_BY_ADMIN",
    "UNDER_ADMIN_REVIEW",
    "ASSIGNED_TO_DESIGNER",
    "IN_PROGRESS",
    "REVISED_PROOF_UPLOADED",
    "COMPLETED",
    "CANCELLED",
  ]).optional(),
});

export async function GET(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;
  const revisions = await prisma.orderRevision.findMany({
    where: { orderId },
    include: {
      requestedBy: { select: { name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, revisions });
}

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true, revisionCount: true },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  const { action } = parsed.data;

  if (action === "create") {
    const revision = await prisma.orderRevision.create({
      data: {
        orderId,
        status: "CREATED_BY_ADMIN",
        assignedByUserId: session.user.id,
        adminNotes: parsed.data.adminNotes ?? null,
        versionLabel: `Revision ${(order.revisionCount ?? 0) + 1}`,
      },
    });

    if (!["REVISION_REQUESTED", "IN_PROGRESS"].includes(order.status)) {
      await prisma.workflowOrder.update({
        where: { id: orderId },
        data: { status: "REVISION_REQUESTED", proofStatus: "REVISION_REQUESTED", revisionCount: { increment: 1 } },
      });
    }

    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "revision.created_by_admin",
      entityType: "OrderRevision",
      entityId: revision.id,
      metadata: { orderId, orderNumber: order.orderNumber },
    });

    return NextResponse.json({ ok: true, revisionId: revision.id });
  }

  if (action === "assign") {
    if (!parsed.data.revisionId || !parsed.data.assignedToUserId) {
      return NextResponse.json({ ok: false, message: "revisionId and assignedToUserId required." }, { status: 400 });
    }

    const designer = await prisma.user.findUnique({
      where: { id: parsed.data.assignedToUserId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!designer || designer.role !== "DESIGNER") {
      return NextResponse.json({ ok: false, message: "User must be a designer." }, { status: 422 });
    }

    await prisma.orderRevision.update({
      where: { id: parsed.data.revisionId, orderId },
      data: {
        status: "ASSIGNED_TO_DESIGNER",
        assignedToUserId: parsed.data.assignedToUserId,
        assignedByUserId: session.user.id,
        assignedAt: new Date(),
        ...(parsed.data.adminNotes ? { adminNotes: parsed.data.adminNotes } : {}),
      },
    });

    if (order.status === "REVISION_REQUESTED") {
      await prisma.workflowOrder.update({
        where: { id: orderId },
        data: { status: "IN_PROGRESS", proofStatus: "INTERNAL_REVIEW", assignedToUserId: parsed.data.assignedToUserId },
      });
    }

    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "revision.assigned_to_designer",
      entityType: "OrderRevision",
      entityId: parsed.data.revisionId,
      metadata: { designerId: parsed.data.assignedToUserId, orderNumber: order.orderNumber },
    });

    if (designer.email) {
      try {
        const revision = await prisma.orderRevision.findUnique({
          where: { id: parsed.data.revisionId },
          select: { clientNotes: true },
        });
        await sendRevisionAssignedEmail({
          to: designer.email,
          designerName: designer.name ?? "Designer",
          orderNumber: order.orderNumber,
          orderId: order.id,
          clientNotes: revision?.clientNotes ?? null,
          recipientUserId: designer.id,
        });
      } catch (err) {
        await writeNotificationLog({
          eventType: "REVISION_ASSIGNED",
          audience: "ASSIGNED_USER",
          channel: "EMAIL",
          recipientUserId: designer.id,
          recipientAddress: designer.email,
          orderId: order.id,
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "update_status") {
    if (!parsed.data.revisionId || !parsed.data.status) {
      return NextResponse.json({ ok: false, message: "revisionId and status required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status };
    if (parsed.data.status === "COMPLETED") updateData.completedAt = new Date();
    if (parsed.data.adminNotes) updateData.adminNotes = parsed.data.adminNotes;

    await prisma.orderRevision.update({
      where: { id: parsed.data.revisionId, orderId },
      data: updateData,
    });

    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "revision.status_updated",
      entityType: "OrderRevision",
      entityId: parsed.data.revisionId,
      metadata: { status: parsed.data.status, orderNumber: order.orderNumber },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "Unknown action." }, { status: 400 });
}
