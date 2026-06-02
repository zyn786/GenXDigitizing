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

    // Upsert to avoid duplicates
    const { data: existing } = await db.from("user_push_subscriptions").select("id").eq("endpoint", endpoint).maybeSingle();
    if (existing) return NextResponse.json({ ok: true });

    await db.from("user_push_subscriptions").insert({ user_id: userId, endpoint, p256dh, auth });
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
    await db.from("user_push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
