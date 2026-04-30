import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { sendQuoteResponseEmail } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

const respondSchema = z.object({
  action: z.enum(["accept", "reject"]),
  reason: z.string().max(1000).optional(),
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

  const { action, reason } = parsed.data;

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: {
      id: true,
      status: true,
      quoteStatus: true,
      orderNumber: true,
      clientUser: { select: { name: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ ok: false, message: "Quote not found." }, { status: 404 });
  }

  if (order.status !== "DRAFT" || order.quoteStatus !== "PRICE_SENT") {
    return NextResponse.json(
      { ok: false, message: "This quote is not available for a response." },
      { status: 422 }
    );
  }

  const newStatus = action === "accept" ? "CLIENT_ACCEPTED" : "CLIENT_REJECTED";

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      quoteStatus: newStatus,
      clientRespondedAt: new Date(),
      quoteRejectionReason: action === "reject" ? (reason ?? null) : null,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: action === "accept" ? "quote.accepted_by_client" : "quote.rejected_by_client",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, reason: reason ?? null },
  });

  await sendQuoteResponseEmail({
    quoteNumber: order.orderNumber,
    quoteId: orderId,
    clientName: order.clientUser?.name ?? "Client",
    action,
    reason: reason ?? null,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
