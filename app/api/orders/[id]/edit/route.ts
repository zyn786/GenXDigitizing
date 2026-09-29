// @ts-nocheck
export const runtime = "nodejs";

/**
 * PATCH /api/orders/[id]/edit — a client edits their own order's spec.
 *
 * This feature has never worked. The component wrote the changes straight to
 * `orders` from the browser, but the only UPDATE policy a client has is
 * `orders_client_cancel` (migration 029), whose `WITH CHECK (status = 'cancelled')`
 * means any other update is rejected by RLS — so every save failed with a
 * row-level security error, and the edit log was never written either.
 *
 * The update now happens here, with the admin client, behind an ownership check
 * and an explicit field whitelist. Price, status and assignment are deliberately
 * not editable: RLS cannot express "these columns must be unchanged" in a
 * WITH CHECK clause, which is the underlying reason a policy-based approach was
 * the wrong tool for this.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";

/** Only these may be changed by a client, and only in these states. */
const EDITABLE = [
  "output_format",
  "additional_formats",
  "width_inches",
  "height_inches",
  "color_count",
  "placement_notes",
] as const;

const EDITABLE_STATUSES = ["submitted", "assigned", "in_progress", "review"];

const label = (f: string) => f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function asText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return JSON.stringify(v);
  return String(v);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();

    const { data: client } = await db
      .from("clients")
      .select("id, users(full_name)")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: order } = await db
      .from("orders")
      .select(`id, order_number, client_id, status, ${EDITABLE.join(", ")}`)
      .eq("id", params.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!client || order.client_id !== client.id) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        {
          error: `This order is ${order.status} and can no longer be edited. Message us instead.`,
        },
        { status: 422 }
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    const logRows: Record<string, unknown>[] = [];

    for (const field of EDITABLE) {
      if (!(field in body)) continue;
      const next = body[field] ?? null;
      const prev = (order as any)[field] ?? null;

      // Compare on a normalised form so [] vs null or "1" vs 1 don't log noise.
      const same =
        field === "additional_formats"
          ? asText(next) === asText(prev)
          : asText(next) === asText(prev);
      if (same) continue;

      updates[field] = next;
      logRows.push({
        order_id: order.id,
        field_name: field,
        old_value: asText(prev),
        new_value: asText(next),
        changed_by: user.id,
        reviewed_by_admin: false,
      });
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No changes detected" }, { status: 422 });
    }

    updates.updated_at = new Date().toISOString();

    const { error: updErr } = await db.from("orders").update(updates).eq("id", order.id);
    if (updErr) {
      console.error("[orders/edit] update failed:", updErr);
      return NextResponse.json(
        { error: "Could not save changes. Please try again." },
        { status: 500 }
      );
    }

    const { error: logErr } = await db.from("order_edit_log").insert(logRows);
    if (logErr) {
      // The order changed but the audit trail did not. Say so rather than
      // claiming the team was notified.
      console.error("[orders/edit] edit log failed:", logErr);
    }

    const orderNumber = order.order_number || order.id;
    const changed = logRows.map((r) => label(String(r.field_name))).join(", ");

    const { data: admins } = await db
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);
    if (admins?.length && !logErr) {
      await notifyUsers(
        admins.map((a: any) => a.id),
        {
          type: "order_update",
          title: `Order edited — ${orderNumber}`,
          body: `${(client as any).users?.full_name ?? "Client"} changed: ${changed}. Review before production.`,
          action_url: `/admin/orders/${order.id}`,
        }
      );
    }

    return NextResponse.json({
      success: true,
      changed: logRows.map((r) => r.field_name),
      teamNotified: !logErr,
    });
  } catch (err: any) {
    console.error("[orders/edit]", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
