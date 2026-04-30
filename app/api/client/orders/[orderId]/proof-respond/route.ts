import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  sendInvoiceSentEmail,
  sendRevisionPendingEmail,
  sendRevisionRequestedAdminEmail,
  writeNotificationLog,
} from "@/lib/notifications/email";

type Ctx = { params: Promise<{ orderId: string } | Record<string, string | string[] | undefined>> };

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("request_revision"),
    revisionNote: z.string().trim().min(1).max(2000),
    attachmentUrls: z.array(z.string().trim().min(1)).max(5).optional(),
  }),
]);

export async function POST(req: Request, { params }: Ctx) {
  const raw = await params;
  const orderId = typeof raw.orderId === "string" ? raw.orderId : "";
  if (!orderId) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      proofStatus: true,
      clientUser: { select: { id: true, email: true, name: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.proofStatus !== "SENT_TO_CLIENT" && order.proofStatus !== "CLIENT_REVIEWING") {
    return NextResponse.json(
      { error: "No proof available for review at this time." },
      { status: 409 }
    );
  }

  const { action } = parsed.data;

  if (action === "approve") {
    const invoiceToNotify = await prisma.$transaction(async (tx) => {
      const now = new Date();
      // Mark the latest sent proof as approved
      const latestSentProof = await tx.designProof.findFirst({
        where: { orderId, sentAt: { not: null } },
        orderBy: { versionNumber: "desc" },
      });
      if (latestSentProof) {
        await tx.designProof.update({
          where: { id: latestSentProof.id },
          data: { approvedByClientAt: now },
        });
      }

      const freshOrder = await tx.workflowOrder.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          title: true,
          clientUserId: true,
          quoteCurrency: true,
          quotedAmount: true,
          approvedQuoteAmount: true,
          clientUser: { select: { id: true, name: true, email: true } },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientName: true,
              clientEmail: true,
              totalAmount: true,
              currency: true,
              dueDate: true,
            },
          },
        },
      });
      if (!freshOrder) throw new Error("Order not found.");
      const approvedAmountRaw = freshOrder.approvedQuoteAmount ?? freshOrder.quotedAmount;
      const approvedAmount = approvedAmountRaw != null ? Number(approvedAmountRaw) : 0;
      const currency = freshOrder.quoteCurrency ?? "USD";

      await tx.workflowOrder.update({
        where: { id: orderId },
        data: {
          proofStatus: "CLIENT_APPROVED",
          proofApprovedByClientAt: now,
          clientProofApprovedAt: now,
          clientProofApprovedById: session.user.id,
          approvedQuoteAmount: approvedAmount,
          paymentRequired: true,
          paymentStatus: "PENDING",
          status: "APPROVED_WAITING_PAYMENT",
        },
      });
      const latestRevisionSent = await tx.orderRevision.findFirst({
        where: { orderId, status: "SENT_TO_CLIENT" },
        orderBy: { revisionNumber: "desc" },
        select: { id: true },
      });
      if (latestRevisionSent) {
        await tx.orderRevision.update({
          where: { id: latestRevisionSent.id },
          data: { status: "APPROVED", approvedAt: now, completedAt: now },
        });
      }

      let invoice = freshOrder.invoice;
      if (!invoice) {
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
        invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            orderId,
            createdByUserId: null,
            clientEmail: freshOrder.clientUser.email ?? "",
            clientName: freshOrder.clientUser.name ?? "Client",
            currency,
            dueDate,
            status: "SENT",
            subtotalAmount: approvedAmount,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: approvedAmount,
            paidAmount: 0,
            balanceDue: approvedAmount,
            sentAt: now,
            lineItems: {
              create: [
                {
                  label: `Approved proof - ${freshOrder.orderNumber}`,
                  description: `Approved production amount for ${freshOrder.title}`,
                  quantity: 1,
                  unitPrice: approvedAmount,
                  lineTotal: approvedAmount,
                  position: 0,
                },
              ],
            },
          },
          select: {
            id: true,
            invoiceNumber: true,
            clientName: true,
            clientEmail: true,
            totalAmount: true,
            currency: true,
            dueDate: true,
          },
        });
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        totalAmount: Number(invoice.totalAmount),
        currency: invoice.currency,
        dueDate: invoice.dueDate.toISOString().slice(0, 10),
      };
    });

    try {
      await sendInvoiceSentEmail({
        to: invoiceToNotify.clientEmail,
        clientName: invoiceToNotify.clientName,
        invoiceNumber: invoiceToNotify.invoiceNumber,
        invoiceId: invoiceToNotify.id,
        orderId,
        totalAmount: invoiceToNotify.totalAmount,
        currency: invoiceToNotify.currency,
        dueDate: invoiceToNotify.dueDate,
        recipientUserId: order.clientUser.id,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "INVOICE_SENT",
        audience: "CLIENT",
        channel: "EMAIL",
        recipientUserId: order.clientUser.id,
        recipientAddress: invoiceToNotify.clientEmail,
        invoiceId: invoiceToNotify.id,
        orderId,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }

    return NextResponse.json({ ok: true, proofStatus: "CLIENT_APPROVED" });
  }

  if (action !== "request_revision") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  const requestData = parsed.data;

  // request_revision
  await prisma.$transaction(async (tx) => {
    const latestRevisionSent = await tx.orderRevision.findFirst({
      where: { orderId, status: "SENT_TO_CLIENT" },
      orderBy: { revisionNumber: "desc" },
      select: { id: true },
    });
    if (latestRevisionSent) {
      await tx.orderRevision.update({
        where: { id: latestRevisionSent.id },
        data: { status: "REJECTED", completedAt: new Date() },
      });
    }

    const currentMax = await tx.orderRevision.findFirst({
      where: { orderId },
      orderBy: { revisionNumber: "desc" },
      select: { revisionNumber: true },
    });

    await tx.orderRevision.create({
      data: {
        orderId,
        clientId: session.user.id,
        requestedById: session.user.id,
        revisionNumber: (currentMax?.revisionNumber ?? 0) + 1,
        revisionInstructions: requestData.revisionNote,
        attachmentUrls: requestData.attachmentUrls ?? [],
        status: "REQUESTED_BY_CLIENT",
        requestedAt: new Date(),
      },
    });

    await tx.workflowOrder.update({
      where: { id: orderId },
      data: {
        proofStatus: "REVISION_REQUESTED",
        proofApprovedByClientAt: null,
        status: "REVISION_REQUESTED",
        revisionCount: { increment: 1 },
      },
    });
  });

  if (order.clientUser.email) {
    sendRevisionPendingEmail({
      to: order.clientUser.email,
      clientName: order.clientUser.name ?? "there",
      orderNumber: order.orderNumber,
      orderId,
      recipientUserId: order.clientUser.id,
    }).catch(() => {});
  }
  sendRevisionRequestedAdminEmail({
    orderId,
    orderNumber: order.orderNumber,
    clientName: order.clientUser.name ?? "Client",
  }).catch(() => {});

  return NextResponse.json({ ok: true, proofStatus: "REVISION_REQUESTED" });
}
