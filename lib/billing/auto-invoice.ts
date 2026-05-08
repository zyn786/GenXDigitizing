/* ── Auto invoice helper ──────────────────────────────────────
   Internal server-side only. Creates DRAFT invoices from order
   estimated price. Never sends, never approves, never unlocks. */

import { prisma } from "@/lib/db";

function generateInvoiceNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}

export type AutoInvoiceResult =
  | { created: true; invoiceId: string; invoiceNumber: string }
  | { created: false; invoiceId: string; invoiceNumber: string; reason: "already-exists" }
  | { created: false; reason: "no-order" | "no-client" | "no-price" | "error"; error?: string };

/**
 * Creates a DRAFT invoice for an order if:
 * - order exists and has a clientUserId
 * - order.estimatedPrice > 0
 * - no invoice already exists for this order
 *
 * Returns existing invoice if one is already present.
 * Never sends, never unlocks, never marks as paid.
 */
export async function ensureDraftInvoiceForOrder(
  orderId: string,
  options?: {
    createdByUserId?: string | null;
    currency?: string;
    dueInDays?: number;
  },
): Promise<AutoInvoiceResult> {
  try {
    // Check for existing invoice (idempotent)
    const existing = await prisma.invoice.findUnique({
      where: { orderId },
      select: { id: true, invoiceNumber: true },
    });

    if (existing) {
      return {
        created: false,
        invoiceId: existing.id,
        invoiceNumber: existing.invoiceNumber,
        reason: "already-exists",
      };
    }

    // Load order with client info
    const order = await prisma.workflowOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        title: true,
        clientUserId: true,
        estimatedPrice: true,
        isFreeDesign: true,
        serviceType: true,
        placement: true,
        designHeightIn: true,
        designWidthIn: true,
        quantity: true,
        fileFormats: true,
        specialInstructions: true,
        clientUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!order) {
      return { created: false, reason: "no-order" };
    }

    if (!order.clientUserId) {
      return { created: false, reason: "no-client" };
    }

    const price = Number(order.estimatedPrice ?? 0);
    if (price <= 0 && !order.isFreeDesign) {
      return { created: false, reason: "no-price" };
    }

    const dueInDays = options?.dueInDays ?? 30;
    const currency = options?.currency ?? "USD";

    // Build description from order details
    const details: string[] = [];
    if (order.title) details.push(order.title);
    if (order.placement) details.push(`Placement: ${order.placement}`);
    if (order.designWidthIn || order.designHeightIn) {
      details.push(`Size: ${order.designWidthIn ?? "—"}″ × ${order.designHeightIn ?? "—"}″`);
    }
    if (order.fileFormats?.length) {
      details.push(`Formats: ${order.fileFormats.join(", ")}`);
    }
    if (order.quantity > 1) details.push(`Quantity: ${order.quantity}`);

    const description = details.join(" · ") || "Embroidery digitizing service";
    const label = order.title
      ? `Digitizing: ${order.title}`
      : "Embroidery digitizing service";
    const unitPrice = order.isFreeDesign ? 0 : Math.max(price, 0);

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          orderId: order.id,
          createdByUserId: options?.createdByUserId ?? null,
          clientEmail: order.clientUser?.email ?? "client@example.com",
          clientName: order.clientUser?.name ?? "Client",
          currency,
          dueDate: new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000),
          status: "DRAFT",
          subtotalAmount: unitPrice,
          totalAmount: unitPrice,
          balanceDue: unitPrice,
          notes: order.specialInstructions ?? null,
        },
      });

      await tx.invoiceLineItem.create({
        data: {
          invoiceId: created.id,
          label,
          description,
          quantity: 1,
          unitPrice,
          lineTotal: unitPrice,
          position: 0,
        },
      });

      return created;
    });

    return {
      created: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    };
  } catch (error) {
    return {
      created: false,
      reason: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
