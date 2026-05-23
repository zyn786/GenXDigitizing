// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getAdminCategories, createCategory } from "@/lib/supabase/portfolio-queries";

// GET /api/admin/categories
export async function GET() {
  try {
    const categories = await getAdminCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category = await createCategory({
      name: body.name,
      slug: body.slug,
      emoji: body.emoji || "✦",
      color: body.color || "#A855F7",
      sort_order: body.sortOrder || 0,
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
