import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ALLOWED_ROLES = new Set(["SUPER_ADMIN"]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const upsertSchema = z.object({
  configs: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
      label: z.string().optional(),
      description: z.string().optional(),
    })
  ),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const records = await db.pricingConfig.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json({ ok: true, records });
  } catch {
    return NextResponse.json({ ok: true, records: [] });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Validation failed." }, { status: 400 });
  }

  const userId = session.user.id!;
  try {
    await Promise.all(
      parsed.data.configs.map((c) =>
        db.pricingConfig.upsert({
          where: { key: c.key },
          create: { key: c.key, value: c.value, label: c.label, description: c.description, updatedByUserId: userId },
          update: { value: c.value, label: c.label, description: c.description, updatedByUserId: userId },
        })
      )
    );
  } catch {
    return NextResponse.json({ ok: false, message: "Database not yet migrated. Run prisma migrate dev first." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Pricing config saved." });
}
