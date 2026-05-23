// @ts-nocheck
import { createClient }        from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar }               from "@/components/portals/Topbar";
import { AdminDesignersClient } from "./DesignersClient";

export const dynamic = "force-dynamic";


export default async function AdminDesignersPage() {
  const supabase = createClient();
  const user = await getAdminUser();

  const { data: designers } = await supabase
    .from("designers")
    .select(`
      id, avg_turnaround_h, avg_rating, revision_rate,
      total_orders, completed_orders, specialties,
      users ( id, email, full_name, avatar_url, is_active, created_at )
    `)
    .order("avg_rating", { ascending: false });

  // Active assignments per designer
  const { data: activeOrders } = await supabase
    .from("orders")
    .select("designer_id")
    .in("status", ["assigned","in_progress","review","approved"]);

  const activeMap: Record<string, number> = {};
  for (const o of activeOrders ?? []) {
    if (o.designer_id) { activeMap[o.designer_id] = (activeMap[o.designer_id] ?? 0) + 1; }
  }

  const enriched = ((designers ?? []) as any[]).map(d => ({
    ...d,
    active_orders: activeMap[d.id] ?? 0,
  }));

  return (
    <>
      <Topbar title="Designer Team" subtitle={`${enriched.length} designers`} user={user} />
      <AdminDesignersClient designers={enriched} />
    </>
  );
}
