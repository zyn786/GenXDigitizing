import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, MessageCircle, Package, RefreshCw, FileQuestion, AlertTriangle } from "lucide-react";

import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientInvoices } from "@/lib/billing/repository";
import { getClientOrders } from "@/lib/workflow/repository";
import { buildTitle } from "@/lib/site";
import { DashboardActions } from "@/components/client/dashboard-actions";

export const metadata: Metadata = {
  title: buildTitle("Dashboard"),
};

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/dashboard");

  const [orders, invoices] = await Promise.all([
    getClientOrders(session.user.id),
    getClientInvoices(session.user.id),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const pendingOrders = orders.filter(
    (o) => !["DELIVERED", "CLOSED", "CANCELLED"].includes(String((o as Record<string, unknown>).status ?? ""))
  );
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status !== "PAID" && inv.status !== "CANCELLED"
  );
  const totalBalance = unpaidInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const quickLinks: Array<{ href: Route; icon: typeof Package; label: string; description: string; count: number | null; countLabel: string | null; color: string }> = [
    {
      href: "/client/orders" as Route,
      icon: Package,
      label: "My Orders",
      description: "Track progress, view proofs, download files",
      count: orders.length,
      countLabel: "total",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      href: "/client/quotes" as Route,
      icon: FileQuestion,
      label: "Quote Requests",
      description: "Pricing requests pending review by our team",
      count: null,
      countLabel: null,
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      href: "/client/invoices" as Route,
      icon: FileText,
      label: "Invoices",
      description: "View balances, payment history, and receipts",
      count: unpaidInvoices.length,
      countLabel: "open",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      href: "/client/support" as Route,
      icon: MessageCircle,
      label: "Chat & Support",
      description: "Chat with our team about orders or artwork",
      count: null,
      countLabel: null,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      href: "/client/revisions" as Route,
      icon: RefreshCw,
      label: "Revisions",
      description: "Open revision requests waiting on action",
      count: null,
      countLabel: null,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid gap-6">
      {/* Welcome */}
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Client workspace
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Here&apos;s everything happening with your account right now.
        </p>
      </section>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-[1.5rem] border-border/80">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Active orders
            </div>
            <div className="mt-2 text-3xl font-semibold">{pendingOrders.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {orders.length} total
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/80">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Outstanding balance
            </div>
            <div className="mt-2 text-3xl font-semibold">
              ${totalBalance.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {unpaidInvoices.length} open invoice{unpaidInvoices.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/80">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Start something new
            </div>
            <div className="mt-3">
              <DashboardActions />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="group block">
              <Card className="h-full rounded-[1.5rem] border-border/80 transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${link.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{link.label}</div>
                    {link.count !== null && link.count > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {link.count} {link.countLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {link.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary transition group-hover:gap-2">
                    Open
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent orders */}
      {orders.length > 0 ? (
        <Card className="rounded-[1.5rem] border-border/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent orders</CardTitle>
              <Link
                href="/client/orders"
                className="text-xs text-primary transition hover:opacity-80"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {orders.slice(0, 4).map((order) => {
              const o = order as Record<string, unknown>;
              return (
                <Link
                  key={String(o.id)}
                  href={`/client/orders/${String(o.id)}` as unknown as Route}
                  className="flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/40 px-4 py-3 text-sm transition hover:bg-secondary/70"
                >
                  <div>
                    <div className="font-medium">{String(o.title ?? "Order")}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {String(o.reference ?? o.id)} · {String(o.serviceLabel ?? "")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {String(o.status) === "DRAFT" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        Needs details
                      </span>
                    ) : (
                      <span className="rounded-full border border-border/80 bg-background px-3 py-1 text-xs capitalize">
                        {String(o.status ?? "").replaceAll("_", " ").toLowerCase()}
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[1.5rem] border-border/80">
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <div className="mt-3 text-sm font-medium">No orders yet</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ready to start? Request a quote or place a direct order.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/client/quote" className="btn-primary text-xs">
                Get a quote
              </Link>
              <Link href="/client/order" className="btn-outline text-xs">
                Direct order
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
