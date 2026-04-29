import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { reviewProofSchema } from "@/lib/payments/schemas";
import { reviewPaymentProof } from "@/lib/payments/repository";
import { prisma } from "@/lib/db";
import { sendFilesUnlockedEmail, writeNotificationLog } from "@/lib/notifications/email";

type RouteProps = { params: Promise<{ proofId: string }> };

function isApprover(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function PATCH(req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isApprover(session.user.role)) return NextResponse.json({ ok: false }, { status: 403 });

  const { proofId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reviewProofSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  if (parsed.data.action === "reject" && !parsed.data.rejectionReason?.trim()) {
    return NextResponse.json({ ok: false, message: "A rejection reason is required." }, { status: 400 });
  }

  try {
    await reviewPaymentProof(
      proofId,
      parsed.data.action,
      {
        userId: session.user.id,
        email: session.user.email,
        role: String(session.user.role ?? ""),
      },
      parsed.data.rejectionReason ?? null
    );

    // On approval, notify client that their files are unlocked (non-fatal)
    if (parsed.data.action === "approve") {
      const proof = await prisma.paymentProofSubmission.findUnique({
        where: { id: proofId },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientEmail: true,
              clientName: true,
              orderId: true,
              order: { select: { orderNumber: true, clientUserId: true } },
            },
          },
        },
      });
      if (proof?.invoice) {
        try {
          await sendFilesUnlockedEmail({
            to: proof.invoice.clientEmail,
            clientName: proof.invoice.clientName,
            orderNumber: proof.invoice.order.orderNumber,
            orderId: proof.invoice.orderId,
            invoiceNumber: proof.invoice.invoiceNumber,
            recipientUserId: proof.invoice.order.clientUserId,
          });
        } catch (err) {
          await writeNotificationLog({
            eventType: "FILE_DELIVERED",
            audience: "CLIENT",
            channel: "EMAIL",
            recipientUserId: proof.invoice.order.clientUserId,
            recipientAddress: proof.invoice.clientEmail,
            invoiceId: proof.invoice.id,
            orderId: proof.invoice.orderId,
            status: "FAILED",
            errorMessage: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    const status = message.includes("not found") ? 404 : message.includes("already") ? 409 : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
