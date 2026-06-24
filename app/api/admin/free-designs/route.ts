// @ts-nocheck
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAllFreeDesigns, createFreeDesign, addFreeDesignImage } from "@/lib/supabase/free-designs-queries";

// GET /api/admin/free-designs — list all (admin)
export async function GET() {
  try {
    const designs = await getAllFreeDesigns();
    return NextResponse.json({ designs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch free designs" }, { status: 500 });
  }
}

// POST /api/admin/free-designs — create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const design = await createFreeDesign({
      title: body.title,
      slug: body.slug,
      description: body.description || "",
      stitchCount: body.stitchCount || 0,
      colors: body.colors || 1,
      designSize: body.designSize || "",
      formats: body.formats || [],
      machines: body.machines || [],
      downloadUrl: body.downloadUrl || null,
      featured: body.featured || false,
      visible: body.visible ?? true,
      sortOrder: body.sortOrder || 0,
    });

    // Add images if provided
    if (body.images && body.images.length > 0) {
      for (const img of body.images) {
        await addFreeDesignImage(design.id, {
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          alt: img.alt,
          width: img.width,
          height: img.height,
          sortOrder: img.sortOrder || 0,
        });
      }
    }

    return NextResponse.json(design, { status: 201 });
  } catch (error: any) {
    console.error("Create free design error:", error);
    return NextResponse.json({ error: error.message || "Failed to create free design" }, { status: 500 });
  }
}
