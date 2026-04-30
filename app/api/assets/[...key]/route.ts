import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

function makeClient() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET =
  process.env.S3_BUCKET ??
  process.env.ORDER_IMAGES_BUCKET ??
  process.env.CHAT_ATTACHMENTS_BUCKET ??
  "genxdigitizing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");
  const range = request.headers.get("range") ?? undefined;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: range,
    });
    const s3res = await makeClient().send(command);

    const headers = new Headers();
    if (s3res.ContentType)   headers.set("Content-Type",   s3res.ContentType);
    if (s3res.ContentLength) headers.set("Content-Length", String(s3res.ContentLength));
    if (s3res.ContentRange)  headers.set("Content-Range",  s3res.ContentRange);
    if (s3res.AcceptRanges)  headers.set("Accept-Ranges",  s3res.AcceptRanges);
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

    const status = range ? 206 : 200;
    return new NextResponse(s3res.Body as ReadableStream, { status, headers });
  } catch {
    return new NextResponse("Asset not found", { status: 404 });
  }
}
