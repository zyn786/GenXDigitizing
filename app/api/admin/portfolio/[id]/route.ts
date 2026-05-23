// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { updatePortfolio, deletePortfolio } from "@/lib/supabase/portfolio-queries";

// PATCH /api/admin/portfolio/[id] — update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.clientName !== undefined) updateData.client_name = body.clientName || null;
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId;
    if (body.stitches !== undefined) updateData.stitches = body.stitches || null;
    if (body.colors !== undefined) updateData.colors = body.colors;
    if (body.format !== undefined) updateData.output_format = body.format;
    if (body.turnaround !== undefined) updateData.turnaround = body.turnaround;
    if (body.size !== undefined) updateData.design_size = body.size;
    if (body.accent !== undefined) updateData.accent = body.accent;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.visible !== undefined) updateData.visible = body.visible;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder;

    const item = await updatePortfolio(id, updateData, body.images);
    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Update portfolio error:", error);
    return NextResponse.json({ error: error.message || "Failed to update portfolio" }, { status: 500 });
  }
}

// DELETE /api/admin/portfolio/[id] — delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deletePortfolio(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete portfolio" }, { status: 500 });
  }
}
