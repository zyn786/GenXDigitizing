import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

const createSchema = z.object({
  code: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, dashes, underscores only"),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().min(0.01),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const role = session.user.role;
  if (role !== "MARKETING" && !isAppAdminRole(role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ ok: true, coupons });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const role = session.user.role;
  if (role !== "MARKETING" && !isAppAdminRole(role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "Invalid data." }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ ok: false, message: "Coupon code already exists." }, { status: 409 });
  }

  const isAdminCreator = isAppAdminRole(role);

  const coupon = await prisma.coupon.create({
    data: {
      code: parsed.data.code,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      description: parsed.data.description ?? null,
      isActive: isAdminCreator,
      approvedAt: isAdminCreator ? new Date() : null,
      approvedByUserId: isAdminCreator ? (session.user.id ?? null) : null,
      createdByUserId: session.user.id ?? null,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "coupon.created",
    entityType: "Coupon",
    entityId: coupon.id,
    metadata: { code: coupon.code, discountType: coupon.discountType, isActive: coupon.isActive },
  });

  return NextResponse.json({ ok: true, coupon }, { status: 201 });
}
