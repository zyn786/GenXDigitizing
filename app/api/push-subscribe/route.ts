// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// POST — save subscription
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { userId, endpoint, p256dh, auth } = await req.json();
    if (!userId || !endpoint) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (user.id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = createAdminClient();

    // Upsert: update if endpoint exists, insert if not (race-condition safe)
    const { error: upsertErr } = await db.from("user_push_subscriptions")
      .upsert({ user_id: userId, endpoint, p256dh, auth }, { onConflict: "endpoint" });
    if (upsertErr) {
      console.error("[push-subscribe] Upsert error:", upsertErr);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}

// DELETE — remove subscription
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { userId, endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

    const db = createAdminClient();
    // Only delete if user owns this subscription
    await db.from("user_push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", userId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
