// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getAdminPortfolios, createPortfolio } from "@/lib/supabase/portfolio-queries";

// GET /api/admin/portfolio — list all (admin)
export async function GET() {
  try {
    const items = await getAdminPortfolios();
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch portfolio" }, { status: 500 });
  }
}

// POST /api/admin/portfolio — create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await createPortfolio({
      title: body.title,
      slug: body.slug,
      description: body.description || "",
      client_name: body.clientName || null,
      category_id: body.categoryId,
      stitches: body.stitches || null,
      colors: body.colors || 1,
      output_format: body.format || "DST",
      turnaround: body.turnaround || "Standard",
      design_size: body.size || "",
      accent: body.accent || "#A855F7",
      featured: body.featured || false,
      visible: body.visible ?? true,
      tags: body.tags || [],
      sort_order: body.sortOrder || 0,
    }, body.images);

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Create portfolio error:", error);
    return NextResponse.json({ error: error.message || "Failed to create portfolio" }, { status: 500 });
  }
}
