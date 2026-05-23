// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }     from "@/lib/supabase/get-user";
import { getClientStats, getClientOrders, getServiceTiers } from "@/lib/supabase/client-queries";
import { Topbar }            from "@/components/portals/Topbar";
import { ClientDashboard }   from "./ClientDashboard";

export default async function ClientDashPage() {
  const user    = await getAdminUser();
  const clientId = user.client_id;

  if (!clientId) {
    return (
      <>
        <Topbar title="Dashboard" user={user} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:12, opacity:.6 }}>
          <p style={{ fontSize:32 }}>⚠️</p>
          <p style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:16 }}>Client profile not found</p>
          <p style={{ fontSize:13, color:"var(--txt3)" }}>Run the fix SQL in Supabase to create your client record.</p>
        </div>
      </>
    );
  }

  const [stats, orders, tiers] = await Promise.all([
    getClientStats(clientId),
    getClientOrders(clientId),
    getServiceTiers(),
  ]);

  const recentOrders = orders.slice(0, 5);
  const pendingReview = orders.filter((o: any) =>
    o.status === "delivered" && !o.reviews?.length
  ).length;

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Welcome back, ${user.full_name || "there"}`} user={user} />
      <ClientDashboard
        user={user}
        stats={stats}
        recentOrders={recentOrders}
        tiers={tiers}
        pendingReview={pendingReview}
      />
    </>
  );
}
