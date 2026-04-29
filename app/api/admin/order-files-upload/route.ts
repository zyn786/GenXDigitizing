import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createPutSignedUrl, getDefaultBucket, sanitizeFileName } from "@/lib/s3";
import { orderFileUploadIntentSchema } from "@/lib/payments/schemas";

const DESIGNER_ROLES = ["SUPER_ADMIN", "MANAGER", "DESIGNER"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!DESIGNER_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = orderFileUploadIntentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const bucket = getDefaultBucket();
  if (!bucket) return NextResponse.json({ error: "File upload not configured." }, { status: 503 });

  const safeName = sanitizeFileName(parsed.data.fileName);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const objectKey = `order-files/${datePrefix}/${randomUUID()}-${safeName}`;

  try {
    const uploadUrl = await createPutSignedUrl(bucket, objectKey, parsed.data.mimeType);
    return NextResponse.json({ uploadUrl, objectKey, bucket }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create upload intent." }, { status: 500 });
  }
}
