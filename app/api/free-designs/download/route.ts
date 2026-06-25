// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { incrementDownloadCount } from "@/lib/supabase/free-designs-queries";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/free-designs/download — track download (non-critical)
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 20 download tracking calls per IP per minute (lightweight)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit("free-designs-dl", ip, 20, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { designId } = await req.json();
    if (!designId) {
      return NextResponse.json({ error: "designId is required" }, { status: 400 });
    }

    try {
      await incrementDownloadCount(designId);
    } catch {
      // Tracking failed — non-critical, download still works
      console.log("[free-designs] Download tracking skipped for:", designId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
