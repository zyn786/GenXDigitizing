import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

type Props = { params: Promise<{ couponId: string }> };

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("deactivate") }),
]);

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { couponId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const existing = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });

  let data: Parameters<typeof prisma.coupon.update>[0]["data"] = {};
  let logAction = "";

  if (parsed.data.action === "approve") {
    data = { isActive: true, approvedAt: new Date(), approvedByUserId: session.user.id };
    logAction = "coupon.approved";
  } else {
    data = { isActive: false };
    logAction = "coupon.deactivated";
  }

  await prisma.coupon.update({ where: { id: couponId }, data });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: logAction,
    entityType: "Coupon",
    entityId: couponId,
    metadata: { code: existing.code },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { couponId } = await params;
  await prisma.coupon.delete({ where: { id: couponId } });
  return NextResponse.json({ ok: true });
}
