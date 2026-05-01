import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { sendQuoteSentEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false, message: "Only Super Admin or Manager can send quotes." }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  if (order.status !== "DRAFT") {
    return NextResponse.json({ ok: false, message: "Only draft quotes can be sent." }, { status: 422 });
  }
  if (!order.quotedPrice) {
    return NextResponse.json({ ok: false, message: "Set a price before sending the quote." }, { status: 422 });
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: { quoteStatus: "PRICE_SENT" },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role },
    action: "quote.sent_to_client",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, quotedPrice: Number(order.quotedPrice) },
  });

  const clientEmail = order.clientUser?.email;
  const clientName = order.clientUser?.name ?? "Valued Customer";
  if (clientEmail) {
    try {
      await sendQuoteSentEmail({
        to: clientEmail,
        clientName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        quotedPrice: Number(order.quotedPrice),
        serviceType: order.serviceType.replaceAll("_", " "),
        recipientUserId: order.clientUser?.id ?? null,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "QUOTE_SENT",
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

  return NextResponse.json({ ok: true });
}
