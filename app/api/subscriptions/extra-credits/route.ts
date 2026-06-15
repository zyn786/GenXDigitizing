// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/subscriptions/extra-credits
 * Create a one-time invoice for extra design credits.
 * Admin must approve and send payment link.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId, credits, amount } = await req.json();
    if (!clientId || !credits || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify client belongs to user
    const { data: client } = await supabase
      .from("clients")
      .select("id, user_id")
      .eq("id", clientId)
      .single();

    if (!client || client.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    // Fetch universal subscription payment link
    const { data: payLink } = await admin.from("platform_settings")
      .select("value").eq("key", "subscription_payment_link").maybeSingle();
    const universalLink = payLink?.value || null;

    // Create invoice with payment link attached
    const invoiceData: Record<string, unknown> = {
      client_id: clientId,
      amount: Number(amount),
      currency: "USD",
      status: "pending",
      due_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      notes: `Extra credits: ${credits} design credits — $${amount} one-time`,
    };
    if (universalLink) invoiceData.payoneer_checkout_url = universalLink;

    const { data: invoice, error: invErr } = await admin.from("invoices").insert(invoiceData).select("id, invoice_number").single();

    if (invErr) {
      console.error("[extra-credits] Invoice insert error:", invErr);
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }

    // Notify admins with push
    const { notifyRole, notifyUser } = await import("@/lib/notify-helpers");
    notifyRole("admin", {
      type: "system",
      title: `Extra credits requested — ${user.email}`,
      body: `${user.email} wants ${credits} extra design credits for $${amount}.`,
      action_url: "/admin/invoices",
    }).catch(e => console.error("[extra-credits] Admin notify error:", e));

    // Notify client with payment link
    const paymentMsg = universalLink
      ? `Your invoice ${invoice?.invoice_number || ""} for ${credits} extra credits is ready. Pay here to get your credits: ${universalLink}`
      : `Your request for ${credits} extra credits has been received. Admin will send a payment link shortly.`;
    notifyUser(user.id, {
      type: "payment",
      title: `Extra credits requested — ${credits} credits`,
      body: paymentMsg,
      action_url: universalLink || "/client/subscribe",
    }).catch(e => console.error("[extra-credits] Client notify error:", e));

    return NextResponse.json({ ok: true, paymentLink: universalLink });
  } catch (err) {
    console.error("[extra-credits]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
