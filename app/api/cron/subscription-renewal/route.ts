// @ts-nocheck
export const runtime = "nodejs";

/**
 * Subscription Renewal Cron — runs daily via Vercel Cron.
 *
 * Grace period lifecycle:
 *   Day 0:     Period ends → auto-renew with rollover + new invoice
 *   Day 1-7:   Grace period → reminder notifications
 *   Day 7:     Grace expired → pause subscription
 *   Day 30:    Abandoned → cancel/expire
 *
 * Secure with CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { PLAN_CONFIG } from "@/lib/plans";
import { emailSubscriptionExpiring } from "@/lib/email/subscription";
import { notifyUser } from "@/lib/notify-helpers";
import { createCronMonitor } from "@/lib/cron-monitor";

const GRACE_DAYS = 7;
const ABANDON_DAYS = 30;

export async function GET(req: NextRequest) {
  const monitor = createCronMonitor("subscription-renewal");
  try {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const graceStart = new Date(now.getTime() - GRACE_DAYS * 24 * 3600000);
  const abandonStart = new Date(now.getTime() - ABANDON_DAYS * 24 * 3600000);

  const renewed: string[] = [];
  const reminded: string[] = [];
  const paused: string[] = [];
  const expired: string[] = [];

  // ── Phase 1: Auto-renew subscriptions that just ended ──────
  const { data: justEnded } = await supabase
    .from("client_subscriptions")
    .select("*, clients:client_id(user_id, email)")
    .eq("status", "active")
    .lte("current_period_end", now.toISOString())
    .gte("current_period_end", graceStart.toISOString());

  for (const sub of justEnded ?? []) {
    const planConfig = PLAN_CONFIG[sub.plan];
    if (!planConfig) continue;

    const maxRollover = Math.floor(sub.designs_total / 2);
    const totalAvailable = sub.designs_total + (sub.designs_rolled_over || 0);
    const unused = totalAvailable - (sub.designs_used || 0);
    const rolledOver = Math.max(0, Math.min(unused, maxRollover));

    const newStart = new Date(Math.max(new Date(sub.current_period_end).getTime(), now.getTime()));
    const newEnd = new Date(newStart.getTime() + 30 * 24 * 3600000);

    await supabase.from("client_subscriptions").update({
      designs_used: 0,
      designs_rolled_over: rolledOver,
      current_period_start: newStart.toISOString(),
      current_period_end: newEnd.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", sub.id);

    // New invoice
    const invoiceAmount = planConfig.price;
    await supabase.from("invoices").insert({
      client_id: sub.client_id,
      amount: invoiceAmount,
      currency: "USD",
      status: "pending",
      due_at: new Date(now.getTime() + 7 * 24 * 3600000).toISOString(),
      notes: `Subscription renewal: ${sub.plan} plan (${planConfig.designs} designs/mo) — $${invoiceAmount}/month${rolledOver > 0 ? `. ${rolledOver} designs rolled over.` : ""}`,
    });

    // Notify client
    const clientUser = (sub.clients as any)?.user_id;
    const clientEmail = (sub.clients as any)?.email;
    if (clientUser) {
      const rolloverNote = rolledOver > 0 ? ` ${rolledOver} unused designs carried over.` : "";
      notifyUser(clientUser, {
        type: "system",
        title: `Subscription renewed — ${sub.plan.toUpperCase()}`,
        body: `Your plan renewed. ${planConfig.designs} designs available.${rolloverNote} Invoice: $${invoiceAmount}.`,
        action_url: "/client/subscribe",
      }).catch(e => console.error("[cron] Renewal notify error:", e));
    }
    // Send renewal email
    if (clientEmail) {
      const { emailSubscriptionApproved } = await import("@/lib/email/subscription");
      emailSubscriptionApproved(clientEmail, planConfig.label, planConfig.price, planConfig.designs, undefined, planConfig.features)
        .catch(e => console.error("[cron/renewal] Email failed:", e));
    }

    renewed.push(sub.id);
  }

  // ── Phase 2: Grace period reminders (3 days before suspension) ──
  const threeDaysBeforeSuspend = new Date(now.getTime() - 4 * 24 * 3600000); // ended 4+ days ago
  const { data: inGrace } = await supabase
    .from("client_subscriptions")
    .select("*, clients:client_id(user_id, email)")
    .eq("status", "active")
    .lte("current_period_end", threeDaysBeforeSuspend.toISOString())
    .gte("current_period_end", graceStart.toISOString());

  for (const sub of inGrace ?? []) {
    const clientUser = (sub.clients as any)?.user_id;
    const daysLeft = Math.max(1, Math.ceil((new Date(sub.current_period_end).getTime() + GRACE_DAYS * 24 * 3600000 - now.getTime()) / (24 * 3600000)));

    if (clientUser) {
      notifyUser(clientUser, {
        type: "system",
        title: `Subscription expiring — ${daysLeft} day${daysLeft > 1 ? "s" : ""} left`,
        body: `Your ${sub.plan.toUpperCase()} plan's grace period ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Renew now to keep your credits.`,
        action_url: "/client/subscribe",
      }).catch(e => console.error("[cron] Grace notify error:", e));
      reminded.push(sub.id);
    }

    // Email reminder
    const userEmail = (sub.clients as any)?.email;
    if (userEmail) {
      const remaining = sub.designs_total - sub.designs_used + (sub.designs_rolled_over || 0);
      emailSubscriptionExpiring(userEmail, sub.plan.toUpperCase(), daysLeft, remaining).catch(() => {});
    }
  }

  // ── Phase 3: Suspend after grace period expires ──
  const { data: graceExpired } = await supabase
    .from("client_subscriptions")
    .select("*, clients:client_id(user_id, email)")
    .eq("status", "active")
    .lte("current_period_end", graceStart.toISOString())
    .gte("current_period_end", abandonStart.toISOString());

  for (const sub of graceExpired ?? []) {
    await supabase.from("client_subscriptions").update({
      status: "paused",
      updated_at: now.toISOString(),
    }).eq("id", sub.id);

    const clientUser = (sub.clients as any)?.user_id;
    if (clientUser) {
      notifyUser(clientUser, {
        type: "system",
        title: "Subscription paused — grace period expired",
        body: `Your ${sub.plan.toUpperCase()} plan has been paused. Reactivate within ${ABANDON_DAYS - GRACE_DAYS} days to keep your rolled-over credits.`,
        action_url: "/client/subscribe",
      }).catch(e => console.error("[cron] Pause notify error:", e));
    }
    paused.push(sub.id);
  }

  // ── Phase 4: Cancel abandoned subscriptions ──
  const { data: abandoned } = await supabase
    .from("client_subscriptions")
    .select("*")
    .in("status", ["paused", "active"])
    .lte("current_period_end", abandonStart.toISOString());

  for (const sub of abandoned ?? []) {
    await supabase.from("client_subscriptions").update({
      status: "expired",
      designs_rolled_over: 0,
      updated_at: now.toISOString(),
    }).eq("id", sub.id);

    expired.push(sub.id);
  }

  return monitor.success({
    renewed: renewed.length,
    reminded: reminded.length,
    paused: paused.length,
    expired: expired.length,
  });
  } catch (err) {
    return monitor.error(err);
  }
}
