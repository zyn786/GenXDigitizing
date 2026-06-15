// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/audit — log an admin action (protected by middleware)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: body.userId || null,
      action: body.action,
      entity: body.entity,
      entity_id: body.entityId || null,
      old_data: body.oldData || null,
      new_data: body.newData || null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
