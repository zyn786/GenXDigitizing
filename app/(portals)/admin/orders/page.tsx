// @ts-nocheck
export const dynamic = "force-dynamic";

import { createClient }    from "@/lib/supabase/server";
import { getAdminUser }    from "@/lib/supabase/get-user";
import { Topbar }          from "@/components/portals/Topbar";
import { AdminOrdersClient } from "./OrdersClient";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function AdminOrdersPage() {
  const supabase = createClient();
  const user     = await getAdminUser();

  const [{ data: orders }, { data: designers }, { data: editRows }] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        id, order_number, design_name, status, turnaround, price, stitch_count,
        output_format, sla_deadline, created_at,
        clients ( id, company_name, tier ),
        designers ( id, users ( full_name ) ),
        service_tiers ( label, category, size_desc ),
        invoices ( id, invoice_number, status, amount, payoneer_checkout_url, pdf_url )
      `)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("designers")
      .select("id, users(id, full_name)")
      .order("avg_rating", { ascending: false }),
    supabase
      .from("order_edit_log")
      .select("order_id")
      .eq("reviewed_by_admin", false),
  ]);

  // Build unreviewed edits map: order_id → count
  const unreviewedEdits: Record<string, number> = {};
  for (const row of (editRows ?? [])) {
    unreviewedEdits[row.order_id] = (unreviewedEdits[row.order_id] ?? 0) + 1;
  }

  const pending  = (orders ?? []).filter(o => o.status === "submitted").length;
  const inFlight = (orders ?? []).filter(o => ["assigned","in_progress","review","approved"].includes(o.status)).length;

  return (
    <>
      <Topbar
        title="Order Management"
        subtitle={`${pending} pending · ${inFlight} in production · ${orders?.length ?? 0} total`}
        user={user}
      />
      <AdminOrdersClient orders={orders ?? []} designers={designers ?? []} unreviewedEdits={unreviewedEdits} />
      <RealtimeRefresher configs={[
        { table: "orders", events: ["INSERT", "UPDATE"] },
        { table: "invoices", events: ["UPDATE"] },
      ]} />
    </>
  );
}
