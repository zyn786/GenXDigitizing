// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { incrementDownloadCount } from "@/lib/supabase/free-designs-queries";

// POST /api/free-designs/download — track download (non-critical)
export async function POST(req: NextRequest) {
  try {
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
