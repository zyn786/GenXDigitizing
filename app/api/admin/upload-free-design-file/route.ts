// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { uploadToS3, getS3SignedUrl } from "@/lib/s3";

// POST /api/admin/upload-free-design-file — upload design files to S3
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `free-designs/${Date.now()}-${safeName}`;
    const contentType = file.type || "application/octet-stream";

    await uploadToS3(buffer, key, contentType);

    const fileUrl = `/api/admin/upload-free-design-file?key=${encodeURIComponent(key)}&download=true`;

    return NextResponse.json({
      url: fileUrl,
      path: key,
      fileName: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error("Free design file upload error:", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
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
