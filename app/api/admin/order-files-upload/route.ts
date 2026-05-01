import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createPutSignedUrl, getDefaultBucket, sanitizeFileName } from "@/lib/s3";
import { orderFileUploadIntentSchema } from "@/lib/payments/schemas";

const DESIGNER_ROLES = ["SUPER_ADMIN", "MANAGER", "DESIGNER"];
const PROOF_PREVIEW_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!DESIGNER_ROLES.includes(String(session.user.role ?? ""))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  // Extract fileType before schema validation (it's an extension not in the base schema)
  const rawFileType = body?.fileType;
  const fileType: "PROOF_PREVIEW" | "FINAL_FILE" =
    rawFileType === "PROOF_PREVIEW" ? "PROOF_PREVIEW" : "FINAL_FILE";

  const parsed = orderFileUploadIntentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  // Validate mime type for proof previews
  if (fileType === "PROOF_PREVIEW" && !PROOF_PREVIEW_MIME_TYPES.includes(parsed.data.mimeType.toLowerCase())) {
    return NextResponse.json(
      { error: "Proof preview images must be JPG or PNG only." },
      { status: 400 }
    );
  }

  const bucket = getDefaultBucket();
  if (!bucket) return NextResponse.json({ error: "File upload not configured." }, { status: 503 });

  const safeName = sanitizeFileName(parsed.data.fileName);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const folder = fileType === "PROOF_PREVIEW" ? "proof-previews" : "order-files";
  const objectKey = `${folder}/${datePrefix}/${randomUUID()}-${safeName}`;

  try {
    const uploadUrl = await createPutSignedUrl(bucket, objectKey, parsed.data.mimeType);
    return NextResponse.json({ uploadUrl, objectKey, bucket, fileType }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create upload intent." }, { status: 500 });
  }
}
