// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { getAdminUser }              from "@/lib/supabase/get-user";

// GET /api/notifications — fetch latest 30 notifications for current user
export async function GET(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, action_url, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) { console.error("[notifications] error:", error); return NextResponse.json({ error: "Request failed" }, { status: 500 }); }

    const unread = (data ?? []).filter((n: any) => !n.is_read).length;

    return NextResponse.json({ notifications: data ?? [], unread });
  } catch (err: any) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all as read, or specific ids
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

    const body = await req.json().catch(() => ({}));
    const { ids } = body; // optional: array of IDs. If omitted, mark all as read

    const supabase = createAdminClient();

    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (ids?.length) { query = query.in("id", ids); }

    const { error } = await query;
    if (error) { console.error("[notifications] error:", error); return NextResponse.json({ error: "Request failed" }, { status: 500 }); }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

// POST /api/notifications — admin sends push notification to a user (with web push)
export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user || !["admin", "crm"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { notifyUser } = await import("@/lib/notify-helpers");
    await notifyUser(body.userId, {
      type: body.type || "system",
      title: body.title,
      body: body.body,
      action_url: body.action_url || undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
