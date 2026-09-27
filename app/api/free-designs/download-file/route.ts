// @ts-nocheck
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { signStorageUrl } from "@/lib/storage";

// GET /api/free-designs/download-file?key=... — public download (no auth required)
// Signed URL covers both Supabase Storage and legacy S3 keys.
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key param" }, { status: 400 });
    }

    // Legacy rows may store a full URL — redirect as-is
    if (key.startsWith("http")) {
      return NextResponse.redirect(key);
    }

    const signedUrl = await signStorageUrl(key, undefined, 86400);
    if (!signedUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    console.error("Free design file download error:", err);
    return NextResponse.json({ error: err?.message ?? "Download failed" }, { status: 500 });
  }
}
