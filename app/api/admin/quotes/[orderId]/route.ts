import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { sendQuotePricedEmail, writeNotificationLog } from "@/lib/notifications/email";

type Props = { params: Promise<{ orderId: string }> };

function isPricer(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

// ─── POST: convert CLIENT_ACCEPTED quote to an active order ───────────────────

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isPricer(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      quoteStatus: true,
      quotedAmount: true,
      orderNumber: true,
    },
  });

  if (!order) return NextResponse.json({ ok: false, message: "Quote not found." }, { status: 404 });

  if (order.status !== "DRAFT") {
    return NextResponse.json({ ok: false, message: "Only DRAFT quotes can be converted." }, { status: 422 });
  }

  const qs = order.quoteStatus;
  if (qs !== null && qs !== "CLIENT_ACCEPTED") {
    return NextResponse.json(
      { ok: false, message: "Quote must be accepted by the client before converting." },
      { status: 422 }
    );
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      status: "SUBMITTED",
      quoteStatus: "CONVERTED_TO_ORDER",
      progressPercent: 15,
      // Promote quotedAmount to estimatedPrice so production workflow uses it
      estimatedPrice: order.quotedAmount ?? undefined,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "quote.converted_to_order",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber },
  });

  return NextResponse.json({ ok: true });
}

// ─── PATCH: admin manages quote pricing and lifecycle ─────────────────────────

const patchSchema = z.object({
  action: z.enum(["save", "send", "cancel", "mark_under_review"]),
  quotedAmount: z.number().positive().optional(),
  quoteCurrency: z.string().min(3).max(3).default("USD").optional(),
  internalNotes: z.string().max(5000).optional(),
  clientMessage: z.string().max(2000).optional(),
});

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isPricer(session.user.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const { orderId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid request.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { action, quotedAmount, quoteCurrency, internalNotes, clientMessage } = parsed.data;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      quoteStatus: true,
      orderNumber: true,
      clientUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) return NextResponse.json({ ok: false, message: "Quote not found." }, { status: 404 });
  if (order.status !== "DRAFT") {
    return NextResponse.json({ ok: false, message: "Only DRAFT quotes can be modified." }, { status: 422 });
  }
  if (order.quoteStatus === "CONVERTED_TO_ORDER") {
    return NextResponse.json({ ok: false, message: "Converted quotes cannot be modified." }, { status: 422 });
  }

  if (action === "cancel") {
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: { quoteStatus: "CANCELLED", status: "CANCELLED" },
    });
    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "quote.cancelled",
      entityType: "WorkflowOrder",
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_under_review") {
    if (order.quoteStatus !== "NEW" && order.quoteStatus !== null) {
      return NextResponse.json({ ok: false, message: "Already past review stage." }, { status: 422 });
    }
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: { quoteStatus: "UNDER_REVIEW" },
    });
    await logActivity({
      actor: { id: session.user.id, email: session.user.email, role: session.user.role },
      action: "quote.marked_under_review",
      entityType: "WorkflowOrder",
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber },
    });
    return NextResponse.json({ ok: true });
  }

  // action === "save" or "send"
  if (!quotedAmount) {
    return NextResponse.json({ ok: false, message: "Quoted amount is required." }, { status: 400 });
  }

  const updateData =
    action === "send"
      ? {
          quoteStatus: "PRICE_SENT" as const,
          quotedAmount,
          quoteCurrency: quoteCurrency ?? "USD",
          internalNotes: internalNotes ?? null,
          clientMessage: clientMessage ?? null,
          pricedByUserId: session.user.id,
          pricedAt: new Date(),
        }
      : {
          quoteStatus: "UNDER_REVIEW" as const,
          quotedAmount,
          quoteCurrency: quoteCurrency ?? "USD",
          internalNotes: internalNotes ?? null,
          clientMessage: clientMessage ?? null,
        };

  await prisma.workflowOrder.update({ where: { id: orderId }, data: updateData });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: action === "send" ? "quote.price_sent" : "quote.price_saved",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, quotedAmount, quoteCurrency },
  });

  if (action === "send" && order.clientUser?.email) {
    try {
      await sendQuotePricedEmail({
        to: order.clientUser.email,
        clientName: order.clientUser.name ?? "Valued Customer",
        quoteNumber: order.orderNumber,
        quoteId: orderId,
        quotedAmount,
        currency: quoteCurrency ?? "USD",
        clientMessage: clientMessage ?? null,
        recipientUserId: order.clientUser.id,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "QUOTE_PRICED",
        audience: "CLIENT",
        channel: "EMAIL",
        recipientUserId: order.clientUser.id,
        recipientAddress: order.clientUser.email,
        orderId,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
