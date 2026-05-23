// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }   from "@/lib/supabase/get-user";
import { getClientOrders } from "@/lib/supabase/client-queries";
import { Topbar }         from "@/components/portals/Topbar";
import { MyOrdersClient } from "./MyOrdersClient";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import { redirect }       from "next/navigation";

export default async function MyOrdersPage() {
  const user = await getAdminUser();
  if (!user.client_id) { redirect("/client"); }

  const orders = await getClientOrders(user.client_id);
  const orderIds = orders.map(o => o.id);

  return (
    <>
      <Topbar title="My Orders" subtitle={`${orders.length} orders total · Reviews earn free priority`} user={user} />
      <MyOrdersClient orders={orders} userId={user.id} />
      {orderIds.length > 0 && (
        <RealtimeRefresher configs={[
          { table: "orders", filter: `client_id=eq.${user.client_id}`, events: ["INSERT", "UPDATE"] },
          { table: "invoices", filter: `order_id=in.(${orderIds.join(",")})`, events: ["UPDATE"] },
        ]} />
      )}
    </>
  );
}
