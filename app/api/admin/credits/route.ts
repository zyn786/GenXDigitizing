// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/credits?clientId=xxx
 * Get credit history for a client (admin only — protected by middleware)
 */
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: sub } = await admin.from("client_subscriptions")
    .select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(1).maybeSingle();

  const { data: client } = await admin.from("clients")
    .select("credit_balance, tier").eq("id", clientId).single();

  return NextResponse.json({
    credit_balance: client?.credit_balance ?? 0,
    tier: client?.tier ?? "new",
    current_sub: sub || null,
  });
}

/**
 * POST /api/admin/credits
 * Adjust client credit balance (admin only — protected by middleware)
 * Body: { clientId, amount, reason }
 */
export async function POST(req: NextRequest) {
  try {
    const { clientId, amount, reason } = await req.json();
    if (!clientId || amount == null) return NextResponse.json({ error: "clientId and amount required" }, { status: 400 });

    const admin = createAdminClient();
    const numAmount = Number(amount);

    // Get current balance
    const { data: client } = await admin.from("clients").select("credit_balance").eq("id", clientId).single();
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const newBalance = Math.max(0, (client.credit_balance || 0) + numAmount);

    // Update balance
    const { error: updErr } = await admin.from("clients")
      .update({ credit_balance: newBalance }).eq("id", clientId);
    if (updErr) return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });

    // Log adjustment
    await admin.from("audit_logs").insert({
      user_id: null,
      action: numAmount > 0 ? "credit_add" : "credit_remove",
      entity: "client",
      entity_id: clientId,
      new_data: { credit_balance: newBalance, adjustment: numAmount, reason: reason || "Manual adjustment" },
    });

    return NextResponse.json({ ok: true, credit_balance: newBalance, adjustment: numAmount });
  } catch (err) {
    console.error("[admin/credits]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
