import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function makeClient() {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error("S3 credentials not configured.");

  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getDefaultBucket() {
  return (
    process.env.ORDER_FILES_BUCKET ??
    process.env.ORDER_IMAGES_BUCKET ??
    process.env.S3_BUCKET ??
    process.env.CHAT_ATTACHMENTS_BUCKET ??
    null
  );
}

export function getProofBucket() {
  return (
    process.env.PAYMENT_PROOFS_BUCKET ??
    process.env.ORDER_IMAGES_BUCKET ??
    process.env.S3_BUCKET ??
    process.env.CHAT_ATTACHMENTS_BUCKET ??
    null
  );
}

export async function createPutSignedUrl(bucket: string, key: string, contentType: string, expiresIn = 600) {
  const client = makeClient();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(client, command, { expiresIn });
}

export async function createGetSignedUrl(bucket: string, key: string, expiresIn = 300) {
  const client = makeClient();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export function sanitizeFileName(name: string) {
  return name
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}
