import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateReceiptPdf } from "@/lib/billing/invoice-pdf";

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);

type Props = { params: Promise<{ invoiceId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.has(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: { select: { orderNumber: true } },
      payments: { orderBy: { receivedAt: "desc" } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (invoice.status !== "PAID" && Number(invoice.balanceDue) > 0) {
    return NextResponse.json(
      { error: "Receipt is available after payment is completed." },
      { status: 400 }
    );
  }

  const pdfBytes = await generateReceiptPdf({
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    orderNumber: invoice.order.orderNumber,
    currency: invoice.currency,
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    issueDate: invoice.createdAt.toISOString().slice(0, 10),
    lineItems: [],
    subtotal: Number(invoice.subtotalAmount),
    discountAmount: Number(invoice.discountAmount),
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount),
    balanceDue: Number(invoice.balanceDue),
    notes: invoice.notes,
    payments: invoice.payments.map((p) => ({
      receiptNumber: p.receiptNumber,
      amount: Number(p.amount),
      method: p.method,
      receivedAt: p.receivedAt.toISOString().slice(0, 10),
    })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
