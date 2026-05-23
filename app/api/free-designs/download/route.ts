// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { incrementDownloadCount } from "@/lib/supabase/free-designs-queries";

// POST /api/free-designs/download — track download
export async function POST(req: NextRequest) {
  try {
    const { designId } = await req.json();
    if (!designId) {
      return NextResponse.json({ error: "designId is required" }, { status: 400 });
    }

    const newCount = await incrementDownloadCount(designId);
    return NextResponse.json({ downloadCount: newCount });
  } catch (error: any) {
    console.error("Download tracking error:", error);
    return NextResponse.json({ error: error.message || "Failed to track download" }, { status: 500 });
  }
}
