// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { reorderPortfolios } from "@/lib/supabase/portfolio-queries";

// POST /api/admin/portfolio/reorder
export async function POST(req: NextRequest) {
  try {
    const { orderedIds } = await req.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds array required" }, { status: 400 });
    }
    await reorderPortfolios(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reorder" }, { status: 500 });
  }
}
