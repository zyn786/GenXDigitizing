// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";

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

    // Verify file belongs to an order assigned to this designer
    const { data: file } = await supabase
      .from("order_files")
      .select("id, file_url, file_name, file_type, order_id, orders!inner(designer_id)")
      .eq("id", file_id)
      .eq("order_id", order_id)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Confirm ownership
    const order = (file as any).orders as any;
    if (order?.designer_id !== user.designer_id) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }

    // Only allow deleting output files (not client artwork)
    if (!["output", "revision"].includes(file.file_type)) {
      return NextResponse.json({ error: "Can only delete output files" }, { status: 422 });
    }

    // Delete from storage (admin client bypasses RLS on storage.objects)
    if (file.file_url) {
      try {
        const bucket = file.file_type === "output" || file.file_type === "revision" ? "outputs" : "artwork";
        let storagePath = file.file_url;
        if (file.file_url.startsWith("http")) {
          const urlObj = new URL(file.file_url);
          const marker = `/object/public/${bucket}/`;
          const markerSign = `/object/sign/${bucket}/`;
          if (urlObj.pathname.includes(marker)) {
            storagePath = decodeURIComponent(urlObj.pathname.split(marker)[1].split("?")[0]);
          } else if (urlObj.pathname.includes(markerSign)) {
            storagePath = decodeURIComponent(urlObj.pathname.split(markerSign)[1].split("?")[0]);
          }
        }
        await supabase.storage.from(bucket).remove([storagePath]);
      } catch (err: any) {
        console.error("[file-delete] Storage delete warning:", err?.message ?? err);
      }
    }

    // Delete the record from order_files
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
