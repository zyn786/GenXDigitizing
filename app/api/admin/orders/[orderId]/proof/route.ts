import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { sendProofReadyEmail } from "@/lib/notifications/email";

type Ctx = { params: Promise<{ orderId: string }> };

const STAFF_ROLES = ["SUPER_ADMIN", "MANAGER", "DESIGNER"];
const SENDER_ROLES = ["SUPER_ADMIN", "MANAGER"];

// POST — create a new proof record (after S3 upload completes)
const createSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  objectKey: z.string().trim().min(1),
  bucket: z.string().trim().min(1),
  mimeType: z.string().trim().min(1).max(128),
  sizeBytes: z.number().int().positive(),
});

export async function POST(req: Request, { params }: Ctx) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!STAFF_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Designers can only upload for their assigned order
  if (session.user.role === "DESIGNER") {
    const order = await prisma.workflowOrder.findUnique({
      where: { id: orderId },
      select: { assignedToUserId: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.assignedToUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden — not assigned to this order." }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  // Calculate the next version number for this order
  const lastProof = await prisma.designProof.findFirst({
    where: { orderId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const versionNumber = (lastProof?.versionNumber ?? 0) + 1;

  const proof = await prisma.$transaction(async (tx) => {
    const created = await tx.designProof.create({
      data: {
        orderId,
        versionNumber,
        fileName: parsed.data.fileName,
        objectKey: parsed.data.objectKey,
        bucket: parsed.data.bucket,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
        uploadedByUserId: session.user.id,
        uploadedAt: new Date(),
      },
    });

    await tx.workflowOrder.update({
      where: { id: orderId },
      data: {
        proofStatus: "UPLOADED",
        proofFileUrl: created.objectKey,
        proofFileName: created.fileName,
        proofUploadedById: session.user.id,
        proofUploadedAt: created.uploadedAt,
        proofSentById: null,
        proofSentAt: null,
        proofApprovedByClientAt: null,
      },
    });

    if (session.user.role === "DESIGNER") {
      const latestAssignedRevision = await tx.orderRevision.findFirst({
        where: {
          orderId,
          assignedDesignerId: session.user.id,
          status: { in: ["ASSIGNED_TO_DESIGNER", "IN_PROGRESS"] },
        },
        orderBy: { revisionNumber: "desc" },
        select: { id: true },
      });
      if (latestAssignedRevision) {
        await tx.orderRevision.update({
          where: { id: latestAssignedRevision.id },
          data: { status: "REVISED_PROOF_UPLOADED", completedAt: new Date() },
        });
      }
    }

    return created;
  });

  return NextResponse.json({ proof }, { status: 201 });
}

// PATCH — update proof status (send to client, override, etc.)
const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("mark_internal_review") }),
  z.object({
    action: z.literal("send_to_client"),
    proofId: z.string().cuid(),
  }),
  z.object({
    action: z.literal("override_status"),
    proofStatus: z.enum([
      "NOT_UPLOADED",
      "UPLOADED",
      "INTERNAL_REVIEW",
      "SENT_TO_CLIENT",
      "CLIENT_REVIEWING",
      "CLIENT_APPROVED",
      "REVISION_REQUESTED",
    ]),
  }),
]);

export async function PATCH(req: Request, { params }: Ctx) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!STAFF_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      proofStatus: true,
      clientUser: {
        select: { id: true, email: true, name: true },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { action } = parsed.data;

  if (action === "mark_internal_review") {
    if (order.proofStatus !== "UPLOADED") {
      return NextResponse.json({ error: "Proof must be in UPLOADED state." }, { status: 409 });
    }
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: { proofStatus: "INTERNAL_REVIEW" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "send_to_client") {
    if (!SENDER_ROLES.includes(String(session.user.role ?? ""))) {
      return NextResponse.json({ error: "Only admins/managers can send proofs to clients." }, { status: 403 });
    }

    const proof = await prisma.designProof.findUnique({
      where: { id: parsed.data.proofId },
    });
    if (!proof || proof.orderId !== orderId) {
      return NextResponse.json({ error: "Proof not found." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const sentAt = new Date();
      await tx.designProof.update({
        where: { id: proof.id },
        data: { sentByUserId: session.user.id, sentAt },
      });
      await tx.workflowOrder.update({
        where: { id: orderId },
        data: {
          proofStatus: "SENT_TO_CLIENT",
          proofSentById: session.user.id,
          proofSentAt: sentAt,
          status: "PROOF_READY",
        },
      });
      const latestOpenRevision = await tx.orderRevision.findFirst({
        where: {
          orderId,
          status: {
            in: [
              "REQUESTED_BY_CLIENT",
              "CREATED_BY_ADMIN",
              "UNDER_ADMIN_REVIEW",
              "ASSIGNED_TO_DESIGNER",
              "IN_PROGRESS",
              "REVISED_PROOF_UPLOADED",
            ],
          },
        },
        orderBy: { revisionNumber: "desc" },
        select: { id: true },
      });
      if (latestOpenRevision) {
        await tx.orderRevision.update({
          where: { id: latestOpenRevision.id },
          data: { status: "SENT_TO_CLIENT" },
        });
      }
    });

    // Fire email notification (non-fatal)
    if (order.clientUser.email) {
      sendProofReadyEmail({
        to: order.clientUser.email,
        clientName: order.clientUser.name ?? "there",
        orderNumber: order.orderNumber,
        orderId,
        recipientUserId: order.clientUser.id,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "override_status") {
    if (!SENDER_ROLES.includes(String(session.user.role ?? ""))) {
      return NextResponse.json({ error: "Only admins/managers can override proof status." }, { status: 403 });
    }
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: {
        proofStatus: parsed.data.proofStatus,
        ...(parsed.data.proofStatus === "CLIENT_APPROVED"
          ? {
              clientProofApprovedAt: new Date(),
              clientProofApprovedById: order.clientUser.id,
              paymentRequired: true,
              paymentStatus: "PENDING",
              status: "APPROVED_WAITING_PAYMENT",
            }
          : {}),
        ...(parsed.data.proofStatus === "CLIENT_APPROVED" ? { proofApprovedByClientAt: new Date() } : {}),
      },
    });
    await logActivity({
      actor: {
        id: session.user.id,
        email: session.user.email ?? undefined,
        role: session.user.role ?? undefined,
      },
      action: "proof.client_approval_overridden_by_admin",
      entityType: "WorkflowOrder",
      entityId: orderId,
      metadata: { proofStatus: parsed.data.proofStatus },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
