import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";
import {
  sendNewQuoteOpsEmail,
  writeNotificationLog,
} from "@/lib/notifications/email";

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GXQ-${ts}-${rand}`;
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
  quantity: z.coerce.number().int().min(1).max(5000).default(1),
  notes: z.string().max(2000).optional().or(z.literal("")),
  referenceFiles: z.array(refFileSchema).max(10).default([]),
});

function esc(v: string) {
  return v
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

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

      await prisma.clientProfile.create({
        data: { userId, leadSource: "WEBSITE", totalOrderCount: 0 },
      }).catch(() => null);
    }
  }

  const order = await prisma.workflowOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      clientUserId: userId,
      title: data.designTitle,
      serviceType: data.serviceType,
      status: "DRAFT",
      quoteStatus: "NEW",
      notes: data.notes || null,
      quantity: data.quantity,
      leadSource: "WEBSITE",
      placement: (data.placement || null) as null,
    },
  });

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

  await logActivity({
    actor: { id: userId, email: data.email, role: "CLIENT" },
    action: "quote.created",
    entityType: "order",
    entityId: order.id,
    metadata: {
      orderNumber: order.orderNumber,
      serviceType: data.serviceType,
      isGuest,
    },
  });

  // Quote confirmation email to client
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "GenX Digitizing <noreply@genxdigitizing.com>";
  const firstName = data.name.split(" ")[0] || "there";
  const subject = `Quote request received — ${order.orderNumber}`;

  try {
    await resend.emails.send({
      from,
      to: data.email,
      subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:0 auto;padding:24px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">GenX Digitizing</div>
        <h1 style="margin:12px 0 0;font-size:26px;">Quote request received</h1>
        <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
        <p style="margin:10px 0 0;">
          We've received your quote request <strong>${esc(order.orderNumber)}</strong> for <strong>${esc(data.serviceType.replace(/_/g, " "))}</strong>.
          Our team will review it and send you a price within one business day.
        </p>
        <p style="margin:10px 0 0;">We'll follow up at this email address.</p>
        <p style="margin:32px 0 0;color:#6b7280;font-size:13px;">Questions? Reply to this email or visit <a href="${appUrl()}" style="color:#374151;">${appUrl()}</a>.</p>
      </div>`,
      text: `Hi ${firstName},\n\nWe received your quote request ${order.orderNumber} for ${data.serviceType}.\n\nWe'll follow up with pricing within one business day.\n\n— GenX Digitizing`,
    });
    await writeNotificationLog({
      eventType: "QUOTE_SENT",
      audience: "CLIENT",
      channel: "EMAIL",
      recipientUserId: isGuest ? null : userId,
      recipientAddress: data.email,
      orderId: order.id,
      status: "SENT",
    });
  } catch {
    // non-fatal
  }

  // Ops notification
  const opsEmail = process.env.OPS_EMAIL ?? process.env.ADMIN_EMAIL;
  if (opsEmail) {
    try {
      await sendNewQuoteOpsEmail({
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
    message: "Quote request submitted! We'll email you with pricing within one business day.",
    orderNumber: order.orderNumber,
    orderId: order.id,
  });
}
