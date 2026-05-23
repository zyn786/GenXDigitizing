// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getPublicPortfolio, getCategoriesWithCounts } from "@/lib/supabase/portfolio-queries";

// GET /api/portfolio?category=digitizing&featured=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";

    const [items, categories] = await Promise.all([
      getPublicPortfolio(category || undefined, featured),
      getCategoriesWithCounts(),
    ]);

    return NextResponse.json({ items, categories });
  } catch (error: any) {
    console.error("Fetch portfolio error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch portfolio" }, { status: 500 });
  }
}
