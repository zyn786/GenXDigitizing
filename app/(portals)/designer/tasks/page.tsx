// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }                           from "@/lib/supabase/get-user";
import { getDesignerActiveTasks, getDesignerCompletedOrders, getDesignerProfile } from "@/lib/supabase/client-queries";
import { Topbar }                                 from "@/components/portals/Topbar";
import { DesignerTasksClient }                    from "./DesignerTasksClient";
import { RealtimeRefresher }                      from "@/components/RealtimeRefresher";
import { redirect }                               from "next/navigation";

export default async function DesignerTasksPage() {
  const user = await getAdminUser();
  if (!user.designer_id) { redirect("/designer?error=no_profile"); }

  const [tasks, profile, completed] = await Promise.all([
    getDesignerActiveTasks(user.designer_id),
    getDesignerProfile(user.id).catch(() => null),
    getDesignerCompletedOrders(user.designer_id).catch(() => []),
  ]);

  const totalEarnings = (completed || []).reduce((sum: number, o: any) => sum + Number(o.price || 0), 0);
  const avgRating = profile?.avg_rating ?? 0;

  const stats = {
    active: tasks.length,
    urgent: tasks.filter((t: any) => t.turnaround === "urgent").length,
    completed: profile?.completed_orders ?? (completed || []).length,
    totalOrders: profile?.total_orders ?? 0,
    earnings: totalEarnings,
    avgRating,
    revisionRate: profile?.revision_rate ?? 0,
  };

  return (
    <>
      <Topbar title="My Tasks" subtitle={`${tasks.length} active · ${stats.urgent} urgent`} user={user} />
      <DesignerTasksClient
        tasks={tasks}
        completedOrders={completed || []}
        userId={user.id}
        designerId={user.designer_id}
        designerName={user.full_name ?? "Designer"}
        designerAvatar={user.avatar_url}
        stats={stats}
      />
      <RealtimeRefresher configs={[
        { table: "orders", filter: `designer_id=eq.${user.designer_id}`, events: ["INSERT", "UPDATE"] },
      ]} />
    </>
  );
}
