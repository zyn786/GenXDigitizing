// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteFromStorage,
  deleteLegacyS3,
  extractS3Key,
  isS3Key,
  normalizeStoragePath,
} from "@/lib/storage";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  try {
    // Get file record
    const { data: file } = await supabase
      .from("order_files")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Delete from storage (legacy S3 rows use the fallback path)
    try {
      if (isS3Key(file.file_url)) {
        await deleteLegacyS3(extractS3Key(file.file_url));
      } else {
        await deleteFromStorage(normalizeStoragePath(file.file_url), file.file_type);
      }
    } catch {
      // Storage delete failure is non-fatal
    }

    // Delete DB record
    const { error } = await supabase.from("order_files").delete().eq("id", params.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[file delete]", err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
