import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { sendFilesUnlockedEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false, message: "Only Super Admin or Manager can manually unlock files." }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      invoice: { select: { id: true, invoiceNumber: true, filesUnlocked: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  if (order.invoice) {
    await prisma.invoice.update({
      where: { id: order.invoice.id },
      data: { filesUnlocked: true },
    });
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role },
    action: "files.manually_unlocked",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { invoiceId: order.invoice?.id ?? null },
  });

  const clientEmail = order.clientUser?.email;
  const clientName = order.clientUser?.name ?? "Valued Customer";
  if (clientEmail && order.invoice) {
    try {
      await sendFilesUnlockedEmail({
        to: clientEmail,
        clientName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        invoiceNumber: order.invoice.invoiceNumber,
        recipientUserId: order.clientUser?.id ?? null,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "FILES_UNLOCKED",
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
