import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ orderId: string } | Record<string, string | string[] | undefined>> };

export async function POST(_req: Request, { params }: Ctx) {
  const raw = await params;
  const orderId = typeof raw.orderId === "string" ? raw.orderId : "";
  if (!orderId) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: { id: true, proofStatus: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.proofStatus === "SENT_TO_CLIENT") {
    await prisma.workflowOrder.update({
      where: { id: orderId },
      data: { proofStatus: "CLIENT_REVIEWING" },
    });
  }

  return NextResponse.json({ ok: true });
}
