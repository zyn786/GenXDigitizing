// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }        from "@/lib/supabase/get-user";
import { getClientOrderById }  from "@/lib/supabase/client-queries";
import { createAdminClient }   from "@/lib/supabase/server";
import { Topbar }              from "@/components/portals/Topbar";
import { OrderDetail }         from "./OrderDetail";
import { RealtimeRefresher }   from "@/components/RealtimeRefresher";
import { redirect, notFound }  from "next/navigation";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getAdminUser();
  if (!user.client_id) { redirect("/client"); }

  const order = await getClientOrderById(params.id, user.client_id);
  if (!order) { notFound(); }

  // Fetch messages for this order involving this user
  const admin = createAdminClient();
  const { data: orderMessages } = await admin
    .from("messages")
    .select(`
      id, body, is_read, created_at,
      sender:from_user ( id, full_name, role ),
      recipient:to_user ( id, full_name, role )
    `)
    .eq("order_id", params.id)
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order("created_at", { ascending: true });

  return (
    <>
      <Topbar
        title="Order Detail"
        subtitle={`${order.order_number} · ${order.service_tiers?.label ?? ""}`}
        user={user}
      />
      <OrderDetail order={order} userId={user.id} clientId={user.client_id} orderMessages={orderMessages ?? []} />
      <RealtimeRefresher configs={[
        { table: "orders", filter: `id=eq.${params.id}`, events: ["UPDATE"] },
        { table: "order_files", filter: `order_id=eq.${params.id}`, events: ["INSERT", "DELETE"] },
        { table: "invoices", filter: `order_id=eq.${params.id}`, events: ["UPDATE"] },
      ]} />
    </>
  );
}
