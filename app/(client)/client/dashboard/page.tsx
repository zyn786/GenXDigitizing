import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, MessageCircle, Package, RefreshCw, Sparkles, Upload } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getClientInvoices } from "@/lib/billing/repository";
import { getClientOrders } from "@/lib/workflow/repository";
import { getClientWorkflowStatusLabel } from "@/lib/workflow/status";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Dashboard") };
export const dynamic = "force-dynamic";

function isActiveOrder(status: string): boolean {
  return !["DELIVERED", "CLOSED", "CANCELLED"].includes(status);
}

function clientNextAction(status: string, proofStatus?: string, paymentStatus?: string): string | null {
  if (status === "SUBMITTED" || status === "UNDER_REVIEW") return "We'll review your order and assign a designer soon.";
  if (status === "PROOF_READY") return "Review your proof and approve or request changes.";
  if (status === "REVISION_REQUESTED") return "Your revision is being worked on by our team.";
  if (status === "APPROVED" && paymentStatus === "PAYMENT_PENDING") return "Submit payment proof to unlock your files.";
  if (status === "APPROVED" && paymentStatus === "PAYMENT_SUBMITTED") return "Payment is under review. Files will unlock soon.";
  if (status === "DELIVERED" || status === "CLOSED") return "Your files are ready to download.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function ClientDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/dashboard");

  const [orders, invoices] = await Promise.all([
    getClientOrders(session.user.id),
    getClientInvoices(session.user.id),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const activeOrders = orders.filter((o) => isActiveOrder(o.status));
  const unpaidInvoices = invoices.filter((inv) => inv.status !== "PAID" && inv.status !== "CANCELLED");
  const totalBalance = unpaidInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const proofsWaiting = orders.filter((o) => o.status === "PROOF_READY").length;
  const filesReady = orders.filter((o) => o.status === "DELIVERED" || o.status === "CLOSED").length;
  const isFirstTime = orders.length === 0;

  return (
    <div className="grid gap-6">
      {/* Welcome */}
      <section>
        <p className="section-eyebrow">Client workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Track your orders, review proofs, download files, and manage your account — all in one place.
        </p>
      </section>

      {/* First-order-free card */}
      {isFirstTime && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">
                <Sparkles className="mr-1.5 inline h-4 w-4 text-primary" />
                Your First Digitizing Order Is Free
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                New clients get their first embroidery digitizing order at no cost. Ready to get started?
              </p>
            </div>
            <Button asChild variant="premium" shape="pill" size="lg" className="shrink-0">
              <Link href="/orders">
                Place Free Order
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground md:text-xs md:tracking-[0.18em]">Active orders</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-blue-500 dark:text-blue-400 md:mt-2 md:text-3xl">{activeOrders.length}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:mt-1 md:text-xs">{orders.length} total</p>
          </CardContent>
        </Card>

        <Card className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${proofsWaiting > 0 ? "border-violet-500/30 bg-violet-500/[0.03]" : ""}`}>
          <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${proofsWaiting > 0 ? "via-violet-500/60" : "via-violet-500/30"} to-transparent`} />
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground md:text-xs md:tracking-[0.18em]">Proofs waiting</p>
            <p className={`mt-1.5 text-2xl font-bold tracking-tight md:mt-2 md:text-3xl ${proofsWaiting > 0 ? "text-violet-500 dark:text-violet-400" : ""}`}>{proofsWaiting}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:mt-1 md:text-xs">
              {proofsWaiting > 0 ? "Action needed" : "None pending"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground md:text-xs md:tracking-[0.18em]">Files ready</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-500 dark:text-emerald-400 md:mt-2 md:text-3xl">{filesReady}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:mt-1 md:text-xs">
              {filesReady > 0 ? "Ready to download" : "None yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <CardContent className="p-3 md:p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground md:text-xs md:tracking-[0.18em]">Balance</p>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-amber-500 dark:text-amber-400 md:mt-2 md:text-3xl">${totalBalance.toFixed(2)}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:mt-1 md:text-xs">
              {unpaidInvoices.length} open invoice{unpaidInvoices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Action + New Order */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Next action card */}
        {activeOrders.length > 0 && (() => {
          const firstActionable = activeOrders.find((o) =>
            o.status === "PROOF_READY" || o.status === "APPROVED" || o.status === "REVISION_REQUESTED"
          );
          if (!firstActionable) return null;
          const action = clientNextAction(
            firstActionable.status,
            firstActionable.proofStatus ?? undefined,
            firstActionable.paymentStatus ?? undefined
          );
          return (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Next action</p>
                <h3 className="mt-2 font-semibold">{firstActionable.title}</h3>
                {action && <p className="mt-1 text-sm text-muted-foreground">{action}</p>}
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="default" shape="pill" size="sm">
                    <Link href={`/client/orders/${firstActionable.id}` as Route}>
                      View order
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Start new card */}
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start something new</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button asChild variant="premium" shape="pill" size="sm">
                <Link href="/orders">
                  <Package className="h-3.5 w-3.5" />
                  Place Order
                </Link>
              </Button>
              <Button asChild variant="outline" shape="pill" size="sm">
                <Link href="/client/quote">
                  <FileText className="h-3.5 w-3.5" />
                  Request Quote
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      {orders.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2">
            {orders.slice(0, 4).map((order) => (
              <Link
                key={order.id}
                href={`/client/orders/${order.id}` as Route}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm transition hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{order.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {order.reference} · {order.serviceLabel}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge className="text-[10px]">
                    {getClientWorkflowStatusLabel(order.status)}
                  </Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No orders yet"
          description="Ready to start? Request a quote or place a direct order."
          action={
            <div className="flex gap-3">
              <Button asChild variant="premium" shape="pill" size="sm">
                <Link href="/orders">Place Order</Link>
              </Button>
              <Button asChild variant="outline" shape="pill" size="sm">
                <Link href="/client/quote">Get a Quote</Link>
              </Button>
            </div>
          }
        />
      )}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          href="/client/files"
          icon={<Upload className="h-4 w-4" />}
          label="My Files"
          desc="Download completed delivery files"
          count={filesReady}
          countLabel="ready"
        />
        <QuickLink
          href="/client/invoices"
          icon={<FileText className="h-4 w-4" />}
          label="Invoices"
          desc="View balances, payments, and receipts"
          count={unpaidInvoices.length}
          countLabel="open"
        />
        <QuickLink
          href="/client/support"
          icon={<MessageCircle className="h-4 w-4" />}
          label="Chat & Support"
          desc="Chat with our team about orders or artwork"
        />
        <QuickLink
          href="/client/revisions"
          icon={<RefreshCw className="h-4 w-4" />}
          label="Revisions"
          desc="Open revision requests waiting on action"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* QuickLink helper                                                    */
/* ------------------------------------------------------------------ */

function QuickLink({
  href,
  icon,
  label,
  desc,
  count,
  countLabel,
}: {
  href: Route;
  icon: React.ReactNode;
  label: string;
  desc: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{label}</span>
              {count !== undefined && count > 0 && (
                <Badge className="text-[10px]">{count} {countLabel}</Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}
