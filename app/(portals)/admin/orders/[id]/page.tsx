// @ts-nocheck
export const dynamic = "force-dynamic";

import { createClient }       from "@/lib/supabase/server";
import { getAdminUser }       from "@/lib/supabase/get-user";
import { getAdminOrderById }  from "@/lib/supabase/admin-queries";
import { Topbar }             from "@/components/portals/Topbar";
import { AdminOrderDetail }   from "./AdminOrderDetail";
import { RealtimeRefresher }  from "@/components/RealtimeRefresher";
import { notFound }           from "next/navigation";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const user     = await getAdminUser();

  const [{ data: order }, { data: designers }, { data: editLogs }] = await Promise.all([
    getAdminOrderById(params.id),
    supabase
      .from("designers")
      .select("id, users(id, full_name)")
      .order("avg_rating", { ascending: false }),
    supabase
      .from("order_edit_log")
      .select(`
        id, order_id, field_name, old_value, new_value,
        changed_by, reviewed_by_admin, reviewed_by, reviewed_at, created_at,
        changer:changed_by ( full_name ),
        reviewer:reviewed_by ( full_name )
      `)
      .eq("order_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!order) { notFound(); }

  return (
    <>
      <Topbar
        title="Order Detail"
        subtitle={`${order.order_number} · ${order.service_tiers?.label ?? ""} · ${order.clients?.company_name ?? "Unknown client"}`}
        user={user}
      />
      <AdminOrderDetail
        order={order}
        designers={designers ?? []}
        editLogs={editLogs ?? []}
      />
      <RealtimeRefresher configs={[
        { table: "orders", filter: `id=eq.${params.id}`, events: ["UPDATE"] },
        { table: "order_files", filter: `order_id=eq.${params.id}`, events: ["INSERT", "DELETE"] },
        { table: "invoices", filter: `order_id=eq.${params.id}`, events: ["UPDATE"] },
      ]} />
    </>
  );
}
