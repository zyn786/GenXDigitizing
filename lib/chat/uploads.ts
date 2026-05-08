import { randomUUID } from "crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  ALLOWED_CHAT_FILE_EXTENSIONS,
  type AttachmentUploadIntent,
  type CurrentChatActor,
} from "@/lib/chat/types";

const MAX_BYTES = 200 * 1024 * 1024;

const BLOCKED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "msi", "ps1", "sh", "bash", "zsh",
  "js", "mjs", "cjs", "ts", "jsx", "tsx",
  "php", "phtml", "php3", "php4", "php5",
  "html", "htm", "xhtml", "shtml",
  "py", "rb", "pl", "lua", "go", "rs",
  "jar", "war", "class",
  "dll", "so", "dylib",
  "vbs", "vbe", "wsf", "wsh",
  "scr", "reg", "lnk",
]);

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

function validateFileExtension(fileName: string, mimeType: string): void {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const allowedSet = new Set(ALLOWED_CHAT_FILE_EXTENSIONS as readonly string[]);

  // Check blocked extensions first (security-critical)
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new Error(`File type ".${ext}" is not allowed.`);
  }

  // SVG allowed by extension but block inline due to XSS risk
  if (ext === "svg" || mimeType === "image/svg+xml") {
    throw new Error("SVG files are not accepted for security reasons.");
  }

  // Check against allowlist
  if (!allowedSet.has(ext)) {
    throw new Error(
      `File type ".${ext}" is not supported. Allowed: ${ALLOWED_CHAT_FILE_EXTENSIONS.join(", ")}`,
    );
  }
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

  // Validate file extension + block dangerous types
  validateFileExtension(input.fileName, input.mimeType);

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