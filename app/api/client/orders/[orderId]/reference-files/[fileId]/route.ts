import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ orderId: string; fileId: string }> };

export async function DELETE(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ ok: false }, { status: 403 });

  const { orderId, fileId } = await params;

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: { status: true },
  });

  if (!order) return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  if (order.status !== "SUBMITTED") {
    return NextResponse.json(
      { ok: false, message: "Cannot remove files once production has started." },
      { status: 422 }
    );
  }

  const deleted = await prisma.clientReferenceFile.deleteMany({
    where: { id: fileId, orderId },
  });

  if (deleted.count === 0) return NextResponse.json({ ok: false, message: "File not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
