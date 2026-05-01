import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { quoteOrderSchema } from "@/schemas/quote-order";
import { computeQuotePricing } from "@/lib/quote-order/pricing";
import { getAllPricingConfig, getActiveBulkDiscountRules } from "@/lib/pricing/config";
import { logActivity } from "@/lib/activity/logger";
import { sendOrderCreatedEmail, sendNewOrderOpsEmail, writeNotificationLog } from "@/lib/notifications/email";

const refFileSchema = z.object({
  fileName: z.string().min(1),
  objectKey: z.string().min(1),
  bucket: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

const orderWithFilesSchema = quoteOrderSchema.extend({
  referenceFiles: z.array(refFileSchema).max(10).default([]),
});

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GX-${ts}-${rand}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = orderWithFilesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Validation failed.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const userId = session.user.id!;

  // Load pricing config and bulk rules (non-fatal if tables don't exist yet)
  const [config, bulkRules] = await Promise.all([
    getAllPricingConfig(),
    getActiveBulkDiscountRules(),
  ]);

  // Check if this is the client's first order (free first design logic)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientProfile = await (prisma as any).clientProfile?.findUnique({
    where: { userId },
    select: { freeDesignUsed: true, totalOrderCount: true },
  }).catch(() => null) as { freeDesignUsed: boolean; totalOrderCount: number } | null;

  const freeFirstDesignEnabled = config["free_first_design_enabled"] === "true";
  const isFirstOrder = (clientProfile?.totalOrderCount ?? 0) === 0;
  const freeDesignAlreadyUsed = clientProfile?.freeDesignUsed ?? false;

  const pricingOpts = {
    stitchRatePer1000: parseFloat(config["stitch_rate_per_1000"] ?? "1.00"),
    stitchPricingEnabled: config["stitch_pricing_enabled"] === "true",
    bulkRules: bulkRules.map((r) => ({
      minQty: r.minQty,
      discountPercent: typeof r.discountPercent === "number"
        ? r.discountPercent
        : (r.discountPercent as { toNumber(): number }).toNumber(),
    })),
    freeFirstDesign: freeFirstDesignEnabled && !freeDesignAlreadyUsed,
    isFirstOrder,
    puffJacketBackBasePrice: parseFloat(config["puff_jacket_back_base_price"] ?? "35.00"),
  };

  const pricing = computeQuotePricing(data, pricingOpts);

  // Create the order in the DB — cast to any for new fields pending migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (prisma.workflowOrder.create as any)({
    data: {
      orderNumber: generateOrderNumber(),
      clientUserId: userId,
      title: data.designTitle,
      serviceType: data.serviceType,
      nicheSlug: data.nicheSlug,
      status: "SUBMITTED",
      notes: data.notes || null,
      quantity: data.quantity,
      leadSource: data.leadSource ?? "WEBSITE",
      placement: data.placement || null,
      designHeightIn: data.designHeightIn ?? null,
      designWidthIn: data.designWidthIn ?? null,
      fabricType: data.fabricType || null,
      is3dPuffJacketBack: data.is3dPuffJacketBack,
      trims: data.trims || null,
      threadBrand: data.threadBrand || null,
      colorDetails: data.colorDetails || null,
      colorQuantity: data.colorQuantity ?? null,
      fileFormats: data.fileFormats,
      stitchCount: data.stitchCount ?? null,
      specialInstructions: data.specialInstructions || null,
      isFreeDesign: pricing.isFreeDesign,
      estimatedPrice: pricing.total,
    },
  });

  // Update client profile counters (non-fatal)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).clientProfile?.upsert({
    where: { userId },
    create: {
      userId,
      freeDesignUsed: pricing.isFreeDesign,
      totalOrderCount: 1,
      leadSource: data.leadSource ?? "WEBSITE",
    },
    update: {
      totalOrderCount: { increment: 1 },
      freeDesignUsed: pricing.isFreeDesign ? true : (clientProfile?.freeDesignUsed ?? false),
    },
  }).catch(() => null);

  // Save reference files if any
  if (data.referenceFiles.length > 0) {
    await prisma.clientReferenceFile.createMany({
      data: data.referenceFiles.map((f) => ({
        orderId: order.id,
        uploaderUserId: userId,
        fileName: f.fileName,
        objectKey: f.objectKey,
        bucket: f.bucket,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
      })),
    });
  }

  await logActivity({
    actor: { id: userId, email: session.user.email ?? null, role: session.user.role ?? null },
    action: "order.created",
    entityType: "order",
    entityId: order.id,
    metadata: {
      orderNumber: order.orderNumber,
      serviceType: data.serviceType,
      estimatedPrice: pricing.total,
      isFreeDesign: pricing.isFreeDesign,
    },
  });

  // Send order confirmation email (non-fatal)
  if (session.user.email) {
    try {
      await sendOrderCreatedEmail({
        to: session.user.email,
        clientName: session.user.name ?? "Valued Customer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        serviceType: data.serviceType,
        estimatedPrice: pricing.isFreeDesign ? 0 : pricing.total,
        recipientUserId: userId,
      });
    } catch (err) {
      await writeNotificationLog({
        eventType: "ORDER_CREATED",
        audience: "CLIENT",
        channel: "EMAIL",
        recipientUserId: userId,
        recipientAddress: session.user.email,
        orderId: order.id,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Ops notification
  const opsEmail = process.env.OPS_EMAIL ?? process.env.ADMIN_EMAIL;
  if (opsEmail && session.user.email) {
    try {
      await sendNewOrderOpsEmail({
        to: opsEmail,
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName: session.user.name ?? session.user.email,
        clientEmail: session.user.email,
        serviceType: data.serviceType,
        isGuest: false,
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({
    ok: true,
    mode: "order",
    message: pricing.isFreeDesign
      ? "Your first design is on us! Order submitted successfully."
      : "Direct order submitted successfully.",
    orderNumber: order.orderNumber,
    orderId: order.id,
    pricing,
    isFreeDesign: pricing.isFreeDesign,
  });
}
