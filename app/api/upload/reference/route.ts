import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createPutSignedUrl, sanitizeFileName } from "@/lib/s3";

const schema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  guestEmail: z.email().optional(),
});

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf", "application/zip",
  "image/svg+xml",
];
const MAX_BYTES = 30 * 1024 * 1024; // 30 MB

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { fileName, mimeType, sizeBytes, guestEmail } = parsed.data;

    // Must be logged in OR provide guest email
    if (!session?.user?.id && !guestEmail) {
      return NextResponse.json({ error: "Provide email for guest uploads." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
    }

    if (sizeBytes > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 30 MB limit." }, { status: 400 });
    }

    const bucket =
      process.env.ORDER_IMAGES_BUCKET ??
      process.env.S3_BUCKET ??
      null;

    if (!bucket) {
      return NextResponse.json({ error: "File upload not configured." }, { status: 503 });
    }

    const uploaderSlug = session?.user?.id ?? (guestEmail?.split("@")[0] ?? "guest");
    const safeName = sanitizeFileName(fileName);
    const datePrefix = new Date().toISOString().slice(0, 10);
    const objectKey = `client-refs/${datePrefix}/${uploaderSlug}/${randomUUID()}-${safeName}`;

    const uploadUrl = await createPutSignedUrl(bucket, objectKey, mimeType);

    return NextResponse.json({ uploadUrl, objectKey, bucket }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create upload intent." }, { status: 500 });
  }
}
