import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { quoteOrderSchema } from "@/schemas/quote-order";
import { computeQuotePricing } from "@/lib/quote-order/pricing";
import { getAllPricingConfig, getActiveBulkDiscountRules } from "@/lib/pricing/config";
import { logActivity } from "@/lib/activity/logger";
import { sendNewQuoteOpsEmail } from "@/lib/notifications/email";

const refFileSchema = z.object({
  fileName: z.string().min(1),
  objectKey: z.string().min(1),
  bucket: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

const quoteWithFilesSchema = quoteOrderSchema.extend({
  referenceFiles: z.array(refFileSchema).max(10).default([]),
});

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GXQ-${ts}-${rand}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = quoteWithFilesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Validation failed.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const userId = session.user.id!;

  const [config, bulkRules, clientProfile] = await Promise.all([
    getAllPricingConfig(),
    getActiveBulkDiscountRules(),
    prisma.clientProfile.findUnique({
      where: { userId },
      select: { totalOrderCount: true },
    }),
  ]);

  const mappedBulkRules = bulkRules.map((r) => ({
    minQty: r.minQty,
    discountPercent: typeof r.discountPercent === "number"
      ? r.discountPercent
      : (r.discountPercent as { toNumber(): number }).toNumber(),
  }));

  const freeFirstDesign = config["free_first_design_enabled"] === "true";
  const isFirstOrder = (clientProfile?.totalOrderCount ?? 0) === 0;

  const pricingOpts = {
    stitchRatePer1000: parseFloat(config["stitch_rate_per_1000"] ?? "1.00"),
    stitchPricingEnabled: config["stitch_pricing_enabled"] === "true",
    puffJacketBackBasePrice: parseFloat(config["puff_jacket_back_base_price"] ?? "35.00"),
    bulkRules: mappedBulkRules,
    freeFirstDesign,
    isFirstOrder,
  };

  const pricing = computeQuotePricing(data, pricingOpts);

  // Coupon validation & application
  let couponDiscountAmount = 0;
  let appliedCouponCode: string | null = null;
  const rawCouponCode = data.couponCode?.trim().toUpperCase() || null;

  if (rawCouponCode && !pricing.isFreeDesign) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: rawCouponCode },
      select: { id: true, code: true, discountType: true, discountValue: true, maxUses: true, usedCount: true, expiresAt: true, isActive: true },
    });

    const now = new Date();
    const valid =
      coupon &&
      coupon.isActive &&
      (coupon.expiresAt === null || coupon.expiresAt > now) &&
      (coupon.maxUses === null || coupon.usedCount < coupon.maxUses);

    if (!valid) {
      return NextResponse.json(
        { ok: false, message: "Coupon code is invalid, expired, or has reached its usage limit." },
        { status: 422 }
      );
    }

    const baseForDiscount = pricing.total;
    couponDiscountAmount = coupon.discountType === "PERCENT"
      ? Math.round(baseForDiscount * (Number(coupon.discountValue) / 100) * 100) / 100
      : Math.min(Math.round(Number(coupon.discountValue) * 100) / 100, baseForDiscount);

    appliedCouponCode = coupon.code;
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  const finalTotal = Math.max(0, Math.round((pricing.total - couponDiscountAmount) * 100) / 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (prisma.workflowOrder.create as any)({
    data: {
      orderNumber: generateOrderNumber(),
      clientUserId: userId,
      title: data.designTitle,
      serviceType: data.serviceType,
      nicheSlug: data.nicheSlug,
      status: "DRAFT",
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
      estimatedPrice: finalTotal,
      couponCode: appliedCouponCode,
      couponDiscountAmount: couponDiscountAmount > 0 ? couponDiscountAmount : null,
    },
  });

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
    action: "quote.created",
    entityType: "order",
    entityId: order.id,
    metadata: { orderNumber: order.orderNumber, serviceType: data.serviceType, estimatedPrice: finalTotal, couponCode: appliedCouponCode ?? undefined, couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined },
  });

  // Ops notification
  const opsEmail = process.env.OPS_EMAIL ?? process.env.ADMIN_EMAIL;
  if (opsEmail && session.user.email) {
    try {
      await sendNewQuoteOpsEmail({
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
    mode: "quote",
    message: "Quote request submitted successfully. We'll confirm pricing within one business day.",
    orderNumber: order.orderNumber,
    orderId: order.id,
    pricing: { ...pricing, total: finalTotal, couponCode: appliedCouponCode, couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : null },
  });
}
