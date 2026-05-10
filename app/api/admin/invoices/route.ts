import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getAllPricingConfig } from "@/lib/pricing/config";

// ─── Auth ────────────────────────────────────────────────────────────────────

const APPROVER_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);

// ─── Schema ──────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
});

const createInvoiceSchema = z.object({
  orderId: z.string().trim().min(1),
  currency: z.string().trim().min(3).max(8).default("USD"),
  dueDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateInvoiceNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!APPROVER_ROLES.has(String(session.user.role ?? ""))) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { orderId, currency, dueDate, notes, lineItems } = parsed.data;

  // Verify order exists and belongs to a client.
  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      clientUserId: true,
      clientUser: { select: { name: true, email: true } },
      estimatedPrice: true,
      couponCode: true,
      couponDiscountAmount: true,
    },
  });
  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }
  if (!order.clientUserId) {
    return NextResponse.json(
      { ok: false, message: "Order has no associated client." },
      { status: 422 }
    );
  }

  // Prevent duplicate — orderId is @unique on Invoice.
  const existing = await prisma.invoice.findUnique({
    where: { orderId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { ok: false, message: "An invoice already exists for this order.", existingInvoiceId: existing.id },
      { status: 409 }
    );
  }

  // Fetch default tax rate from config.
  const config = await getAllPricingConfig();
  const taxPercent = parseFloat(config["default_tax_percent"] ?? "0");

  // Compute totals.
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPrice,
    0
  );

  // Apply coupon discount from order if present.
  const couponDiscount = order.couponDiscountAmount ? Number(order.couponDiscountAmount) : 0;

  const taxAmount = taxPercent > 0
    ? Math.round(subtotal * (taxPercent / 100) * 100) / 100
    : 0;
  const totalAmount = Math.round((subtotal + taxAmount - couponDiscount) * 100) / 100;
  const balanceDue = totalAmount;

  const invoiceNumber = generateInvoiceNumber();
  const computedDueDate = dueDate
    ? new Date(dueDate)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId,
          createdByUserId: session.user.id,
          clientEmail: order.clientUser?.email ?? "client@example.com",
          clientName: order.clientUser?.name ?? "Client",
          currency,
          dueDate: computedDueDate,
          status: "DRAFT",
          subtotalAmount: subtotal,
          taxPercent: taxPercent > 0 ? taxPercent : undefined,
          taxLabel: taxPercent > 0 ? "Sales Tax" : undefined,
          taxAmount: taxAmount > 0 ? taxAmount : undefined,
          discountAmount: couponDiscount > 0 ? couponDiscount : undefined,
          totalAmount,
          balanceDue,
          notes: notes ?? null,
        },
      });

      // Create line items with positions.
      for (let i = 0; i < lineItems.length; i++) {
        const li = lineItems[i];
        await tx.invoiceLineItem.create({
          data: {
            invoiceId: created.id,
            label: li.label,
            description: li.description ?? null,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            lineTotal: li.quantity * li.unitPrice,
            position: i,
          },
        });
      }

      // Auto-create InvoiceDiscount record for coupon if applicable.
      if (couponDiscount > 0 && order.couponCode) {
        await tx.invoiceDiscount.create({
          data: {
            invoiceId: created.id,
            label: `Coupon: ${order.couponCode}`,
            source: "COUPON",
            percentage: 0,
            appliedAmount: couponDiscount,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        ok: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          status: invoice.status,
          currency: invoice.currency,
          totalAmount: Number(invoice.totalAmount),
          balanceDue: Number(invoice.balanceDue),
          dueDate: invoice.dueDate.toISOString().slice(0, 10),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
