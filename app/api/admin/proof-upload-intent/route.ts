import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createPutSignedUrl, getDefaultBucket, sanitizeFileName } from "@/lib/s3";

const ALLOWED_ROLES = ["SUPER_ADMIN", "MANAGER", "DESIGNER"];

const schema = z.object({
  orderId: z.string().cuid(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(128),
  sizeBytes: z.number().int().positive().max(100 * 1024 * 1024), // 100 MB max for proofs
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  // Designers can only upload proofs for orders assigned to them
  if (session.user.role === "DESIGNER") {
    const order = await prisma.workflowOrder.findUnique({
      where: { id: parsed.data.orderId },
      select: { assignedToUserId: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.assignedToUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden — not assigned to this order." }, { status: 403 });
    }
  }

  const bucket = getDefaultBucket();
  if (!bucket) return NextResponse.json({ error: "File upload not configured." }, { status: 503 });

  const safeName = sanitizeFileName(parsed.data.fileName);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const objectKey = `proofs/${datePrefix}/${randomUUID()}-${safeName}`;

  try {
    const uploadUrl = await createPutSignedUrl(bucket, objectKey, parsed.data.mimeType);
    return NextResponse.json({ uploadUrl, objectKey, bucket }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create upload intent." }, { status: 500 });
  }
}
