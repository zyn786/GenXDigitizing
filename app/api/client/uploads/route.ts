import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function sanitizeFileName(name: string) {
  return name
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { fileName?: string; mimeType?: string; sizeBytes?: number };
    const { fileName, mimeType, sizeBytes } = body;

    if (!fileName || !mimeType || typeof sizeBytes !== "number") {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed." }, { status: 400 });
    }

    if (sizeBytes > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 20 MB limit." }, { status: 400 });
    }

    const bucket = process.env.ORDER_IMAGES_BUCKET ?? process.env.S3_BUCKET;
    if (!bucket) {
      return NextResponse.json({ error: "Image upload is not configured." }, { status: 503 });
    }

    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: "Image upload is not configured." }, { status: 503 });
    }

    const client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId, secretAccessKey },
    });

    const safeName = sanitizeFileName(fileName);
    const datePrefix = new Date().toISOString().slice(0, 10);
    const objectKey = `order-refs/${datePrefix}/${session.user.id}/${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

    return NextResponse.json({ uploadUrl, objectKey }, { status: 201 });
  } catch (err) {
    console.error("Upload intent error", err);
    return NextResponse.json({ error: "Failed to create upload intent." }, { status: 500 });
  }
}
