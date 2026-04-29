import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getOrderFiles } from "@/lib/payments/repository";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ ok: false }, { status: 403 });

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: { id: true, invoice: { select: { filesUnlocked: true } } },
  });

  if (!order) return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });

  const filesUnlocked = order.invoice?.filesUnlocked ?? false;

  if (!filesUnlocked) {
    return NextResponse.json({
      ok: true,
      files: [],
      locked: true,
      message: "Files are locked until your payment is approved.",
    });
  }

  const files = await getOrderFiles(orderId);
  return NextResponse.json({ ok: true, files, locked: false });
}
