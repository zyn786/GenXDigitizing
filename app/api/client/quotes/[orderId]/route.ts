import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { sendOrderCreatedEmail, sendQuoteAcceptedEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const respondSchema = z.object({
  action: z.enum(["accept", "reject"]),
  clientNotes: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  if (order.status !== "DRAFT" || order.quoteStatus !== "PRICE_SENT") {
    return NextResponse.json({ ok: false, message: "Quote is not awaiting your response." }, { status: 422 });
  }

  const { action, clientNotes } = parsed.data;

  if (action === "accept") {
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: {
        status: "SUBMITTED",
        quoteStatus: "CLIENT_ACCEPTED",
        quoteAcceptedAt: new Date(),
        progressPercent: 15,
        ...(clientNotes ? { quoteClientNotes: clientNotes } : {}),
      },
    });

    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "quote.accepted_by_client",
      entityType: "WorkflowOrder",
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber },
    });

    const clientEmail = order.clientUser?.email;
    const clientName = order.clientUser?.name ?? "Valued Customer";
    if (clientEmail) {
      try {
        await sendOrderCreatedEmail({
          to: clientEmail,
          clientName,
          orderNumber: order.orderNumber,
          orderId: order.id,
          serviceType: order.serviceType.replaceAll("_", " "),
          estimatedPrice: order.quotedPrice ? Number(order.quotedPrice) : null,
          recipientUserId: order.clientUser?.id ?? null,
        });
      } catch (err) {
        await writeNotificationLog({
          eventType: "ORDER_CREATED",
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

    // Notify ops team of accepted quote
    const opsEmail = process.env.OPS_EMAIL ?? process.env.ADMIN_EMAIL;
    if (opsEmail && order.quotedPrice != null) {
      try {
        await sendQuoteAcceptedEmail({
          to: opsEmail,
          adminName: "Team",
          orderNumber: order.orderNumber,
          orderId: order.id,
          clientName: clientName,
          quotedPrice: Number(order.quotedPrice),
        });
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ok: true, action: "accepted" });
  }

  // reject
  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      quoteStatus: "CLIENT_REJECTED",
      quoteRejectedAt: new Date(),
      ...(clientNotes ? { quoteClientNotes: clientNotes } : {}),
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "quote.rejected_by_client",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber },
  });

  return NextResponse.json({ ok: true, action: "rejected" });
}
