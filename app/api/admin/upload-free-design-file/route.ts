// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3, getS3SignedUrl } from "@/lib/s3";

// POST /api/admin/upload-free-design-file — upload design files to S3
// Auth: middleware.ts enforces admin role for all /api/admin/* routes.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 50MB for design files)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `free-designs/${Date.now()}-${safeName}`;
    const contentType = file.type || "application/octet-stream";

    console.log(`Uploading free design file: ${file.name} (${file.size} bytes) → ${key}`);
    await uploadToS3(buffer, key, contentType);

    // Public download URL — not under /api/admin/ so anyone can download
    const fileUrl = `/api/free-designs/download-file?key=${encodeURIComponent(key)}`;

    return NextResponse.json({
      url: fileUrl,
      path: key,
      fileName: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error("Free design file upload error:", err);
    const message = err?.message ?? "Upload failed";
    if (err?.Code || err?.$metadata) {
      console.error("S3 error details:", JSON.stringify(err, null, 2));
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — resolve presigned URL for download
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key param" }, { status: 400 });
    }

    const signedUrl = await getS3SignedUrl(key, 86400);
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    console.error("Free design file download error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
