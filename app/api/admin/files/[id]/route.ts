// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
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

    // Delete from S3
    try {
      const { extractS3Key, S3_PREFIX } = await import("@/lib/s3");
      let key: string;
      if (file.file_url.startsWith(S3_PREFIX)) {
        key = extractS3Key(file.file_url);
      } else {
        key = new URL(file.file_url).pathname.slice(1);
      }
      await deleteFromS3(key);
    } catch {
      // S3 delete failure is non-fatal
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
