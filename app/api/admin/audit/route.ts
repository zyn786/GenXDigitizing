// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/audit — log an admin action (protected by middleware).
 *
 * `user_id` is taken from the signed-in session, never from the request body.
 * It used to be `body.userId || null`, so an admin — or anyone who reached this
 * path — could attribute an action to a different user, or to nobody. An audit
 * trail whose actor field the caller controls is not an audit trail.
 *
 * The insert itself is checked: a failed write here is a missing audit record,
 * and the old `catch` returned 500 without saying which action was lost.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body?.action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      user_id: user.id,
      action: body.action,
      entity: body.entity,
      entity_id: body.entityId || null,
      old_data: body.oldData || null,
      new_data: body.newData || null,
    });

    if (error) {
      console.error(
        "[admin/audit] audit record NOT written —",
        body.action,
        body.entity,
        body.entityId,
        error.message
      );
      return NextResponse.json({ error: "Audit write failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/audit]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
