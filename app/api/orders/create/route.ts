// @ts-nocheck
export const runtime = "nodejs";

/**
 * POST /api/orders/create — the only way an order is created.
 *
 * Replaces a client-side `supabase.from("orders").insert(...)` followed by a
 * detached `fetch("/api/order-confirm", ...).catch(() => {})`. That sequence had
 * four failure modes, all silent:
 *
 *   - the tab closing between insert and notify left an order the team was never
 *     told about;
 *   - the price was computed in the browser, so the customer chose what to pay;
 *   - a failed artwork upload cancelled the order with the error unchecked, so a
 *     failed cancel left a live order with no files;
 *   - the deadline came from the customer's device clock.
 *
 * Here the order row, its price, its deadline and its notification are created
 * together, server-side, from data the caller cannot forge.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { computeDeadline } from "@/lib/sla";
import { recordRedemption, validateCoupon } from "@/lib/coupons";
import { getCreditCost } from "@/lib/plans";
import { notifyUsers } from "@/lib/notify-server";
import { emailOrderSubmitted } from "@/lib/email";
import { isMissingColumn } from "@/lib/db-errors";

const MAX_QUANTITY = 50;
const TURNAROUNDS = new Set(["standard", "rush", "urgent"]);

const TURNAROUND_LABEL: Record<string, string> = {
  standard: "Standard (12–24h)",
  rush: "Rush (6h) ⚡ FREE",
  urgent: "Urgent (3h) 🔥 FREE",
};

const money = (n: number) => Math.round(n * 100) / 100;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();

    // Resolve the caller's own client record. The body's client_id is never
    // trusted — that was the whole point of the policy we removed.
    const { data: client } = await db
      .from("clients")
      .select("id, users(id, full_name, email)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!client) {
      return NextResponse.json({ error: "No client profile for this account" }, { status: 403 });
    }

    const body = await req.json();
    const {
      service_tier_id,
      turnaround,
      output_format,
      additional_formats,
      width_inches,
      height_inches,
      color_count,
      placement_notes,
      design_name,
      quantity,
      coupon_code,
      visitor_id,
      use_credits,
      idempotency_key,
      file_count,
      // Both are collected by the wizard and shown on the confirmation screen
      // the customer approves, and neither was in the request body — so the
      // digitizer never saw them.
      stitch_count,
      instructions,
    } = body;

    // `orders.stitch_count` is an int (001_initial_schema.sql:130) and the
    // customer types into a free-text box ("12,000", "approx 8k"), so only a
    // clean number goes in the column. Anything else is kept as text in the
    // placement notes rather than dropped or mis-parsed.
    const stitchDigits = String(stitch_count ?? "").replace(/[^\d]/g, "");
    const stitchCountInt = stitchDigits ? parseInt(stitchDigits, 10) : null;
    const stitchCountUnparsed =
      stitch_count && !stitchCountInt ? String(stitch_count).trim() : null;

    if (!service_tier_id || !design_name?.trim()) {
      return NextResponse.json({ error: "Service and design name are required" }, { status: 400 });
    }
    if ((width_inches && !height_inches) || (!width_inches && height_inches)) {
      return NextResponse.json(
        { error: "Enter both width and height, or neither" },
        { status: 400 }
      );
    }

    // Retry safety: a repeated submission returns the original order.
    if (idempotency_key) {
      const { data: existing } = await db
        .from("orders")
        .select("*")
        .eq("idempotency_key", idempotency_key)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ order: existing, reused: true });
      }
    }

    // Pricing comes from the tier, never from the request.
    const { data: tier } = await db
      .from("service_tiers")
      .select("*")
      .eq("id", service_tier_id)
      .maybeSingle();

    if (!tier || !tier.is_active) {
      return NextResponse.json({ error: "Unknown or inactive service" }, { status: 400 });
    }

    const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), MAX_QUANTITY);
    const turn = TURNAROUNDS.has(turnaround) ? turnaround : "standard";
    const subtotal = money(Number(tier.price) * qty);

    // ── Coupon, validated and priced here ───────────────────
    let discount = 0;
    let coupon: { id: string; code: string } | null = null;

    if (coupon_code) {
      const result = await validateCoupon(String(coupon_code), {
        visitorId: String(visitor_id ?? ""),
        fileCount: Number(file_count) || 0,
        orderTotal: subtotal,
      });

      if (result.valid && result.coupon) {
        discount = money(Math.min(result.discount ?? 0, subtotal));
        coupon = { id: result.coupon.id, code: result.coupon.code };
      } else {
        // Report rather than silently drop it — the customer believes it applied.
        return NextResponse.json(
          { error: result.error ?? "Coupon could not be applied" },
          { status: 422 }
        );
      }
    }

    // ── Credits ─────────────────────────────────────────────
    // QuickOrder pays with subscription credits instead of money. Previously the
    // client decremented them with `.catch(() => {})`, so a failed decrement
    // produced a free order.
    let price = money(subtotal - discount);
    let planCredits = 0;
    let extraCredits = 0;
    let subscriptionId: string | null = null;

    if (use_credits) {
      const { data: sub } = await db
        .from("client_subscriptions")
        .select("*")
        .eq("client_id", client.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sub) {
        return NextResponse.json({ error: "No active subscription" }, { status: 422 });
      }

      // Same rule the UI shows, computed from the same row.
      const perDesign = getCreditCost(sub.plan, !!tier.is_big_design, tier.credit_cost);
      const needed = perDesign * qty;
      const remaining = sub.designs_total - sub.designs_used + (sub.designs_rolled_over || 0);

      const { data: clientRow } = await db
        .from("clients")
        .select("credit_balance")
        .eq("id", client.id)
        .single();

      planCredits = Math.max(0, Math.min(remaining, needed));
      extraCredits = needed - planCredits;

      if (extraCredits > (clientRow?.credit_balance ?? 0)) {
        return NextResponse.json(
          {
            error: `Not enough credits — ${needed} needed, ${remaining + (clientRow?.credit_balance ?? 0)} available.`,
          },
          { status: 422 }
        );
      }

      subscriptionId = sub.id;
      price = 0;
      discount = 0;
    }

    // ── Create ──────────────────────────────────────────────
    const payload: Record<string, unknown> = {
      client_id: client.id,
      service_tier_id: tier.id,
      output_format: output_format || "DST",
      additional_formats:
        Array.isArray(additional_formats) && additional_formats.length ? additional_formats : null,
      turnaround: turn,
      price,
      currency: "USD",
      width_inches: width_inches ? Number(width_inches) : null,
      height_inches: height_inches ? Number(height_inches) : null,
      color_count: color_count ? parseInt(color_count) : null,
      placement_notes:
        [
          placement_notes?.trim(),
          instructions?.trim() && `Instructions: ${String(instructions).trim()}`,
          stitchCountUnparsed && `Stitch count (as given): ${stitchCountUnparsed}`,
        ]
          .filter(Boolean)
          .join("\n") || null,
      stitch_count: stitchCountInt,
      design_name: design_name.trim(),
      // Server clock, not the customer's device.
      sla_deadline: computeDeadline(turn, !!tier.is_big_design),
      status: "submitted",
      idempotency_key: idempotency_key || null,
      // No coupon columns here. `orders` has never had coupon_code / coupon_id /
      // discount_amount (001_initial_schema.sql:114-140, and no migration adds
      // them) — they exist only on coupon_redemptions. Writing them made
      // PostgREST reject the entire insert, and the missing-column retry below
      // only strips idempotency_key, so EVERY order that used a coupon failed
      // outright with "Could not create the order". The discount itself is
      // already carried in `price`; the coupon link is recorded in
      // coupon_redemptions below.
    };

    let { data: order, error: insertErr } = await db
      .from("orders")
      .insert(payload)
      .select()
      .single();

    // `idempotency_key` arrives in migration 047. Until that is applied the
    // column does not exist, and sending it would fail the insert — taking
    // ordering down completely. Retry without it so this route is safe to deploy
    // either side of the migration. Retry protection is lost, nothing else is.
    if (insertErr && isMissingColumn(insertErr) && "idempotency_key" in payload) {
      console.warn(
        "[orders/create] idempotency_key column missing — apply migration 047. Creating without retry protection."
      );
      delete payload.idempotency_key;
      ({ data: order, error: insertErr } = await db
        .from("orders")
        .insert(payload)
        .select()
        .single());
    }

    if (insertErr || !order) {
      // A unique-violation here means a concurrent retry won the race.
      if (insertErr?.code === "23505" && idempotency_key) {
        const { data: won } = await db
          .from("orders")
          .select("*")
          .eq("idempotency_key", idempotency_key)
          .maybeSingle();
        if (won) return NextResponse.json({ order: won, reused: true });
      }
      console.error("[orders/create] insert failed:", insertErr);
      return NextResponse.json(
        { error: "Could not create the order. Please try again." },
        { status: 500 }
      );
    }

    // ── Consume credits now that the order exists ───────────
    // Order first, credits second: if consumption fails the order is real and
    // visible, and an admin gets told. The reverse order risks charging for an
    // order that was never created.
    let creditWarning: string | null = null;

    if (use_credits && (planCredits > 0 || extraCredits > 0)) {
      try {
        if (planCredits > 0 && subscriptionId) {
          const { error } = await db.rpc("increment_sub_usage", {
            sub_id: subscriptionId,
            amount: planCredits,
          });
          if (error) throw new Error(error.message);
        }
        if (extraCredits > 0) {
          const { data: ok, error } = await db.rpc("decrement_credit_balance", {
            p_client_id: client.id,
            p_amount: extraCredits,
          });
          if (error) throw new Error(error.message);
          // The RPC is atomic and returns false when the balance is short.
          if (ok === false) throw new Error("credit balance changed during checkout");
        }
      } catch (err) {
        creditWarning = err?.message ?? "credit consumption failed";
        console.error(
          "[orders/create] credit consumption failed:",
          creditWarning,
          "order:",
          order.order_number
        );
      }
    }

    const orderNumber = order.order_number || order.id;
    const clientUser = (client as any).users;

    // ── Record the coupon redemption ────────────────────────
    // This route validated and priced the coupon but never recorded it, so the
    // usage counter never incremented and the admin coupon report undercounted.
    // Failure is reported, never swallowed — but it must not fail an order the
    // customer has already paid for.
    if (coupon) {
      try {
        await recordRedemption(
          coupon.id,
          String(visitor_id ?? ""),
          clientUser?.email ?? null,
          orderNumber,
          discount
        );
      } catch (err) {
        console.error(
          "[orders/create] coupon redemption NOT recorded —",
          coupon.code,
          orderNumber,
          err
        );
      }
    }

    // ── Notify, server-side and awaited ─────────────────────
    // This used to be a separate client fetch that a closed tab could skip.
    const { data: admins } = await db
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);
    if (admins?.length) {
      await notifyUsers(
        admins.map((a: any) => a.id),
        {
          type: "order_update",
          title: `New order — ${orderNumber}`,
          body: `${tier.label} · ${qty > 1 ? `${qty}× · ` : ""}$${price.toFixed(0)} · ${TURNAROUND_LABEL[turn] ?? turn}`,
          action_url: "/admin/orders",
        }
      );

      if (creditWarning) {
        await notifyUsers(
          admins.map((a: any) => a.id),
          {
            type: "payment",
            title: `Credits not applied — ${orderNumber}`,
            body: `${clientUser?.full_name ?? "Client"}'s order was created but credit consumption failed: ${creditWarning}. Adjust manually.`,
            action_url: `/admin/orders/${order.id}`,
          }
        );
      }
    }

    if (clientUser?.email) {
      const estimated = turn === "urgent" ? "3 hours" : turn === "rush" ? "6 hours" : "12–24 hours";
      await emailOrderSubmitted({
        to: clientUser.email,
        clientName: clientUser.full_name ?? "there",
        orderNumber,
        serviceName: tier.label,
        price,
        turnaround: TURNAROUND_LABEL[turn] ?? turn,
        estimatedDelivery: estimated,
      }).catch((e: unknown) => console.error("[orders/create] confirmation email failed:", e));
    }

    return NextResponse.json({
      order,
      pricing: { subtotal, discount, total: price },
      credits: use_credits ? { planCredits, extraCredits, warning: creditWarning } : null,
    });
  } catch (err: any) {
    console.error("[orders/create]", err);
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
