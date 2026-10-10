// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { AdminReportsUI } from "./ReportsUI";
import { buildFunnelReport } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const supabase = createClient();
  const user = await getAdminUser();
  const year = new Date().getFullYear();

  const [
    { data: invoices },
    { data: orders },
    { data: designers },
    { data: topClients },
    { data: tiers },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("amount, paid_at")
      .eq("status", "paid")
      .gte("paid_at", `${year}-01-01`),
    supabase.from("orders").select("service_tier_id, price, status, service_tiers(label,category)"),
    supabase
      .from("designers")
      .select(
        "id, avg_rating, avg_turnaround_h, completed_orders, revision_rate, total_orders, users(full_name)"
      )
      .order("completed_orders", { ascending: false })
      .limit(8),
    supabase
      .from("clients")
      .select("id, company_name, ltv, tier, users(email)")
      .order("ltv", { ascending: false })
      .limit(8),
    supabase.from("service_tiers").select("id, label, category").order("sort_order"),
  ]);

  // Monthly revenue
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthly = MONTHS.map((month, i) => {
    const slice = (invoices ?? []).filter(
      (inv) => inv.paid_at && new Date(inv.paid_at).getMonth() === i
    );
    return {
      month,
      revenue: slice.reduce((s, inv) => s + Number(inv.amount), 0),
      orders: slice.length,
    };
  });

  // Service breakdown
  const svcMap = new Map<string, { label: string; count: number; revenue: number }>();
  for (const o of orders ?? []) {
    const t = (o as any).service_tiers;
    if (!t) {
      continue;
    }
    const e = svcMap.get(o.service_tier_id) ?? { label: t.label, count: 0, revenue: 0 };
    e.count++;
    e.revenue += Number(o.price);
    svcMap.set(o.service_tier_id, e);
  }
  const total = Array.from(svcMap.values()).reduce((s, v) => s + v.count, 0) || 1;
  const breakdown = Array.from(svcMap.values())
    .sort((a, b) => b.count - a.count)
    .map((v) => ({ ...v, pct: Math.round((v.count / total) * 100) }));

  const totalRevenue = (invoices ?? []).reduce((s, inv) => s + Number(inv.amount), 0);
  const totalOrders = orders?.length ?? 0;
  const avgValue = totalOrders ? totalRevenue / totalOrders : 0;

  // Sales funnel, from the lead event log. Computed rather than estimated —
  // this is the question the event log exists to answer, and until it existed
  // "how long does a lead wait?" was not answerable at all. Degrades to an
  // empty report if migration 052 has not been applied.
  let funnel = null;
  try {
    const { data: events, error: eventsErr } = await supabase
      .from("lead_events")
      .select("lead_id, type, from_stage, to_stage, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (eventsErr) throw new Error(eventsErr.message);
    funnel = buildFunnelReport(events ?? []);
  } catch (err) {
    console.error("[reports] funnel unavailable — is migration 052 applied?", err);
  }

  return (
    <>
      <Topbar title="Reports & Analytics" subtitle={`Year ${year}`} user={user} />
      <AdminReportsUI
        monthly={monthly}
        breakdown={breakdown}
        funnel={funnel}
        designers={designers ?? []}
        topClients={topClients ?? []}
        totalRevenue={totalRevenue}
        totalOrders={totalOrders}
        avgValue={avgValue}
      />
    </>
  );
}
