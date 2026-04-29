import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isAppAdminRole } from "@/lib/auth/session";
import { paymentInputSchema } from "@/lib/billing/schemas";
import { addPayment } from "@/lib/billing/repository";
import { prisma } from "@/lib/db";
import { sendPaymentReceivedEmail, writeNotificationLog } from "@/lib/notifications/email";

type RouteProps = {
  params: Promise<{ invoiceId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = paymentInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid payment payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { invoiceId } = await params;

  try {
    const result = await addPayment(
      invoiceId,
      {
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        method: parsed.data.method,
        clientEmail: parsed.data.clientEmail,
        backupEmail: parsed.data.backupEmail ?? null,
        reference: parsed.data.reference ?? null,
        receivedAt: parsed.data.receivedAt,
        note: parsed.data.note ?? null,
      },
      {
        userId: session.user.id,
        email: session.user.email ?? null,
        role: String(session.user.role ?? ""),
        reason: parsed.data.reason ?? "Manual payment recorded from API.",
        keyUnlockUsed: false,
      }
    );

    // Send payment receipt email (non-fatal)
    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: { include: { clientUser: { select: { id: true } } } } },
    });
    if (fullInvoice) {
      try {
        await sendPaymentReceivedEmail({
          to: fullInvoice.clientEmail,
          clientName: fullInvoice.clientName,
          invoiceNumber: fullInvoice.invoiceNumber,
          invoiceId: fullInvoice.id,
          orderId: fullInvoice.orderId,
          receiptNumber: result.payment.receiptNumber,
          amount: parsed.data.amount,
          currency: parsed.data.currency,
          balanceDue: Number(result.invoice.balanceDue),
          recipientUserId: fullInvoice.order?.clientUser?.id ?? null,
        });
      } catch (err) {
        await writeNotificationLog({
          eventType: "PAYMENT_RECORDED",
          audience: "CLIENT",
          channel: "EMAIL",
          recipientUserId: fullInvoice.order?.clientUser?.id ?? null,
          recipientAddress: fullInvoice.clientEmail,
          invoiceId: fullInvoice.id,
          orderId: fullInvoice.orderId,
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = message === "Invoice not found." ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}