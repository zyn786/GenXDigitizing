import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import { ensureDraftInvoiceForOrder } from "@/lib/billing/auto-invoice";
import {
  sendOrderCreatedEmail,
  sendNewOrderOpsEmail,
  writeNotificationLog,
} from "@/lib/notifications/email";
import { computeQuotePricing } from "@/lib/quote-order/pricing";
import { getAllPricingConfig, getActiveBulkDiscountRules } from "@/lib/pricing/config";

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GX-${ts}-${rand}`;
}

const refFileSchema = z.object({
  fileName: z.string().min(1),
  objectKey: z.string().min(1),
  bucket: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  serviceType: z.enum([
    "EMBROIDERY_DIGITIZING",
    "VECTOR_ART",
    "COLOR_SEPARATION_DTF",
    "CUSTOM_PATCHES",
  ]),
  designTitle: z.string().min(2).max(200),
  placement: z.string().optional().or(z.literal("")),
  fabricType: z.string().optional().or(z.literal("")),
  designHeightIn: z.coerce.number().min(0).max(24).optional(),
  designWidthIn: z.coerce.number().min(0).max(24).optional(),
  quantity: z.coerce.number().int().min(1).max(5000).default(1),
  colorQuantity: z.coerce.number().int().min(0).max(50).optional(),
  turnaround: z.enum(["STANDARD", "URGENT", "SAME_DAY"]).default("STANDARD"),
  notes: z.string().max(2000).optional().or(z.literal("")),
  specialInstructions: z.string().max(2000).optional().or(z.literal("")),
  referenceFiles: z.array(refFileSchema).max(10).default([]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please fill in all required fields.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check if already logged in — use their account; otherwise find/create guest user
  const session = await auth();
  let userId: string;
  let isGuest = false;

  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    isGuest = true;
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existing) {
      userId = existing.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          role: "CLIENT",
          onboardingComplete: false,
        },
      });
      userId = newUser.id;

      // Create a client profile for them
      await prisma.clientProfile.create({
        data: {
          userId,
          leadSource: "WEBSITE",
          totalOrderCount: 0,
        },
      }).catch(() => null);
    }
  }

  // Compute estimated price server-side — guest orders are never free
  let estimatedPrice: number | undefined;
  let isFreeDesign = false;
  try {
    const [config, bulkRules] = await Promise.all([
      getAllPricingConfig(),
      getActiveBulkDiscountRules(),
    ]);
    const pricing = computeQuotePricing(
      {
        mode: "order",
        serviceType: data.serviceType,
        placement: (data.placement ?? "") as string,
        designHeightIn: data.designHeightIn ?? 0,
        designWidthIn: data.designWidthIn ?? 0,
        quantity: data.quantity,
        turnaround: data.turnaround,
        colorCount: data.colorQuantity ?? 1,
        complexity: "MEDIUM",
        threeDPuff: false,
        is3dPuffJacketBack: false,
        sizeInches: Math.max(data.designHeightIn ?? 0, data.designWidthIn ?? 0),
        fabricType: data.fabricType ?? "",
        designTitle: data.designTitle,
        fileFormats: [],
        stitchCount: undefined,
        sourceCleanup: false,
        smallText: false,
        customerName: data.name,
        email: data.email,
        notes: data.notes ?? "",
        specialInstructions: data.specialInstructions ?? "",
        companyName: "",
        nicheSlug: "",
        trims: "",
        threadBrand: "",
        colorDetails: "",
      },
      {
        stitchRatePer1000: parseFloat(config["stitch_rate_per_1000"] ?? "1.00"),
        stitchPricingEnabled: config["stitch_pricing_enabled"] === "true",
        bulkRules: bulkRules.map((r) => ({
          minQty: r.minQty,
          discountPercent:
            typeof r.discountPercent === "number"
              ? r.discountPercent
              : (r.discountPercent as { toNumber(): number }).toNumber(),
        })),
        freeFirstDesign: false, // guests never get free first design
        isFirstOrder: false,
        puffJacketBackBasePrice: parseFloat(config["puff_jacket_back_base_price"] ?? "35.00"),
      },
    );
    estimatedPrice = pricing.total;
    isFreeDesign = pricing.isFreeDesign;
  } catch {
    // Non-fatal — order still created without estimate
    estimatedPrice = undefined;
  }

  const order = await prisma.workflowOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      clientUserId: userId,
      title: data.designTitle,
      serviceType: data.serviceType,
      status: "SUBMITTED",
      notes: data.notes || null,
      quantity: data.quantity,
      leadSource: "WEBSITE",
      placement: (data.placement || null) as null,
      designHeightIn: data.designHeightIn ?? null,
      designWidthIn: data.designWidthIn ?? null,
      fabricType: data.fabricType || null,
      colorQuantity: data.colorQuantity ?? null,
      specialInstructions: data.specialInstructions || null,
      estimatedPrice,
      isFreeDesign,
    },
  });

  // Auto-create DRAFT invoice (non-fatal)
  if (!isFreeDesign && (estimatedPrice ?? 0) > 0) {
    void ensureDraftInvoiceForOrder(order.id, {
      currency: "USD",
    }).catch(() => null);
  }

  // Save reference files
  if (data.referenceFiles.length > 0) {
    await prisma.clientReferenceFile.createMany({
      data: data.referenceFiles.map((f) => ({
        orderId: order.id,
        uploaderUserId: isGuest ? null : userId,
        uploaderEmail: isGuest ? data.email : null,
        fileName: f.fileName,
        objectKey: f.objectKey,
        bucket: f.bucket,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
      })),
    });
  }

  // Update client profile order count
  await prisma.clientProfile.updateMany({
    where: { userId },
    data: { totalOrderCount: { increment: 1 } },
  }).catch(() => null);

  await logActivity({
    actor: { id: userId, email: data.email, role: "CLIENT" },
    action: "order.created",
    entityType: "order",
    entityId: order.id,
    metadata: {
      orderNumber: order.orderNumber,
      serviceType: data.serviceType,
      isGuest,
      referenceFilesCount: data.referenceFiles.length,
    },
  });

  // Client confirmation email
  try {
    await sendOrderCreatedEmail({
      to: data.email,
      clientName: data.name,
      orderNumber: order.orderNumber,
      orderId: order.id,
      serviceType: data.serviceType,
      recipientUserId: isGuest ? null : userId,
      isGuest,
    });
  } catch (err) {
    await writeNotificationLog({
      eventType: "ORDER_CREATED",
      audience: "CLIENT",
      channel: "EMAIL",
      recipientUserId: isGuest ? null : userId,
      recipientAddress: data.email,
      orderId: order.id,
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : "Unknown",
    });
  }

  // Ops team notification
  const opsEmail = process.env.OPS_EMAIL ?? process.env.ADMIN_EMAIL;
  if (opsEmail) {
    try {
      await sendNewOrderOpsEmail({
        to: opsEmail,
        orderNumber: order.orderNumber,
        orderId: order.id,
        clientName: data.name,
        clientEmail: data.email,
        serviceType: data.serviceType,
        isGuest,
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Order submitted successfully! Check your email for confirmation.",
    orderNumber: order.orderNumber,
    orderId: order.id,
  });
}
