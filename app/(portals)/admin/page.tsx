// @ts-nocheck
export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { createClient }    from "@/lib/supabase/server";
import { getAdminStats }   from "@/lib/supabase/admin-queries";
import { getAdminUser }    from "@/lib/supabase/get-user";
import { Topbar }          from "@/components/portals/Topbar";
import {
  SkeletonPageHeader,
  SkeletonStatRow,
  SkeletonContentBlock,
} from "@/components/ui/Skeleton";

const AdminDashClient = nextDynamic(() => import("./DashboardClient").then(m => ({ default: m.AdminDashClient })), {
  loading: () => (
    <div className="p-4 sm:p-6 space-y-4">
      <SkeletonPageHeader />
      <SkeletonStatRow count={4} />
      <SkeletonContentBlock height={200} />
    </div>
  ),
});

export default async function AdminDashboard() {
  const [user, stats] = await Promise.all([getAdminUser(), getAdminStats()]);

  const supabase = createClient();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, price, turnaround, stitch_count, output_format, created_at,
      clients ( company_name, tier ),
      designers ( users ( full_name ) ),
      service_tiers ( label, category )
    `)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: allOrders } = await supabase
    .from("orders")
    .select("service_tier_id, service_tiers(label,category)")
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

  const svcMap: Record<string, { label: string; count: number }> = {};
  for (const o of (allOrders ?? []) as any[]) {
    const t = o.service_tiers;
    if (!t) continue;
    svcMap[t.label] = svcMap[t.label] ?? { label: t.label, count: 0 };
    svcMap[t.label].count++;
  }
  const total = Object.values(svcMap).reduce((s, v) => s + v.count, 0) || 1;
  const breakdown = Object.values(svcMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(v => ({ ...v, pct: Math.round((v.count / total) * 100) }));

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        })}
        user={user}
      />
      <AdminDashClient
        stats={stats}
        recentOrders={recentOrders ?? []}
        breakdown={breakdown}
      />
    </>
  );
}
