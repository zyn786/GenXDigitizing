// @ts-nocheck
export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { createClient }    from "@/lib/supabase/server";
import { getAdminStats }   from "@/lib/supabase/admin-queries";
import { getAdminUser }    from "@/lib/supabase/get-user";
import { Topbar }          from "@/components/portals/Topbar";

const AdminDashClient = nextDynamic(() => import("./DashboardClient").then(m => ({ default: m.AdminDashClient })), {
  loading: () => <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-[var(--elevated)] rounded w-48" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><div className="h-24 bg-[var(--elevated)] rounded-xl" /><div className="h-24 bg-[var(--elevated)] rounded-xl" /><div className="h-24 bg-[var(--elevated)] rounded-xl" /><div className="h-24 bg-[var(--elevated)] rounded-xl" /></div></div></div>,
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
