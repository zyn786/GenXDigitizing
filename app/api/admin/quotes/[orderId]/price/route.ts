import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";

type Props = { params: Promise<{ orderId: string }> };

const priceSchema = z.object({
  quotedPrice: z.number().positive(),
  quoteNotes: z.string().max(2000).optional(),
});

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false, message: "Only Super Admin or Manager can set prices." }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = priceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid price." }, { status: 400 });
  }

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, quoteStatus: true, orderNumber: true },
  });
  if (!order) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  if (order.status !== "DRAFT") {
    return NextResponse.json({ ok: false, message: "Only draft quotes can be priced." }, { status: 422 });
  }

  await prisma.workflowOrder.update({
    where: { id: orderId },
    data: {
      quotedPrice: parsed.data.quotedPrice,
      pricedAt: new Date(),
      pricedByUserId: session.user.id,
      quoteStatus: "UNDER_REVIEW",
      ...(parsed.data.quoteNotes ? { quoteClientNotes: parsed.data.quoteNotes } : {}),
    },
  });

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role },
    action: "quote.price_set",
    entityType: "WorkflowOrder",
    entityId: orderId,
    metadata: { quotedPrice: parsed.data.quotedPrice, orderNumber: order.orderNumber },
  });

  return NextResponse.json({ ok: true });
}
