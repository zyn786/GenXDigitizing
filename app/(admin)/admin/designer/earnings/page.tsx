import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: buildTitle("My Earnings") };

export default async function DesignerEarningsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const designerId = session.user.id;

  const [commissions, staffProfile] = await Promise.all([
    prisma.designerCommission.findMany({
      where: { designerId },
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true, title: true, estimatedPrice: true } } },
    }),
    prisma.staffProfile.findUnique({
      where: { userId: designerId },
      select: { commissionType: true, commissionRate: true },
    }),
  ]);

  const pending = commissions.filter((c) => c.status === "PENDING");
  const paid = commissions.filter((c) => c.status === "PAID");
  const pendingTotal = pending.reduce((s, c) => s + Number(c.amount), 0);
  const paidTotal = paid.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="grid gap-6">
      <section>
        <Link
          href={"/admin/designer" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">My Earnings</h1>
        {staffProfile && (
          <p className="mt-2 text-sm text-muted-foreground">
            Your current rate:{" "}
            <span className="font-medium text-foreground">
              {staffProfile.commissionType === "PERCENTAGE"
                ? `${Number(staffProfile.commissionRate)}% of order value`
                : `$${Number(staffProfile.commissionRate)} flat per order`}
            </span>
          </p>
        )}
      </section>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-border/80 bg-card/70 px-4 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pending</div>
          <div className="mt-1.5 text-2xl font-semibold text-amber-400">${pendingTotal.toFixed(2)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{pending.length} orders</div>
        </div>
        <div className="rounded-[1.5rem] border border-border/80 bg-card/70 px-4 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Paid Out</div>
          <div className="mt-1.5 text-2xl font-semibold text-emerald-400">${paidTotal.toFixed(2)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{paid.length} orders</div>
        </div>
        <div className="rounded-[1.5rem] border border-border/80 bg-card/70 px-4 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</div>
          <div className="mt-1.5 text-2xl font-semibold">${(pendingTotal + paidTotal).toFixed(2)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{commissions.length} orders</div>
        </div>
      </div>

      {commissions.length === 0 ? (
        <Card className="rounded-[1.5rem] border-border/80">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No earnings yet. Commissions are added automatically when your orders are delivered.
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending Payment</CardTitle>
                <CardDescription>These commissions have been earned and are awaiting payout.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {pending.map((c) => (
                  <EarningsRow key={c.id} commission={c} />
                ))}
              </CardContent>
            </Card>
          )}

          {paid.length > 0 && (
            <Card className="rounded-[1.5rem] border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Paid Out</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {paid.map((c) => (
                  <EarningsRow key={c.id} commission={c} />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function EarningsRow({
  commission,
}: {
  commission: {
    id: string;
    orderId: string;
    amount: unknown;
    rate: unknown;
    type: string;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
    order: { orderNumber: string; title: string; estimatedPrice: unknown };
  };
}) {
  const amount = Number(commission.amount);
  const rate = Number(commission.rate);
  const estimatedPrice = commission.order.estimatedPrice != null ? Number(commission.order.estimatedPrice) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-secondary/40 px-4 py-3 text-sm">
      <div className="min-w-0">
        <div className="font-medium truncate">{commission.order.title}</div>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{commission.order.orderNumber}</span>
          {estimatedPrice != null && <span>Order: ${estimatedPrice.toFixed(2)}</span>}
          <span>
            {commission.type === "PERCENTAGE" ? `${rate}% rate` : `$${rate} flat`}
          </span>
          <span>{new Date(commission.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold">${amount.toFixed(2)}</span>
        {commission.status === "PAID" ? (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            Paid {commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : ""}
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}
