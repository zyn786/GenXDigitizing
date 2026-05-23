// @ts-nocheck
import { createClient }      from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar }             from "@/components/portals/Topbar";
import { AdminClientsClient } from "./ClientsClient";

export const dynamic = "force-dynamic";


export default async function AdminClientsPage() {
  const supabase = createClient();
  const user = await getAdminUser();

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id, company_name, country, phone, tier, ltv, credit_balance, joined_at,
      users ( id, email, full_name, avatar_url, is_active, last_sign_in )
    `)
    .order("ltv", { ascending: false });

  // Order counts per client
  const { data: orderCounts } = await supabase
    .from("orders")
    .select("client_id");

  const countMap: Record<string, number> = {};
  for (const o of orderCounts ?? []) {
    countMap[o.client_id] = (countMap[o.client_id] ?? 0) + 1;
  }

  const enriched = ((clients ?? []) as any[]).map(c => ({
    ...c,
    order_count: countMap[c.id] ?? 0,
  }));

  return (
    <>
      <Topbar title="Client Management" subtitle={`${enriched.length} registered clients`} user={user} />
      <AdminClientsClient clients={enriched} />
    </>
  );
}
