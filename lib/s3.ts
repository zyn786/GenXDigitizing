import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export const S3_BUCKET = process.env.CHAT_ATTACHMENTS_BUCKET || "genxdigitizing";

/** Prefix for S3 keys stored in file_url to distinguish from Supabase paths */
export const S3_PREFIX = "s3::";

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  // Return prefixed key for storage in DB (e.g. "s3::orders/123/artwork/file.png")
  return `${S3_PREFIX}${key}`;
}

/** Generate a presigned POST URL + fields for direct browser→S3 upload (no server memory buffer) */
export async function createPresignedPost(
  key: string,
  contentType: string = "application/octet-stream",
  maxSizeBytes: number = 50 * 1024 * 1024, // 50MB default
  expiresIn: number = 600 // 10 minutes
): Promise<{ url: string; fields: Record<string, string> }> {
  // Use presigned URL approach — generate a PUT presigned URL for direct upload
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSizeBytes, // upper bound; S3 will reject if actual exceeds
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  // Return as POST-compatible format (the frontend can PUT directly to this URL)
  return {
    url,
    fields: { key, "Content-Type": contentType },
  };
}

export async function getS3SignedUrl(key: string, expiresIn: number = 86400): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}

/** Check if stored file_url is an S3 key */
export function isS3Key(fileUrl: string): boolean {
  return fileUrl?.startsWith(S3_PREFIX) || fileUrl?.includes("sharktech.net") || false;
}

/** Extract raw S3 key from stored file_url (strips s3:: prefix or parses full URL) */
export function extractS3Key(fileUrl: string): string {
  if (fileUrl.startsWith(S3_PREFIX)) return fileUrl.slice(S3_PREFIX.length);
  const prefix = `${S3_BUCKET}/`;
  const idx = fileUrl.indexOf(prefix);
  if (idx !== -1) return fileUrl.slice(idx + prefix.length);
  return fileUrl.replace(/^https?:\/\/[^/]+\/[^/]+\//, "");
}
