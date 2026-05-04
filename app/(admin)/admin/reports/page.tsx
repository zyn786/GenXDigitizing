import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Reports") };

async function getReportData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [ordersByStatus, monthRevenue, lastMonthRevenue, allTimeRevenue, designerPerformance, recentActivity, topClients] = await Promise.all([
    prisma.workflowOrder.groupBy({ by: ["status"], _count: { id: true }, where: { status: { notIn: ["DRAFT"] } } }),
    prisma.invoice.aggregate({ _sum: { paidAmount: true, totalAmount: true }, where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } } }),
    prisma.invoice.aggregate({ _sum: { paidAmount: true }, where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth }, status: { not: "CANCELLED" } } }),
    prisma.invoice.aggregate({ _sum: { paidAmount: true, totalAmount: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.user.findMany({ where: { role: "DESIGNER", isActive: true }, include: { assignedOrders: { select: { id: true, status: true }, where: { status: { notIn: ["DRAFT"] } } } }, orderBy: { name: "asc" } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { actorUser: { select: { name: true } } } }),
    prisma.workflowOrder.groupBy({ by: ["clientUserId"], _count: { id: true }, where: { status: { notIn: ["DRAFT", "CANCELLED"] } }, orderBy: { _count: { id: "desc" } }, take: 5 }),
  ]);

  const clientIds = topClients.map((c) => c.clientUserId);
  const clientNames = await prisma.user.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true, email: true } });
  const clientNameMap = Object.fromEntries(clientNames.map((u) => [u.id, u.name ?? u.email ?? "Unknown"]));

  return {
    ordersByStatus, monthRevenue: Number(monthRevenue._sum.paidAmount ?? 0), monthBilled: Number(monthRevenue._sum.totalAmount ?? 0),
    lastMonthRevenue: Number(lastMonthRevenue._sum.paidAmount ?? 0), allTimePaid: Number(allTimeRevenue._sum.paidAmount ?? 0),
    allTimeBilled: Number(allTimeRevenue._sum.totalAmount ?? 0), designerPerformance, recentActivity,
    topClients: topClients.map((c) => ({ name: clientNameMap[c.clientUserId] ?? "Unknown", count: c._count.id })),
  };
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted", IN_PROGRESS: "In Progress", PROOF_READY: "Proof Ready",
  REVISION_REQUESTED: "Revision", APPROVED: "Approved", DELIVERED: "Delivered", CLOSED: "Closed", CANCELLED: "Cancelled",
};

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") redirect("/admin/dashboard");

  const data = await getReportData();
  const monthGrowth = data.lastMonthRevenue > 0 ? Math.round(((data.monthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100) : null;

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Reports</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Revenue, order volume, designer performance, and platform activity.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "This month (collected)", value: `$${data.monthRevenue.toLocaleString()}`, sub: monthGrowth !== null ? `${monthGrowth >= 0 ? "+" : ""}${monthGrowth}% vs last month` : "First month" },
          { label: "This month (billed)", value: `$${data.monthBilled.toLocaleString()}`, sub: "invoiced this month" },
          { label: "All-time collected", value: `$${data.allTimePaid.toLocaleString()}`, sub: `$${data.allTimeBilled.toLocaleString()} billed total` },
        ].map((s) => (
          <div key={s.label} className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Orders by status</h2>
          <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
            <div className="divide-y divide-border/60">
              {data.ordersByStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground">{STATUS_LABELS[row.status] ?? row.status}</span>
                  <span className="font-semibold">{row._count.id}</span>
                </div>
              ))}
              {data.ordersByStatus.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted-foreground">No orders yet.</div>}
            </div>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">Top clients by orders</h2>
          <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
            <div className="divide-y divide-border/60">
              {data.topClients.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="font-semibold">{c.count} orders</span>
                </div>
              ))}
              {data.topClients.length === 0 && <div className="px-5 py-6 text-center text-sm text-muted-foreground">No data yet.</div>}
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Designer performance</h2>
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:grid">
            <div>Designer</div><div>Total</div><div>Active</div><div>Delivered</div><div>Completion</div>
          </div>
          <div className="divide-y divide-border/60">
            {data.designerPerformance.map((d) => {
              const total = d.assignedOrders.length;
              const active = d.assignedOrders.filter((o) => ["SUBMITTED", "IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED"].includes(o.status)).length;
              const delivered = d.assignedOrders.filter((o) => ["DELIVERED", "CLOSED"].includes(o.status)).length;
              const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
              return (
                <div key={d.id} className="grid grid-cols-1 gap-1 px-5 py-4 text-sm sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center">
                  <p className="font-medium">{d.name ?? d.email ?? d.id}</p>
                  <p className="text-muted-foreground">{total}</p>
                  <p className="text-amber-600 dark:text-amber-400">{active}</p>
                  <p className="text-emerald-600 dark:text-emerald-400">{delivered}</p>
                  <p className={`text-sm font-semibold ${rate >= 80 ? "text-emerald-600 dark:text-emerald-400" : rate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>{total > 0 ? `${rate}%` : "—"}</p>
                </div>
              );
            })}
            {data.designerPerformance.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No designers yet.</div>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="divide-y divide-border/60">
            {data.recentActivity.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <p className="w-32 shrink-0 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</p>
                <div className="flex-1">
                  <span className="font-mono text-xs text-primary/80">{log.action}</span>
                  {log.actorUser?.name && <span className="ml-2 text-xs text-muted-foreground">by {log.actorUser.name}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{log.entityType}</p>
              </div>
            ))}
            {data.recentActivity.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
