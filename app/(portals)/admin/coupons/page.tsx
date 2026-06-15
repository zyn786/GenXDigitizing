// @ts-nocheck
import { getAdminUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/portals/Topbar";
import { CouponsAdmin } from "./CouponsAdmin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const user = await getAdminUser();
  if (!user || user.role !== "admin") redirect("/login");

  const supabase = createClient();

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: redemptions } = await supabase
    .from("coupon_redemptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // Clients who have orders (for sending coupons)
  const { data: clientOrders } = await supabase
    .from("orders")
    .select("id, client_id, design_name, clients:client_id(email, company_name, user_id)")
    .order("created_at", { ascending: false })
    .limit(200);

  // Deduplicate by client_id
  const clients: Array<{ id: string; userId: string; email: string | null; company: string | null; lastOrder: string | null }> = [];
  const seen = new Set();
  for (const o of clientOrders || []) {
    if (!seen.has(o.client_id)) {
      seen.add(o.client_id);
      clients.push({
        id: o.client_id,
        userId: o.clients?.user_id || "",
        email: o.clients?.email,
        company: o.clients?.company_name,
        lastOrder: o.design_name,
      });
    }
  }

  return (
    <>
      <Topbar title="Coupons" subtitle="Create, manage & send coupon codes" user={user} />
      <CouponsAdmin coupons={coupons || []} redemptions={redemptions || []} clients={clients} />
    </>
  );
}
