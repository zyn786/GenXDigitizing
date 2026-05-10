import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

type Props = { params: Promise<{ itemId: string }> };

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  serviceKey: z.string().min(1).optional(),
  nicheSlug: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  beforeImageKey: z.string().nullable().optional(),
  afterImageKey: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  seoTitle: z.string().max(120).nullable().optional(),
  seoDescription: z.string().max(300).nullable().optional(),
});

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { itemId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid data." }, { status: 400 });
  }

  const existing = await prisma.portfolioItem.findUnique({ where: { id: itemId }, select: { id: true, createdByUserId: true } });
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });

  if (session.user.role === "MARKETING" && existing.createdByUserId !== session.user.id) {
    return NextResponse.json({ ok: false, message: "You can only edit your own portfolio drafts." }, { status: 403 });
  }

  const item = await prisma.portfolioItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "portfolio.item_updated",
    entityType: "PortfolioItem",
    entityId: itemId,
    metadata: { title: item.title },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { itemId } = await params;
  const existing = await prisma.portfolioItem.findUnique({ where: { id: itemId }, select: { id: true, title: true, createdByUserId: true } });
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });

  if (session.user.role === "MARKETING" && existing.createdByUserId !== session.user.id) {
    return NextResponse.json({ ok: false, message: "You can only delete your own portfolio drafts." }, { status: 403 });
  }

  await prisma.portfolioItem.delete({ where: { id: itemId } });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "portfolio.item_deleted",
    entityType: "PortfolioItem",
    entityId: itemId,
    metadata: { title: existing.title },
  });

  return NextResponse.json({ ok: true });
}
