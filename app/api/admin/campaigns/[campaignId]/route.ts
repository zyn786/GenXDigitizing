import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

type Props = { params: Promise<{ campaignId: string }> };

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().min(1).max(500) }),
  z.object({ action: z.literal("activate") }),
  z.object({ action: z.literal("complete") }),
]);

export async function PATCH(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { campaignId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid action." }, { status: 400 });
  }

  const existing = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });

  let data: Parameters<typeof prisma.marketingCampaign.update>[0]["data"] = {};
  let logAction = "";

  if (parsed.data.action === "approve") {
    data = { status: "APPROVED", approvedByUserId: session.user.id, approvedAt: new Date() };
    logAction = "campaign.approved";
  } else if (parsed.data.action === "reject") {
    data = { status: "REJECTED", rejectionReason: parsed.data.reason, rejectedAt: new Date() };
    logAction = "campaign.rejected";
  } else if (parsed.data.action === "activate") {
    data = { status: "ACTIVE" };
    logAction = "campaign.activated";
  } else {
    data = { status: "COMPLETED" };
    logAction = "campaign.completed";
  }

  await prisma.marketingCampaign.update({ where: { id: campaignId }, data });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: logAction,
    entityType: "MarketingCampaign",
    entityId: campaignId,
    metadata: { title: existing.title },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { campaignId } = await params;
  const existing = await prisma.marketingCampaign.findUnique({ where: { id: campaignId }, select: { id: true } });
  if (!existing) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.marketingCampaign.delete({ where: { id: campaignId } });
  return NextResponse.json({ ok: true });
}
