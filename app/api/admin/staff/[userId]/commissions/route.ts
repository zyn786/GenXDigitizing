import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { userId } = await params;

  const commissions = await prisma.designerCommission.findMany({
    where: { designerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true, title: true, estimatedPrice: true } },
    },
  });

  const rows = commissions.map((c) => ({
    id: c.id,
    orderId: c.orderId,
    orderNumber: c.order.orderNumber,
    orderTitle: c.order.title,
    estimatedPrice: c.order.estimatedPrice != null ? Number(c.order.estimatedPrice) : null,
    amount: Number(c.amount),
    rate: Number(c.rate),
    type: c.type,
    status: c.status,
    paidAt: c.paidAt?.toISOString() ?? null,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  }));

  const totals = {
    pending: rows.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.amount, 0),
    paid: rows.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amount, 0),
  };

  return NextResponse.json({ ok: true, commissions: rows, totals });
}

const paySchema = z.object({ commissionId: z.string(), notes: z.string().optional() });

export async function PATCH(req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = paySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });

  const commission = await prisma.designerCommission.findUnique({
    where: { id: parsed.data.commissionId },
  });
  if (!commission || commission.designerId !== userId) {
    return NextResponse.json({ ok: false, message: "Commission not found." }, { status: 404 });
  }

  await prisma.designerCommission.update({
    where: { id: parsed.data.commissionId },
    data: { status: "PAID", paidAt: new Date(), notes: parsed.data.notes ?? commission.notes },
  });

  return NextResponse.json({ ok: true });
}
