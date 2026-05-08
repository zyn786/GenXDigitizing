import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// ─── Auth ────────────────────────────────────────────────────────────────────

const APPROVER_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);

// ─── Schemas ─────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
});

const editInvoiceSchema = z.object({
  currency: z.string().trim().min(3).max(8).optional(),
  dueDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  lineItems: z.array(lineItemSchema).optional(),
});

// ─── Locked statuses ─────────────────────────────────────────────────────────

const LOCKED_STATUSES = new Set(["PAID", "CANCELLED", "VOID"]);

// ─── PATCH ───────────────────────────────────────────────────────────────────

type RouteProps = { params: Promise<{ invoiceId: string }> };

export async function PATCH(request: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!APPROVER_ROLES.has(String(session.user.role ?? ""))) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { invoiceId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = editInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: { orderBy: { position: "asc" } }, payments: true },
  });
  if (!invoice) {
    return NextResponse.json({ ok: false, message: "Invoice not found." }, { status: 404 });
  }
  if (LOCKED_STATUSES.has(invoice.status)) {
    return NextResponse.json(
      { ok: false, message: `Cannot edit a ${invoice.status.toLowerCase()} invoice.` },
      { status: 422 }
    );
  }

  const { lineItems, currency, dueDate, notes } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update line items if provided.
      let subtotal = Number(invoice.subtotalAmount);
      if (lineItems && lineItems.length > 0) {
        // Delete removed line items.
        const keptIds = lineItems.filter((li) => li.id).map((li) => li.id!);
        await tx.invoiceLineItem.deleteMany({
          where: { invoiceId, id: { notIn: keptIds } },
        });

        subtotal = 0;
        for (let i = 0; i < lineItems.length; i++) {
          const li = lineItems[i];
          const lineTotal = li.quantity * li.unitPrice;
          subtotal += lineTotal;

          if (li.id) {
            await tx.invoiceLineItem.update({
              where: { id: li.id },
              data: {
                label: li.label,
                description: li.description ?? null,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                lineTotal,
                position: i,
              },
            });
          } else {
            await tx.invoiceLineItem.create({
              data: {
                invoiceId,
                label: li.label,
                description: li.description ?? null,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                lineTotal,
                position: i,
              },
            });
          }
        }
      }

      // 2. Recalculate totals.
      const totalAmount = subtotal + Number(invoice.taxAmount) - Number(invoice.discountAmount);
      const paidAmount = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const balanceDue = Math.max(0, totalAmount - paidAmount);

      // 3. Derive status using full status logic (handles PAID, PARTIALLY_PAID, OVERDUE, DRAFT, SENT)
      const { deriveInvoiceStatus } = await import("@/lib/billing/status");
      const nextStatus = deriveInvoiceStatus({
        status: invoice.status,
        dueDate: (dueDate ? new Date(dueDate) : invoice.dueDate).toISOString(),
        total: totalAmount,
        payments: invoice.payments.map((p) => ({ amount: Number(p.amount) })),
      });

      // 4. Update invoice.
      const data: Record<string, unknown> = {
        subtotalAmount: subtotal,
        totalAmount,
        balanceDue,
        status: nextStatus,
      };
      if (currency !== undefined) data.currency = currency;
      if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : undefined;
      if (notes !== undefined) data.notes = notes;

      return tx.invoice.update({
        where: { id: invoiceId },
        data,
        include: { lineItems: { orderBy: { position: "asc" } } },
      });
    });

    return NextResponse.json({
      ok: true,
      invoice: {
        id: updated.id,
        invoiceNumber: updated.invoiceNumber,
        status: updated.status,
        currency: updated.currency,
        subtotalAmount: Number(updated.subtotalAmount),
        totalAmount: Number(updated.totalAmount),
        balanceDue: Number(updated.balanceDue),
        dueDate: updated.dueDate.toISOString().slice(0, 10),
        lineItems: updated.lineItems.map((li) => ({
          id: li.id,
          label: li.label,
          description: li.description,
          quantity: li.quantity,
          unitPrice: Number(li.unitPrice),
          lineTotal: Number(li.lineTotal),
          position: li.position,
        })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
