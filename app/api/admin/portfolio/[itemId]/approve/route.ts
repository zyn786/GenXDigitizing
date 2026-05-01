import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";

type Props = { params: Promise<{ itemId: string }> };

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { itemId } = await params;
  const existing = await prisma.portfolioItem.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, approvalStatus: true },
  });
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });

  const item = await prisma.portfolioItem.update({
    where: { id: itemId },
    data: {
      approvalStatus: "APPROVED",
      approvedByUserId: session.user.id,
      approvedAt: new Date(),
      declineReason: null,
      declinedAt: null,
      isVisible: true,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "portfolio.item_approved",
    entityType: "PortfolioItem",
    entityId: itemId,
    metadata: { title: existing.title },
  });

  return NextResponse.json({ ok: true, item });
}
