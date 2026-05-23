// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getPublicFreeDesigns } from "@/lib/supabase/free-designs-queries";

// GET /api/free-designs?featured=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured") === "true";

    const designs = await getPublicFreeDesigns(featured);
    return NextResponse.json({ designs });
  } catch (error: any) {
    console.error("Fetch free designs error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch free designs" }, { status: 500 });
  }
}
