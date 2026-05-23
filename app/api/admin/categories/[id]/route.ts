// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { deleteCategory, updateCategory } from "@/lib/supabase/portfolio-queries";

// PATCH /api/admin/categories/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const cat = await updateCategory(id, body);
    return NextResponse.json(cat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
