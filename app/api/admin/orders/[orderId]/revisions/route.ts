import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendRevisionAssignedDesignerEmail } from "@/lib/notifications/email";

type Ctx = { params: Promise<{ orderId: string } | Record<string, string | string[] | undefined>> };

const ADMIN_ROLES = ["SUPER_ADMIN", "MANAGER"];

const createSchema = z.object({
  action: z.literal("create_by_admin"),
  revisionInstructions: z.string().trim().min(1).max(2000),
  attachmentUrls: z.array(z.string().trim().min(1)).max(5).optional(),
  adminNotes: z.string().trim().max(2000).optional(),
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("assign_designer"),
    revisionId: z.string().cuid(),
    assignedDesignerId: z.string().cuid(),
  }),
  z.object({
    action: z.literal("set_status"),
    revisionId: z.string().cuid(),
    status: z.enum(["UNDER_ADMIN_REVIEW", "SENT_TO_CLIENT", "APPROVED", "REJECTED", "CANCELLED"]),
    adminNotes: z.string().trim().max(2000).optional(),
  }),
]);

export async function POST(req: Request, { params }: Ctx) {
  const raw = await params;
  const orderId = typeof raw.orderId === "string" ? raw.orderId : "";
  if (!orderId) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: { id: true, clientUserId: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const revision = await prisma.$transaction(async (tx) => {
    const currentMax = await tx.orderRevision.findFirst({
      where: { orderId },
      orderBy: { revisionNumber: "desc" },
      select: { revisionNumber: true },
    });

    const created = await tx.orderRevision.create({
      data: {
        orderId,
        clientId: order.clientUserId,
        requestedById: null,
        createdByAdminId: session.user.id,
        revisionNumber: (currentMax?.revisionNumber ?? 0) + 1,
        revisionInstructions: parsed.data.revisionInstructions,
        attachmentUrls: parsed.data.attachmentUrls ?? [],
        status: "CREATED_BY_ADMIN",
        adminNotes: parsed.data.adminNotes ?? null,
        requestedAt: new Date(),
      },
    });

    await tx.workflowOrder.update({
      where: { id: orderId },
      data: {
        proofStatus: "REVISION_REQUESTED",
        status: "REVISION_REQUESTED",
        revisionCount: { increment: 1 },
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, revision }, { status: 201 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const raw = await params;
  const orderId = typeof raw.orderId === "string" ? raw.orderId : "";
  if (!orderId) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const revision = await prisma.orderRevision.findUnique({
    where: { id: parsed.data.revisionId },
    include: {
      order: { select: { id: true, orderNumber: true } },
    },
  });
  if (!revision || revision.orderId !== orderId) {
    return NextResponse.json({ error: "Revision not found." }, { status: 404 });
  }

  if (parsed.data.action === "assign_designer") {
    const designer = await prisma.user.findUnique({
      where: { id: parsed.data.assignedDesignerId },
      select: { id: true, role: true, email: true, name: true },
    });
    if (!designer || designer.role !== "DESIGNER") {
      return NextResponse.json({ error: "Designer not found." }, { status: 404 });
    }

    const updated = await prisma.orderRevision.update({
      where: { id: revision.id },
      data: {
        assignedDesignerId: designer.id,
        assignedAt: new Date(),
        status: "ASSIGNED_TO_DESIGNER",
      },
    });

    if (designer.email) {
      sendRevisionAssignedDesignerEmail({
        to: designer.email,
        designerName: designer.name ?? "there",
        orderId,
        orderNumber: revision.order.orderNumber,
        revisionNumber: revision.revisionNumber,
        recipientUserId: designer.id,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, revision: updated });
  }

  const nextStatus = parsed.data.status;
  const updated = await prisma.orderRevision.update({
    where: { id: revision.id },
    data: {
      status: nextStatus,
      adminNotes: parsed.data.adminNotes ?? revision.adminNotes,
      ...(nextStatus === "APPROVED" ? { approvedAt: new Date() } : {}),
      ...(nextStatus === "REJECTED" || nextStatus === "CANCELLED" ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ ok: true, revision: updated });
}
