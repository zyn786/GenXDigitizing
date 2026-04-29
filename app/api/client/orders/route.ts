import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";

const orderSchema = z.object({
  serviceCategory: z.enum(["EMBROIDERY_DIGITIZING", "VECTOR_REDRAW", "COLOR_SEPARATION", "DTF_SCREEN_PRINT"]),
  tierId: z.string().min(1),
  tierLabel: z.string().min(1),
  tierPrice: z.number().min(0),
  designName: z.string().min(1).max(200),
  designDescription: z.string().max(2000).optional().default(""),
  quantity: z.number().int().min(1).max(100000),
  deliverySpeed: z.enum(["STANDARD", "RUSH_SAME_DAY", "RUSH_12_HOUR"]),
  addOns: z.array(z.enum(["MAJOR_REVISION", "FORMAT_CONVERSION", "SIZE_CHANGE", "SOURCE_FILE"])).default([]),
  additionalNotes: z.string().max(2000).optional().default(""),
  referenceImageKey: z.string().optional(),
  totalPrice: z.number().min(0),
});

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GX-${date}-${rand}`;
}

function computeDueAt(deliverySpeed: string): Date {
  const now = Date.now();
  switch (deliverySpeed) {
    case "RUSH_12_HOUR":
      return new Date(now + 12 * 60 * 60 * 1000);
    case "RUSH_SAME_DAY":
      return new Date(now + 24 * 60 * 60 * 1000);
    default:
      return new Date(now + 3 * 24 * 60 * 60 * 1000);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order data.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    let orderNumber = generateOrderNumber();

    // Retry if collision (extremely rare)
    const exists = await prisma.workflowOrder.findUnique({ where: { orderNumber } });
    if (exists) orderNumber = generateOrderNumber() + "-2";

    const order = await prisma.workflowOrder.create({
      data: {
        orderNumber,
        clientUserId: session.user.id,
        title: data.designName,
        serviceType: data.serviceCategory,
        nicheSlug: data.tierId,
        status: "SUBMITTED",
        dueAt: computeDueAt(data.deliverySpeed),
        notes: JSON.stringify({
          type: "order",
          tierLabel: data.tierLabel,
          tierPrice: data.tierPrice,
          quantity: data.quantity,
          deliverySpeed: data.deliverySpeed,
          addOns: data.addOns,
          description: data.designDescription,
          additionalNotes: data.additionalNotes,
          referenceImageKey: data.referenceImageKey ?? null,
          totalPrice: data.totalPrice,
        }),
      },
      select: { id: true, orderNumber: true },
    });

    await logActivity({
      actor: { id: session.user.id, email: session.user.email ?? undefined, role: session.user.role ?? undefined },
      action: "order.created",
      entityType: "WorkflowOrder",
      entityId: order.id,
      metadata: { orderNumber: order.orderNumber, service: data.serviceCategory, totalPrice: data.totalPrice },
    });

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
  } catch (err) {
    console.error("Order creation error", err);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
