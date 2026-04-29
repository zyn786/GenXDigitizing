import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "@/auth";
import { isAppAdminRole } from "@/lib/auth/session";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !isAppAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as
    | { fileName?: string; mimeType?: string; sizeBytes?: number }
    | null;

  if (!body?.fileName || !body?.mimeType || typeof body?.sizeBytes !== "number") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(body.mimeType)) {
    return NextResponse.json({ error: "Only JPG, PNG, and WebP are allowed." }, { status: 400 });
  }

  if (body.sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit." }, { status: 400 });
  }

  const bucket = process.env.ORDER_IMAGES_BUCKET ?? process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "Image upload is not configured." }, { status: 503 });
  }

  const client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });

  const month = new Date().toISOString().slice(0, 7);
  const objectKey = `portfolio/${month}/${randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: body.mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

  return NextResponse.json({ uploadUrl, objectKey }, { status: 201 });
}
