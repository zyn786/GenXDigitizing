// @ts-nocheck
import { createClient }   from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar }          from "@/components/portals/Topbar";
import { AdminPricingUI }  from "./PricingUI";

export const dynamic = "force-dynamic";


export default async function AdminPricingPage() {
  const supabase = createClient();
  const user = await getAdminUser();

  const { data: tiers } = await supabase
    .from("service_tiers")
    .select("*")
    .order("sort_order");

  return (
    <>
      <Topbar title="Pricing Settings" subtitle="Changes apply instantly across all portals" user={user} />
      <AdminPricingUI tiers={tiers ?? []} />
    </>
  );
}
