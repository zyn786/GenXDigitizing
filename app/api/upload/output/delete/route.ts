// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";
import { deleteFromStorage, deleteLegacyS3, extractS3Key, isS3Key, normalizeStoragePath } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || !user.designer_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await req.json();
    const { file_id, order_id } = body;

    if (!file_id || !order_id) {
      return NextResponse.json({ error: "file_id and order_id required" }, { status: 400 });
    }

    const { data: file } = await supabase
      .from("order_files")
      .select("id, file_url, file_name, file_type, order_id, orders!inner(designer_id)")
      .eq("id", file_id)
      .eq("order_id", order_id)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const order = (file as any).orders as any;
    if (order?.designer_id !== user.designer_id) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }

    if (!["output", "revision"].includes(file.file_type)) {
      return NextResponse.json({ error: "Can only delete output files" }, { status: 422 });
    }

    // Delete from storage (legacy S3 rows use the fallback path)
    if (file.file_url) {
      try {
        if (isS3Key(file.file_url)) {
          await deleteLegacyS3(extractS3Key(file.file_url));
        } else {
          await deleteFromStorage(normalizeStoragePath(file.file_url), file.file_type);
        }
      } catch (err: any) {
        console.error("[file-delete] Storage delete warning:", err?.message ?? err);
      }
    }

    // Delete DB record
    const { error: delErr } = await supabase
      .from("order_files")
      .delete()
      .eq("id", file_id);

    if (delErr) {
      return NextResponse.json({ error: "Delete failed: " + delErr.message }, { status: 500 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      action:    `file_deleted:${file.file_type}`,
      entity:    "order_files",
      entity_id: file_id,
      user_id:   user.id,
      new_data:  { file_name: file.file_name, order_id, reason: "designer_delete" },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[file-delete] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
