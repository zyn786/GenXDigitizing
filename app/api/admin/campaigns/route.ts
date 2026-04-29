import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAppAdminRole } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/logger";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["DISCOUNT", "REFERRAL", "FOLLOW_UP", "SEASONAL"]),
  targetAudience: z.string().max(200).optional(),
  discountValue: z.number().min(0).optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const role = session.user.role;
  const isAdmin = isAppAdminRole(role);
  const isMarketing = role === "MARKETING";

  if (!isAdmin && !isMarketing) return NextResponse.json({ ok: false }, { status: 403 });

  const where = isAdmin ? {} : { createdByUserId: session.user.id };

  const campaigns = await prisma.marketingCampaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ ok: true, campaigns });
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
    return NextResponse.json({ ok: false, message: "Invalid data." }, { status: 400 });
  }

  const status = isAppAdminRole(role) ? "APPROVED" : "PENDING_APPROVAL";

  const campaign = await prisma.marketingCampaign.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      status,
      targetAudience: parsed.data.targetAudience ?? null,
      discountValue: parsed.data.discountValue ?? null,
      discountType: parsed.data.discountType ?? null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      notes: parsed.data.notes ?? null,
      createdByUserId: session.user.id ?? null,
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "campaign.created",
    entityType: "MarketingCampaign",
    entityId: campaign.id,
    metadata: { title: campaign.title, type: campaign.type, status },
  });

  return NextResponse.json({ ok: true, campaign }, { status: 201 });
}
