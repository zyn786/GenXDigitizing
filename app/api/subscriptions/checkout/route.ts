// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PLAN_CONFIG } from "@/lib/plans";
import { emailSubscriptionRequested } from "@/lib/email/subscription";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan, clientId } = await req.json();
    if (!plan || !PLAN_CONFIG[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    if (!clientId) return NextResponse.json({ error: "Client ID required" }, { status: 400 });

    const admin = createAdminClient();
    const config = PLAN_CONFIG[plan];

    // Verify client belongs to this user
    const { data: client } = await admin.from("clients").select("id, user_id").eq("id", clientId).single();
    if (!client || client.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for resubscribe cooldown (prevent subscription hopping for free credits)
    // Also blocks re-subscribe while a cancellation request is pending review
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
    const { data: recentCancelled } = await admin.from("client_subscriptions")
      .select("id, plan, status, updated_at")
      .eq("client_id", clientId)
      .in("status", ["cancelled", "cancellation_requested"])
      .eq("plan", plan)
      .gte("updated_at", thirtyDaysAgo)
      .maybeSingle();

    if (recentCancelled) {
      const isPendingReview = recentCancelled.status === "cancellation_requested";
      return NextResponse.json({
        error: isPendingReview
          ? `You have a pending cancellation request for the ${plan} plan. Please wait for review or choose a different plan.`
          : `You recently cancelled a ${plan} plan. Please wait 30 days before re-subscribing to the same plan, or choose a different plan.`
      }, { status: 429 });
    }

    // Check for downgrade (fewer designs than current plan)
    let downgradeWarning: string | null = null;
    const { data: currentSub } = await admin.from("client_subscriptions")
      .select("plan, designs_total, designs_used")
      .eq("client_id", clientId)
      .in("status", ["active"])
      .maybeSingle();
    if (currentSub && config.designs < currentSub.designs_total) {
      downgradeWarning = `Downgrading from ${currentSub.plan.toUpperCase()} (${currentSub.designs_total} designs) to ${config.label} (${config.designs} designs). You will lose ${Math.max(0, currentSub.designs_total - currentSub.designs_used)} unused credits.`;
    }

    // Cancel any existing active/pending subscriptions (plan change)
    await admin.from("client_subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString(), cancellation_reason: "plan_change" })
      .eq("client_id", clientId)
      .in("status", ["active", "pending"]);

    // Create new subscription — use admin client to bypass RLS
    const { data: sub, error: subErr } = await admin.from("client_subscriptions").insert({
      client_id: clientId,
      plan,
      designs_total: config.designs,
      designs_used: 0,
      designs_rolled_over: 0,
      status: "pending",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
    }).select().single();

    if (subErr || !sub) {
      console.error("[subscriptions/checkout] Insert error:", subErr);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    // Create invoice — use admin client
    const { error: invErr } = await admin.from("invoices").insert({
      client_id: clientId,
      amount: config.price,
      currency: "USD",
      status: "pending",
      due_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      notes: `Subscription: ${plan} plan (${config.designs} designs/mo) — $${config.price}/month`,
    });
    if (invErr) console.error("[subscriptions/checkout] Invoice insert error:", invErr);

    // Notify admins with push
    const { notifyRole, notifyUser } = await import("@/lib/notify-helpers");
    notifyRole("admin", {
      type: "system",
      title: `New ${plan} subscription — ${user.email}`,
      body: `${user.email} requested ${plan} plan ($${config.price}/mo, ${config.designs} designs). Action: send payment link or activate directly.`,
      action_url: "/admin/subscriptions",
    }).catch(e => console.error("[checkout] Admin notify error:", e));

    // Notify client with push
    notifyUser(user.id, {
      type: "system",
      title: "Plan requested — " + PLAN_CONFIG[plan].label + " Plan",
      body: `Your ${PLAN_CONFIG[plan].label} plan ($${config.price}/mo, ${config.designs} designs) is pending. Complete payment to activate your plan.`,
      action_url: "/client/subscribe",
    }).catch(e => console.error("[checkout] Client notify error:", e));

    // Fetch payment link with 72h expiry
    const { data: payLink } = await admin.from("platform_settings")
      .select("value").eq("key", "subscription_payment_link").maybeSingle();
    const expiresAt = new Date(Date.now() + 72 * 3600000).toISOString();

    // Send welcome email
    emailSubscriptionRequested(user.email!, PLAN_CONFIG[plan].label, config.price, config.designs).catch(e => console.error("[checkout] Welcome email failed:", e));

    // Audit log
    admin.from("audit_logs").insert({
      user_id: user.id,
      action: "subscription_requested",
      entity: "subscription",
      entity_id: sub.id,
      new_data: { plan, clientId, designs: config.designs, price: config.price },
    }).then(() => {}).catch(e => console.error("[checkout] Audit log error:", e));

    return NextResponse.json({
      ok: true,
      subscription: sub,
      paymentLink: payLink?.value || null,
      paymentLinkExpiresAt: payLink?.value ? expiresAt : null,
      downgradeWarning: downgradeWarning || null,
    });
  } catch (err) {
    console.error("[subscriptions/checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
