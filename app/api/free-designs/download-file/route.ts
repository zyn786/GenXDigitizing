// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getS3SignedUrl } from "@/lib/s3";

// GET /api/free-designs/download-file?key=... — public download (no auth required)
// Generates a fresh presigned S3 URL and redirects.
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
    return NextResponse.json({ error: err?.message ?? "Download failed" }, { status: 500 });
  }
}
