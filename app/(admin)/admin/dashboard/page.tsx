import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ClipboardList, FileQuestion, FileText, Inbox, TrendingUp, Users, CheckCircle2, ArrowRight } from "lucide-react";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/workflow/order-status-badge";
import { mapDbStatus } from "@/lib/workflow/repository";

export const metadata: Metadata = { title: buildTitle("Dashboard") };

async function getDashboardData() {
  const [
    activeOrders,
    deliveredOrders,
    totalOrders,
    pendingQuotes,
    openTickets,
    staffCount,
    recentOrders,
    invoiceTotals,
  ] = await Promise.all([
    prisma.workflowOrder.count({ where: { status: { in: ["SUBMITTED", "IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED"] } } }),
    prisma.workflowOrder.count({ where: { status: "DELIVERED" } }),
    prisma.workflowOrder.count({ where: { status: { notIn: ["DRAFT"] } } }),
    prisma.workflowOrder.count({ where: { status: "DRAFT" } }),
    prisma.chatThread.count({ where: { isOpen: true, type: "SUPPORT" } }),
    prisma.user.count({ where: { role: { not: "CLIENT" }, isActive: true } }),
    prisma.workflowOrder.findMany({
      where: { status: { notIn: ["DRAFT"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        clientUser: { select: { name: true, clientProfile: { select: { companyName: true } } } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.invoice.aggregate({ _sum: { totalAmount: true, paidAmount: true }, where: { status: { not: "CANCELLED" } } }),
  ]);

  return {
    activeOrders, deliveredOrders, totalOrders, pendingQuotes, openTickets, staffCount, recentOrders,
    totalRevenue: Number(invoiceTotals._sum.totalAmount ?? 0),
    paidRevenue: Number(invoiceTotals._sum.paidAmount ?? 0),
  };
}

export default async function AdminDashboardPage() {
  const [session, data] = await Promise.all([auth(), getDashboardData()]);
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section>
        <p className="section-eyebrow">Operations</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
          {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Live overview of orders, revenue, support, and staff across the platform.
        </p>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        <StatCard href="/admin/orders" icon={<ClipboardList className="h-5 w-5" />} label="Active Orders" value={String(data.activeOrders)} sub={`${data.totalOrders} total`} />
        <StatCard href="/admin/orders" icon={<CheckCircle2 className="h-5 w-5" />} label="Delivered" value={String(data.deliveredOrders)} sub="Completed orders" />
        <StatCard href="/admin/quotes" icon={<FileQuestion className="h-5 w-5" />} label="Quotes Pending" value={String(data.pendingQuotes)} sub="Awaiting conversion" />
        <StatCard href="/admin/support" icon={<Inbox className="h-5 w-5" />} label="Open Tickets" value={String(data.openTickets)} sub="Support conversations" />
        <StatCard href="/admin/invoices" icon={<TrendingUp className="h-5 w-5" />} label="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} sub={`$${data.paidRevenue.toLocaleString()} collected`} />
        <StatCard href="/admin/staff" icon={<Users className="h-5 w-5" />} label="Active Staff" value={String(data.staffCount)} sub="Staff members" />
      </div>

      {/* Queue cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Order Queue</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{data.activeOrders} active · {data.pendingQuotes} drafts</p>
              </div>
              <Button asChild variant="default" shape="pill" size="sm">
                <Link href="/admin/orders">View queue <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Recent Activity</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{data.recentOrders.length} recent orders</p>
              </div>
              <Button asChild variant="outline" shape="pill" size="sm">
                <Link href="/admin/activity">View log</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h2 className="text-base font-semibold">Recent Orders</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">View all</Link>
          </Button>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No orders yet.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}` as Route}
                className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-muted/30 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center"
              >
                <div>
                  <p className="font-medium">{order.title}</p>
                  <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                </div>
                <p className="text-muted-foreground">{order.clientUser.name ?? "—"}</p>
                <p className="text-muted-foreground">
                  {order.assignedTo?.name ?? <span className="italic opacity-40">Unassigned</span>}
                </p>
                <OrderStatusBadge status={mapDbStatus(order.status)} />
                <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/staff/new", label: "Add staff member", icon: <Users className="h-4 w-4" /> },
          { href: "/admin/invoices", label: "View invoices", icon: <FileText className="h-4 w-4" /> },
          { href: "/admin/support", label: "Support inbox", icon: <Inbox className="h-4 w-4" /> },
        ].map(({ href, label, icon }) => (
          <Button key={href} asChild variant="outline" shape="pill" className="justify-start gap-3 h-auto py-3 px-4">
            <Link href={href as Route}>
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ href, icon, label, value, sub }: { href: string; icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Link href={href as Route} className="group block">
      <Card className="relative h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        {/* Subtle top gradient line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CardContent className="flex items-start justify-between gap-2 p-3 md:gap-3 md:p-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground md:text-xs md:tracking-[0.18em]">{label}</p>
            <p className="mt-1.5 truncate text-xl font-bold tracking-tight gradient-text md:mt-2 md:text-3xl">{value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:mt-1 md:text-xs">{sub}</p>
          </div>
          <div className="shrink-0 rounded-xl bg-primary/10 p-2 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/20 md:rounded-2xl md:p-3">
            {icon}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
