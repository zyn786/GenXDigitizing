// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SLA Warning Cron — runs every 30 min via Vercel Cron.
 * Finds orders within 2h of deadline and notifies designers + admin.
 * Secure with CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import { emailSLAWarning }           from "@/lib/email";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now      = new Date();
  const twoHours = new Date(now.getTime() + 2 * 3600000);

  const { data: atRisk, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, sla_deadline, turnaround, status,
      designers ( users ( id, full_name, email ) ),
      clients   ( company_name )
    `)
    .in("status", ["assigned","in_progress"])
    .not("sla_deadline", "is", null)
    .lte("sla_deadline", twoHours.toISOString())
    .gte("sla_deadline", now.toISOString());

  if (error) {
    console.error("[sla-check] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const warned: string[] = [];

  const oneHourAgo = new Date(now.getTime() - 3600000);

  for (const order of (atRisk ?? [])) {
    // Dedup: skip if already warned in last hour
    const { count: recentWarnings } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("type", "sla_warning")
      .gte("created_at", oneHourAgo.toISOString())
      .or(`title.ilike.%${order.order_number}%`);

    if (recentWarnings && recentWarnings > 0) continue;

    const deadline   = new Date(order.sla_deadline);
    const hoursLeft  = Math.round((deadline.getTime() - now.getTime()) / 360000) / 10;
    const designer   = (order.designers as any)?.users;
    const clientName = (order.clients as any)?.company_name ?? "Client";

    // Notify designer with web push
    if (designer?.id) {
      const { notifyUser } = await import("@/lib/notify-helpers");
      notifyUser(designer.id, {
        type:       "sla_warning",
        title:      `SLA Warning — ${order.order_number}`,
        body:       `${hoursLeft}h until deadline · ${clientName}`,
        action_url: "/designer/tasks",
      }).catch(console.error);
    }

    // Notify admins with web push
    const { notifyRole } = await import("@/lib/notify-helpers");
    notifyRole("admin", {
      type:       "sla_warning",
      title:      `SLA at risk — ${order.order_number}`,
      body:       `${hoursLeft}h left · ${clientName} · ${order.turnaround}`,
      action_url: "/admin/orders",
    }).catch(console.error);

    // Email designer
    if (designer?.email) {
      emailSLAWarning({
        to:           designer.email,
        designerName: designer.full_name ?? "Designer",
        orderNumber:  order.order_number,
        clientName,
        hoursLeft,
      }).catch(console.error);
    }

    warned.push(order.order_number);
  }

  return NextResponse.json({
    checked:   atRisk?.length ?? 0,
    warned,
    timestamp: now.toISOString(),
  }).catch(console.error);
}
