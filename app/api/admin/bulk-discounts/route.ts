import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const ruleSchema = z.object({
  id: z.string().optional(),
  minQty: z.coerce.number().int().min(1),
  discountPercent: z.coerce.number().min(0).max(100),
  label: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const rules = await db.bulkDiscountRule.findMany({ orderBy: { minQty: "asc" } });
    return NextResponse.json({ ok: true, rules });
  } catch {
    return NextResponse.json({ ok: true, rules: [] });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Validation failed." }, { status: 400 });
  }

  try {
    const { id, ...data } = parsed.data;
    const rule = id
      ? await db.bulkDiscountRule.update({ where: { id }, data })
      : await db.bulkDiscountRule.create({ data: { ...data, sortOrder: data.minQty } });
    return NextResponse.json({ ok: true, rule });
  } catch {
    return NextResponse.json({ ok: false, message: "Database not yet migrated." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { id } = await request.json().catch(() => ({})) as { id?: string };
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await db.bulkDiscountRule.delete({ where: { id } });
  } catch {
    return NextResponse.json({ ok: false, message: "Not found or already deleted." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
