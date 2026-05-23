// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import {
  getFreeDesignById,
  updateFreeDesign,
  deleteFreeDesign,
  addFreeDesignImage,
  removeFreeDesignImage,
} from "@/lib/supabase/free-designs-queries";

// GET /api/admin/free-designs/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const design = await getFreeDesignById(params.id);
    return NextResponse.json(design);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Not found" }, { status: 404 });
  }
}

// PUT /api/admin/free-designs/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const design = await updateFreeDesign(params.id, {
      title: body.title,
      slug: body.slug,
      description: body.description,
      stitchCount: body.stitchCount,
      colors: body.colors,
      designSize: body.designSize,
      formats: body.formats,
      machines: body.machines,
      downloadUrl: body.downloadUrl,
      featured: body.featured,
      visible: body.visible,
      sortOrder: body.sortOrder,
    });

    // Handle image additions
    if (body.imagesToAdd && body.imagesToAdd.length > 0) {
      for (const img of body.imagesToAdd) {
        await addFreeDesignImage(params.id, {
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          alt: img.alt,
          width: img.width,
          height: img.height,
          sortOrder: img.sortOrder || 0,
        });
      }
    }

    // Handle image removals
    if (body.imageIdsToRemove && body.imageIdsToRemove.length > 0) {
      for (const imageId of body.imageIdsToRemove) {
        await removeFreeDesignImage(imageId);
      }
    }

    return NextResponse.json(design);
  } catch (error: any) {
    console.error("Update free design error:", error);
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/admin/free-designs/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteFreeDesign(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete" }, { status: 500 });
  }
}
