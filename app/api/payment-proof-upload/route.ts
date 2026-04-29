import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createPutSignedUrl, getProofBucket, sanitizeFileName } from "@/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as {
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  } | null;

  if (!body?.fileName || !body?.mimeType || typeof body?.sizeBytes !== "number") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(body.mimeType)) {
    return NextResponse.json({ error: "Only image files (JPG, PNG, WebP, GIF) are allowed." }, { status: 400 });
  }

  if (body.sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 20 MB limit." }, { status: 400 });
  }

  const bucket = getProofBucket();
  if (!bucket) return NextResponse.json({ error: "Upload not configured." }, { status: 503 });

  const safeName = sanitizeFileName(body.fileName);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const objectKey = `payment-proofs/${datePrefix}/${session.user.id}/${randomUUID()}-${safeName}`;

  try {
    const uploadUrl = await createPutSignedUrl(bucket, objectKey, body.mimeType);
    return NextResponse.json({ uploadUrl, objectKey, bucket }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create upload intent." }, { status: 500 });
  }
}
