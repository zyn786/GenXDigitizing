import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/billing/invoice-pdf";

type Props = { params: Promise<{ invoiceId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, order: { clientUserId: session.user.id } },
    include: {
      order: { select: { orderNumber: true } },
      lineItems: { orderBy: { position: "asc" } },
      payments: { orderBy: { receivedAt: "desc" } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    orderNumber: invoice.order.orderNumber,
    currency: invoice.currency,
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    issueDate: invoice.createdAt.toISOString().slice(0, 10),
    lineItems: invoice.lineItems.map((li) => ({
      label: li.label,
      description: li.description,
      quantity: li.quantity,
      unitPrice: Number(li.unitPrice),
      lineTotal: Number(li.lineTotal),
    })),
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
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
