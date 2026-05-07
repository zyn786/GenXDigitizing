import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invoiceSendPayloadSchema } from "@/lib/billing/schemas";
import { markInvoiceSent } from "@/lib/billing/repository";
import { prisma } from "@/lib/db";
import { sendInvoiceSentEmail, writeNotificationLog } from "@/lib/notifications/email";

type RouteProps = {
  params: Promise<{ invoiceId: string }>;
};

const APPROVER_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);

export async function POST(request: Request, { params }: RouteProps) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!APPROVER_ROLES.has(String(session.user.role ?? ""))) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = invoiceSendPayloadSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { invoiceId } = await params;

  try {
    const invoice = await markInvoiceSent(invoiceId, {
      userId: session.user.id,
      email: session.user.email ?? null,
      role: String(session.user.role ?? ""),
      reason: parsed.data.reason ?? "Invoice marked as sent.",
      keyUnlockUsed: false,
    });

    // Send invoice email to client (non-fatal)
    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: { include: { clientUser: { select: { id: true } } } } },
    });
    if (fullInvoice) {
      try {
        await sendInvoiceSentEmail({
          to: fullInvoice.clientEmail,
          clientName: fullInvoice.clientName,
          invoiceNumber: fullInvoice.invoiceNumber,
          invoiceId: fullInvoice.id,
          orderId: fullInvoice.orderId,
          totalAmount: Number(fullInvoice.totalAmount),
          currency: fullInvoice.currency,
          dueDate: fullInvoice.dueDate.toISOString().slice(0, 10),
          recipientUserId: fullInvoice.order?.clientUser?.id ?? null,
        });
      } catch (err) {
        await writeNotificationLog({
          eventType: "INVOICE_SENT",
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

    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = message === "Invoice not found." ? 404 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}