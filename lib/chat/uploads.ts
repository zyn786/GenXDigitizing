import { randomUUID } from "crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  AttachmentUploadIntent,
  CurrentChatActor,
} from "@/lib/chat/types";

const MAX_BYTES = 200 * 1024 * 1024;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

function createS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
  });
}

export async function createChatAttachmentUploadIntent(
  actor: CurrentChatActor,
  input: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }
): Promise<AttachmentUploadIntent> {
  if (input.sizeBytes > MAX_BYTES) {
    throw new Error("Attachment exceeds 200 MB limit.");
  }

  const bucket =
    process.env.CHAT_ATTACHMENTS_BUCKET ?? process.env.S3_BUCKET ?? null;

  if (!bucket) {
    throw new Error("CHAT_ATTACHMENTS_BUCKET is not configured.");
  }

  const safeName = sanitizeFileName(input.fileName);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const objectKey = `threads/${datePrefix}/${actor.id}/${randomUUID()}-${safeName}`;

  const client = createS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: input.mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: 60 * 10,
  });

  return {
    uploadUrl,
    attachment: {
      bucket,
      objectKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    },
  };
}