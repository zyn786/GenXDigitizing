import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  serviceKey: z.string().min(1),
  nicheSlug: z.string().optional(),
  description: z.string().max(2000).optional(),
  beforeImageKey: z.string().optional(),
  afterImageKey: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  seoTitle: z.string().max(120).optional(),
  seoDescription: z.string().max(300).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const items = await prisma.portfolioItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid data." }, { status: 400 });
  }

  const item = await prisma.portfolioItem.create({
    data: {
      ...parsed.data,
      tags: parsed.data.tags ?? [],
      createdByUserId: session.user.id ?? null,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "portfolio.item_created",
    entityType: "PortfolioItem",
    entityId: item.id,
    metadata: { title: item.title },
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
