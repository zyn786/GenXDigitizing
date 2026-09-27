// @ts-nocheck
/**
 * Read state for inbox messages.
 * `POST { id, is_read }` updates one message, or `POST { all: true }` marks
 * every unread message as read (the "Mark all read" action).
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const supabase = createAdminClient();

    if (body.all === true) {
      const res = await supabase
        .from("received_emails")
        .update({ is_read: true })
        .eq("is_read", false);
      if (res.error) {
        console.error("[admin/email/read] Mark-all failed:", res.error.message);
        return NextResponse.json({ error: res.error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Whole conversation — opening a thread marks every message in it read.
    if (body.threadId) {
      const res = await supabase
        .from("received_emails")
        .update({ is_read: body.is_read !== false })
        .eq("thread_id", body.threadId);
      if (res.error) {
        console.error("[admin/email/read] Thread update failed:", res.error.message,
          "— if this mentions thread_id, apply migration 038.");
        return NextResponse.json({ error: res.error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const res = await supabase
      .from("received_emails")
      .update({ is_read: body.is_read !== false })
      .eq("id", body.id);

    if (res.error) {
      console.error("[admin/email/read] Update failed:", res.error.message,
        "— if this mentions is_read, apply migration 037.");
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin/email/read]", err);
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
