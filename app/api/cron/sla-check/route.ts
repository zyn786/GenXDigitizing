// @ts-nocheck
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SLA monitor — runs every 30 min via Vercel Cron.
 *
 * Stages, per order:
 *   warning  — within 2h of the deadline
 *   urgent   — within 30min of the deadline
 *   overdue  — deadline has passed; repeats every 6h until the order moves on
 *
 * Three defects this replaces:
 *   1. `NextResponse.json(...).catch(...)` — NextResponse.json is synchronous, so
 *      the route threw `TypeError: ...catch is not a function` on every run and
 *      returned 500 after doing its work. Nothing watched the cron, so it went
 *      unnoticed.
 *   2. The window was `[now, now+2h]`. Once `sla_deadline < now` the order fell
 *      out of the query permanently — a missed deadline went silent forever.
 *   3. Only `assigned` and `in_progress` were checked, so an order nobody had
 *      picked up yet (`submitted`, the default) was never watched at all.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }  from "@/lib/supabase/server";
import { emailSLAWarning }    from "@/lib/email";
import { isAuthorizedCron }   from "@/lib/cron-auth";
import { createCronMonitor }  from "@/lib/cron-monitor";
import { notifyUser, notifyRole } from "@/lib/notify-helpers";

/**
 * Statuses where WE still owe the customer work, so the original deadline
 * applies. `review` is admin QA — work we owe — and was previously unwatched,
 * so a designer could submit files and the order would stall there silently.
 *
 * Excluded: `approved` (waiting on the customer), `revision` (awaiting admin
 * triage, and its deadline is stale — assign-revision resets it), and the
 * terminal states.
 */
const ACTIVE_STATUSES = ["submitted", "assigned", "in_progress", "review"];

const HOUR = 3600000;
const WARNING_MS = 2 * HOUR;
const URGENT_MS  = 30 * 60 * 1000;

/** How long to stay quiet about the same order+stage before repeating. */
const REPEAT_MS = {
  warning: 1 * HOUR,
  urgent:  1 * HOUR,
  overdue: 6 * HOUR,
} as const;

type Stage = keyof typeof REPEAT_MS;

function stageFor(deadline: number, now: number): Stage | null {
  const remaining = deadline - now;
  if (remaining < 0) return "overdue";
  if (remaining <= URGENT_MS) return "urgent";
  if (remaining <= WARNING_MS) return "warning";
  return null;
}

const LABEL: Record<Stage, string> = {
  warning: "SLA Warning",
  urgent:  "SLA Urgent",
  overdue: "SLA OVERDUE",
};

export async function GET(req: NextRequest) {
  const monitor = createCronMonitor("sla-check");

  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = Date.now();

    // One query covering everything still open and already inside the warning
    // window — including anything past its deadline, which used to be excluded.
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, sla_deadline, turnaround, status,
        designers ( users ( id, full_name, email ) ),
        clients   ( company_name )
      `)
      .in("status", ACTIVE_STATUSES)
      .not("sla_deadline", "is", null)
      .lte("sla_deadline", new Date(now + WARNING_MS).toISOString())
      .order("sla_deadline", { ascending: true });

    if (error) throw new Error(error.message);

    const notified: string[] = [];
    const skipped: string[] = [];

    for (const order of orders ?? []) {
      const deadline = new Date(order.sla_deadline).getTime();
      const stage = stageFor(deadline, now);
      if (!stage) continue;

      // Dedup on the exact title rather than an ilike over the order number —
      // order numbers can contain `_`, which is a LIKE wildcard, and the old
      // substring match could suppress or duplicate the wrong notification.
      const title = `${LABEL[stage]} — ${order.order_number}`;
      const since = new Date(now - REPEAT_MS[stage]).toISOString();

      const { count: alreadySent } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("title", title)
        .gte("created_at", since);

      if (alreadySent && alreadySent > 0) {
        skipped.push(`${order.order_number}:${stage}`);
        continue;
      }

      const designer = (order.designers as any)?.users;
      const clientName = (order.clients as any)?.company_name ?? "Client";
      const hoursLeft = Math.round(((deadline - now) / HOUR) * 10) / 10;
      const timing =
        stage === "overdue"
          ? `${Math.abs(hoursLeft)}h overdue`
          : `${hoursLeft}h until deadline`;
      const body = `${timing} · ${clientName} · ${order.turnaround}`;

      // The designer owns the work, but an unassigned order has no designer —
      // which is exactly the case that used to go unwatched. Admins are always
      // told, so someone owns it either way.
      if (designer?.id) {
        await notifyUser(designer.id, {
          type: "sla_warning",
          title,
          body,
          action_url: "/designer/tasks",
        });

        if (designer.email) {
          await emailSLAWarning({
            to: designer.email,
            designerName: designer.full_name ?? "Designer",
            orderNumber: order.order_number,
            clientName,
            hoursLeft,
          });
        }
      }

      await notifyRole("admin", {
        type: "sla_warning",
        title,
        body: designer ? body : `${body} · UNASSIGNED`,
        action_url: "/admin/orders",
      });

      notified.push(`${order.order_number}:${stage}`);
    }

    return monitor.success({
      scanned: orders?.length ?? 0,
      notified,
      skipped: skipped.length,
      timestamp: new Date(now).toISOString(),
    });
  } catch (err) {
    return monitor.error(err);
  }
}
