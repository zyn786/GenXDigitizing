// @ts-nocheck
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { AdminOrdersClient } from "./OrdersClient";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

/** States where the order is finished and needs no further attention. */
const TERMINAL_STATUSES = ["delivered", "cancelled", "refunded"];

const ORDER_COLUMNS = `
  id, order_number, design_name, status, turnaround, price, stitch_count,
  output_format, sla_deadline, created_at,
  clients ( id, company_name, tier ),
  designers ( id, users ( full_name ) ),
  service_tiers ( label, category, size_desc ),
  invoices ( id, invoice_number, status, amount, payoneer_checkout_url, pdf_url )
`;

export default async function AdminOrdersPage() {
  const supabase = createClient();
  const user = await getAdminUser();

  const [{ data: recentOrders }, { data: openOrders }, { data: designers }, { data: editRows }] =
    await Promise.all([
      // Recent history, for browsing.
      supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(200),

      // Every order that still needs attention — unbounded by age.
      //
      // The single `.limit(200)` ordered by `created_at` was the whole page, so an
      // order that fell outside the 200 most recently *created* was invisible on
      // every admin list surface regardless of status. An order sitting overdue in
      // `assigned`, created 300 orders ago, simply could not be seen — and because
      // the header counters were computed over that same truncated set, the portal
      // reported confident but wrong totals.
      supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .not("status", "in", `(${TERMINAL_STATUSES.join(",")})`)
        .order("created_at", { ascending: false }),

      supabase
        .from("designers")
        .select("id, users(id, full_name)")
        .order("avg_rating", { ascending: false }),

      supabase.from("order_edit_log").select("order_id").eq("reviewed_by_admin", false),
    ]);

  // Merge, de-duplicated by id, newest first. Open orders always survive the
  // merge; the recent-orders query only adds closed history.
  const byId = new Map<string, any>();
  for (const o of [...(openOrders ?? []), ...(recentOrders ?? [])]) byId.set(o.id, o);
  const orders = [...byId.values()].sort((a, b) =>
    a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0
  );

  // Build unreviewed edits map: order_id → count
  const unreviewedEdits: Record<string, number> = {};
  for (const row of editRows ?? []) {
    unreviewedEdits[row.order_id] = (unreviewedEdits[row.order_id] ?? 0) + 1;
  }

  // Counted over every open order, not a truncated page.
  const pending = (openOrders ?? []).filter((o) => o.status === "submitted").length;
  const inFlight = (openOrders ?? []).filter((o) =>
    ["assigned", "in_progress", "review", "approved"].includes(o.status)
  ).length;
  const openCount = (openOrders ?? []).length;

  const historyTruncated = (recentOrders?.length ?? 0) >= 200 && orders.length > openCount;

  return (
    <>
      <Topbar
        title="Order Management"
        subtitle={
          `${pending} pending · ${inFlight} in production · ${openCount} open` +
          (historyTruncated ? ` · showing recent history` : "")
        }
        user={user}
      />
      <AdminOrdersClient
        orders={orders}
        designers={designers ?? []}
        unreviewedEdits={unreviewedEdits}
      />
      <RealtimeRefresher
        configs={[
          { table: "orders", events: ["INSERT", "UPDATE"] },
          { table: "invoices", events: ["UPDATE"] },
        ]}
      />
    </>
  );
}
