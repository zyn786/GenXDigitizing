import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import {
  ClipboardList,
  FileQuestion,
  FileText,
  Inbox,
  Users,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { auth } from "@/auth";
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
    prisma.workflowOrder.count({
      where: { status: { in: ["SUBMITTED", "IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED"] } },
    }),
    prisma.workflowOrder.count({ where: { status: "DELIVERED" } }),
    prisma.workflowOrder.count({ where: { status: { notIn: ["DRAFT"] } } }),
    prisma.workflowOrder.count({ where: { status: "DRAFT" } }),
    prisma.chatThread.count({ where: { isOpen: true, type: "SUPPORT" } }),
    prisma.user.count({ where: { role: { not: "CLIENT" }, isActive: true } }),
    prisma.workflowOrder.findMany({
      where: { status: { notIn: ["DRAFT"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        clientUser: { select: { name: true, clientProfile: { select: { companyName: true } } } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.invoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  return {
    activeOrders,
    deliveredOrders,
    totalOrders,
    pendingQuotes,
    openTickets,
    staffCount,
    recentOrders,
    totalRevenue: Number(invoiceTotals._sum.totalAmount ?? 0),
    paidRevenue: Number(invoiceTotals._sum.paidAmount ?? 0),
  };
}

export default async function AdminDashboardPage() {
  const [session, data] = await Promise.all([auth(), getDashboardData()]);

  const stats = [
    {
      label: "Active Orders",
      value: data.activeOrders,
      sub: `${data.totalOrders} total`,
      icon: ClipboardList,
      href: "/admin/orders",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Delivered",
      value: data.deliveredOrders,
      sub: "completed orders",
      icon: CheckCircle2,
      href: "/admin/orders",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Quotes Pending",
      value: data.pendingQuotes,
      sub: "awaiting conversion",
      icon: FileQuestion,
      href: "/admin/quotes",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Open Tickets",
      value: data.openTickets,
      sub: "support conversations",
      icon: Inbox,
      href: "/admin/support",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString()}`,
      sub: `$${data.paidRevenue.toLocaleString()} collected`,
      icon: TrendingUp,
      href: "/admin/invoices",
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
    {
      label: "Active Staff",
      value: data.staffCount,
      sub: "staff members",
      icon: Users,
      href: "/admin/staff",
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
    },
  ];

  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  return (
    <div className="grid gap-8">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Operations
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {firstName ? `Welcome back, ${firstName}.` : "Dashboard"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Live overview of orders, revenue, support, and staff across the platform.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href as Route}
              className="group rounded-[1.75rem] border border-border/80 bg-card/70 p-5 transition hover:border-border hover:bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
                </div>
                <div className={`rounded-2xl p-3 ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link
            href={"/admin/orders" as Route}
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:grid">
            <div>Order</div>
            <div>Client</div>
            <div>Designer</div>
            <div>Status</div>
            <div>Date</div>
          </div>
          <div className="divide-y divide-border/80">
            {data.recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}` as Route}
                  className="grid grid-cols-1 gap-2 px-5 py-4 text-sm transition hover:bg-secondary/30 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center"
                >
                  <div>
                    <div className="font-medium">{order.title}</div>
                    <div className="text-xs text-muted-foreground">{order.orderNumber}</div>
                  </div>
                  <div className="text-muted-foreground">
                    {order.clientUser.name ?? "—"}
                  </div>
                  <div className="text-muted-foreground">
                    {order.assignedTo?.name ?? (
                      <span className="italic opacity-40">Unassigned</span>
                    )}
                  </div>
                  <div>
                    <OrderStatusBadge status={mapDbStatus(order.status)} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/staff/new", label: "Add staff member", Icon: Users },
          { href: "/admin/invoices", label: "View invoices", Icon: FileText },
          { href: "/admin/support", label: "Support inbox", Icon: Inbox },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href as Route}
            className="flex items-center gap-3 rounded-[1.5rem] border border-border/80 bg-card/70 px-4 py-3 text-sm font-medium transition hover:bg-card"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            {label}
          </Link>
        ))}
      </section>
    </div>
  );
}
