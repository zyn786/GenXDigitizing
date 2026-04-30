import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const quoteSchema = z.object({
  serviceCategory: z.enum(["EMBROIDERY_DIGITIZING", "VECTOR_REDRAW", "COLOR_SEPARATION", "DTF_SCREEN_PRINT"]),
  tierId: z.string().min(1).optional().default(""),
  tierLabel: z.string().optional().default(""),
  tierPrice: z.number().min(0).optional().default(0),
  designName: z.string().min(1).max(200),
  designDescription: z.string().max(2000).optional().default(""),
  quantity: z.number().int().min(1).max(100000),
  preferredTurnaround: z.enum(["STANDARD", "RUSH_SAME_DAY", "RUSH_12_HOUR"]).optional().default("STANDARD"),
  addOns: z.array(z.enum(["MAJOR_REVISION", "FORMAT_CONVERSION", "SIZE_CHANGE", "SOURCE_FILE"])).default([]),
  additionalNotes: z.string().max(2000).optional().default(""),
  referenceImageKey: z.string().optional(),
  estimatedTotal: z.number().min(0).optional().default(0),
});

function generateQuoteNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `QR-${date}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quote data.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    let orderNumber = generateQuoteNumber();

    const exists = await prisma.workflowOrder.findUnique({ where: { orderNumber } });
    if (exists) orderNumber = generateQuoteNumber() + "-2";

    const quote = await prisma.workflowOrder.create({
      data: {
        orderNumber,
        clientUserId: session.user.id,
        title: data.designName,
        serviceType: data.serviceCategory,
        nicheSlug: data.tierId || null,
        status: "DRAFT",
        quoteStatus: "NEW",
        notes: JSON.stringify({
          type: "quote",
          tierLabel: data.tierLabel,
          tierPrice: data.tierPrice,
          quantity: data.quantity,
          preferredTurnaround: data.preferredTurnaround,
          addOns: data.addOns,
          description: data.designDescription,
          additionalNotes: data.additionalNotes,
          referenceImageKey: data.referenceImageKey ?? null,
          totalPrice: data.estimatedTotal,
        }),
      },
      select: { id: true, orderNumber: true },
    });

    return NextResponse.json({ success: true, quoteId: quote.id, quoteNumber: quote.orderNumber }, { status: 201 });
  } catch (err) {
    console.error("Quote creation error", err);
    return NextResponse.json({ error: "Failed to create quote request." }, { status: 500 });
  }
}
