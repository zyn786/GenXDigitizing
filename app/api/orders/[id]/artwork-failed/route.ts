// @ts-nocheck
export const runtime = "nodejs";

/**
 * POST /api/orders/[id]/artwork-failed
 *
 * Called when the order was created but its artwork upload did not complete.
 *
 * The old behaviour was to set the order to `cancelled` and show a toast — with
 * the cancel write's error unchecked. Two things went wrong there: nobody
 * internal was told a customer had tried to order and failed (so a lost
 * conversion had zero follow-up), and if the cancel write itself failed the
 * order stayed live in `submitted` with no files and no notification.
 *
 * The order is deliberately left in `submitted` here: it is real, the customer
 * is expecting a result, and being non-terminal means the SLA monitor keeps
 * watching it until someone resolves it.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify-server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();

    // The caller must own the order. Resolved from the session, never the body.
    const { data: client } = await db
      .from("clients")
      .select("id, users(full_name, email)")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: order } = await db
      .from("orders")
      .select("id, order_number, client_id, status, design_name")
      .eq("id", params.id)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!client || order.client_id !== client.id) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }

    const { reason } = await req.json().catch(() => ({ reason: "upload failed" }));
    const clientUser = (client as any).users;
    const orderNumber = order.order_number || order.id;

    // Tell the team. This is the whole point — a failed upload must not be
    // something only the customer knows about.
    const { data: admins } = await db
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);
    if (admins?.length) {
      await notifyUsers(
        admins.map((a: any) => a.id),
        {
          type: "system",
          title: `Artwork missing — ${orderNumber}`,
          body: `${clientUser?.full_name ?? "Client"} placed an order but the artwork upload failed (${reason}). Contact them to collect the files.`,
          action_url: `/admin/orders/${order.id}`,
        }
      );
    }

    // Leave a trace on the order itself for whoever opens it.
    await db.from("audit_logs").insert({
      action: "artwork_upload_failed",
      entity: "orders",
      entity_id: order.id,
      user_id: user.id,
      new_data: { reason, order_number: orderNumber, status_at_failure: order.status },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[artwork-failed]", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
