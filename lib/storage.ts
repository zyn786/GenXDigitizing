// @ts-nocheck
/**
 * File storage — Supabase Storage (replaces S3).
 *
 * All uploads / signed URLs / deletes go through the service-role client,
 * which bypasses storage RLS policies. Paths stored in `file_url` are raw
 * storage paths (e.g. "orders/<id>/output/file.dst") — the bucket is
 * resolved from the path prefix at read time.
 *
 * Legacy S3 rows (file_url starting with "s3::" or containing the old
 * S3 endpoint, plus pre-prefix plain keys) keep working through the
 * fallback signer below until data is migrated. The fallback only
 * activates when S3_* env vars are present — remove them once migration
 * is done and old links simply stop resolving.
 */
import { createAdminClient } from "@/lib/supabase/server";

export const BUCKETS = {
  outputs: "outputs",
  artwork: "artwork",
  freeDesigns: "free-designs",
} as const;

/** Legacy S3 prefix stored in file_url rows written before the migration */
export const S3_PREFIX = "s3::";

/** Bucket name used by the legacy S3 fallback */
const LEGACY_S3_BUCKET = () => process.env.CHAT_ATTACHMENTS_BUCKET || "genxdigitizing";

/** Resolve which storage bucket a path lives in. Path prefixes win over file_type defaults. */
export function resolveBucket(path: string, fileType?: string): string {
  if (!path) return fileType === "output" ? BUCKETS.outputs : BUCKETS.artwork;
  if (/^free-designs\//.test(path)) return BUCKETS.freeDesigns;
  if (/^orders\/[^/]+\/output\//.test(path)) return BUCKETS.outputs;
  if (/^orders\/[^/]+\/artwork\//.test(path)) return BUCKETS.artwork;
  // chat / guest-uploads / requests live in the outputs bucket (see migration 008)
  if (/^(chat|guest-uploads|requests)\//.test(path)) return BUCKETS.outputs;
  // admin email attachments — written by app/api/admin/email/upload
  if (/^email-attachments\//.test(path)) return BUCKETS.artwork;
  if (fileType === "output" || fileType === "revision") return BUCKETS.outputs;
  return BUCKETS.artwork;
}

/** Strip bucket segments off a full /object/public/... or /object/sign/... URL, return raw path. */
export function normalizeStoragePath(fileUrl: string): string {
  if (!fileUrl) return fileUrl;
  if (fileUrl.startsWith("http")) {
    const pathname = new URL(fileUrl).pathname;
    const m = pathname.match(/\/object\/(?:public|sign|authenticated)\/[^/]+\/(.+)$/);
    if (m) return decodeURIComponent(m[1]);
  }
  return fileUrl;
}

/** Upload a buffer to Supabase Storage. Returns the raw path to store in file_url. */
export async function uploadToStorage(
  buffer: Buffer | ArrayBuffer,
  path: string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const supabase = createAdminClient();
  const bucket = resolveBucket(path);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) {
    console.error("[storage] Upload failed:", error.message, "bucket:", bucket, "path:", path);
    throw error;
  }
  return path;
}

/**
 * Create a signed URL for a storage path.
 * Falls back to legacy S3 signing when the object isn't found in Supabase
 * and S3 env vars are still configured (pre-migration rows).
 */
export async function signStorageUrl(
  path: string,
  fileType?: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createAdminClient();
  const bucket = resolveBucket(path, fileType);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (!error && data?.signedUrl) return data.signedUrl;

  // Not in Supabase Storage — maybe a legacy S3 object
  if (error) {
    console.error("[storage] Signed URL failed:", error.message, "bucket:", bucket, "path:", path);
    const legacy = await signLegacyS3(path, expiresIn);
    if (legacy) return legacy;
  }
  return null;
}

/** Delete an object from Supabase Storage. Returns error if any (null = success). */
export async function deleteFromStorage(path: string, fileType?: string): Promise<{ message: string } | null> {
  const supabase = createAdminClient();
  const bucket = resolveBucket(path, fileType);
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    // 404s on delete are fine — the object is already gone
    if (error.message?.includes("not found") || error.message?.includes("404")) return null;
    console.error("[storage] Delete failed:", error.message, "bucket:", bucket, "path:", path);
    return error;
  }
  return null;
}

// ── Legacy S3 (read/delete only — for rows written before the migration) ──

/** Check if stored file_url points at legacy S3 */
export function isS3Key(fileUrl: string): boolean {
  return fileUrl?.startsWith(S3_PREFIX) || fileUrl?.includes("sharktech.net") || false;
}

/** Extract raw S3 key from stored file_url (strips s3:: prefix or parses full URL) */
export function extractS3Key(fileUrl: string): string {
  if (fileUrl.startsWith(S3_PREFIX)) return fileUrl.slice(S3_PREFIX.length);
  const prefix = `${LEGACY_S3_BUCKET()}/`;
  const idx = fileUrl.indexOf(prefix);
  if (idx !== -1) return fileUrl.slice(idx + prefix.length);
  return fileUrl.replace(/^https?:\/\/[^/]+\/[^/]+\//, "");
}

function s3Configured(): boolean {
  return Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID);
}

/** Generate a signed download URL for a legacy S3 object. Null when S3 not configured. */
export async function signLegacyS3(key: string, expiresIn: number = 86400): Promise<string | null> {
  if (!s3Configured()) return null;
  try {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    return getSignedUrl(client, new GetObjectCommand({ Bucket: LEGACY_S3_BUCKET(), Key: key }), { expiresIn });
  } catch (err: any) {
    console.error("[storage] Legacy S3 sign failed:", err?.message ?? err);
    return null;
  }
}

/** Delete a legacy S3 object. No-op when S3 not configured. */
export async function deleteLegacyS3(key: string): Promise<void> {
  if (!s3Configured()) return;
  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    await client.send(new DeleteObjectCommand({ Bucket: LEGACY_S3_BUCKET(), Key: key }));
  } catch (err: any) {
    console.error("[storage] Legacy S3 delete failed:", err?.message ?? err);
  }
}
