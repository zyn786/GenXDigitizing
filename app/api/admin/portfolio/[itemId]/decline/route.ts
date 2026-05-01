import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";

type Props = { params: Promise<{ itemId: string }> };

const schema = z.object({
  reason: z.string().min(5).max(500),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { itemId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "A reason (5–500 chars) is required." }, { status: 400 });
  }

  const existing = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    select: { id: true, title: true },
  });
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });

  const item = await prisma.portfolioItem.update({
    where: { id: itemId },
    data: {
      approvalStatus: "DECLINED",
      declineReason: parsed.data.reason,
      declinedAt: new Date(),
      isVisible: false,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "portfolio.item_declined",
    entityType: "PortfolioItem",
    entityId: itemId,
    metadata: { title: existing.title, reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true, item });
}
