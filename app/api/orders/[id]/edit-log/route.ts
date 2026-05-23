// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || !["admin", "crm"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const orderId  = params.id;
    const body     = await req.json();
    const { log_id, reviewed } = body;

    if (!log_id) {
      return NextResponse.json({ error: "log_id is required" }, { status: 400 });
    }

    // Verify the edit log entry belongs to this order
    const { data: logEntry, error: fetchErr } = await supabase
      .from("order_edit_log")
      .select("id, order_id")
      .eq("id", log_id)
      .eq("order_id", orderId)
      .single();

    if (fetchErr || !logEntry) {
      return NextResponse.json({ error: "Edit log entry not found for this order" }, { status: 404 });
    }

    if (reviewed === true) {
      const { error: updErr } = await supabase
        .from("order_edit_log")
        .update({
          reviewed_by_admin: true,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", log_id);

      if (updErr) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[edit-log] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
