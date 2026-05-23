// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }                from "@/lib/supabase/get-user";
import { getDesignerCompletedOrders, getDesignerProfile } from "@/lib/supabase/client-queries";
import { Topbar }                      from "@/components/portals/Topbar";
import { RealtimeRefresher }            from "@/components/RealtimeRefresher";
import { DesignerCompletedClient }      from "./DesignerCompletedClient";
import { redirect }                    from "next/navigation";

export default async function DesignerCompletedPage() {
  const user = await getAdminUser();
  if (!user.designer_id) { redirect("/designer"); }

  const [profile, orders] = await Promise.all([
    getDesignerProfile(user.id),
    getDesignerCompletedOrders(user.designer_id),
  ]);

  return (
    <>
      <Topbar title="Completed Jobs" subtitle={`${orders.length} jobs completed`} user={user} />
      <RealtimeRefresher configs={[
        { table: "orders", filter: `designer_id=eq.${user.designer_id}`, events: ["INSERT", "UPDATE"] },
      ]} />
      <DesignerCompletedClient
        orders={orders}
        profile={profile}
        designerName={user.full_name ?? "Designer"}
        designerAvatar={user.avatar_url}
      />
    </>
  );
}
