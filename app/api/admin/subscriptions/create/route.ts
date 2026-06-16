// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PLAN_CONFIG } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const { email, plan } = await req.json();
    if (!email || !plan || !PLAN_CONFIG[plan]) return NextResponse.json({ error: "Invalid email or plan" }, { status: 400 });

    const admin = createAdminClient();
    const config = PLAN_CONFIG[plan];

    // Find client by user email
    const { data: clientUser } = await admin.from("users").select("id").eq("email", email).single();
    if (!clientUser) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const { data: client } = await admin.from("clients").select("id").eq("user_id", clientUser.id).single();
    if (!client) return NextResponse.json({ error: "No client profile" }, { status: 404 });

    // Cancel any existing active/pending subs
    await admin.from("client_subscriptions").update({ status: "cancelled", cancellation_reason: "plan_change", updated_at: new Date().toISOString() }).eq("client_id", client.id).in("status", ["active", "pending"]);

    // Create subscription with active status (admin-created, no approval needed)
    const { data: sub, error: subErr } = await admin.from("client_subscriptions").insert({
      client_id: client.id, plan, designs_total: config.designs, status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
    }).select().single();

    if (subErr || !sub) return NextResponse.json({ error: "Failed to create" }, { status: 500 });

    // Create paid invoice
    await admin.from("invoices").insert({
      client_id: client.id, amount: config.price, currency: "USD", status: "paid",
      paid_at: new Date().toISOString(),
      notes: `Subscription: ${plan} plan (${config.designs} designs/mo) — $${config.price}/month`,
    });

    // Notify client
    const { notifyUser } = await import("@/lib/notify-helpers");
    notifyUser(clientUser.id, {
      type: "system", title: "Subscription activated! 🎉",
      body: `Admin activated your ${config.label} plan — ${config.designs} designs/month. Start ordering!`,
      action_url: "/client/new-order",
    }).catch(console.error);

    return NextResponse.json({ ok: true, subscription: sub });
  } catch (err) {
    console.error("[admin/subscriptions/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
