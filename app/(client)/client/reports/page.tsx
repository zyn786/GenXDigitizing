import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, Package, CheckCircle, Clock, RefreshCw } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: buildTitle("Reports") };
export const dynamic = "force-dynamic";

export default async function ClientReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/reports");

  const userId = session.user.id;

  const [orderStats, recentOrders] = await Promise.all([
    prisma.workflowOrder.groupBy({ by: ["status"], where: { clientUserId: userId }, _count: { id: true } }),
    prisma.workflowOrder.findMany({ where: { clientUserId: userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, orderNumber: true, title: true, serviceType: true, status: true, createdAt: true, paymentStatus: true } }),
  ]);

  const totalOrders = orderStats.reduce((sum, s) => sum + s._count.id, 0);
  const completedOrders = orderStats.filter((s) => ["DELIVERED", "CLOSED", "APPROVED"].includes(s.status)).reduce((sum, s) => sum + s._count.id, 0);
  const activeOrders = orderStats.filter((s) => ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED_TO_DESIGNER", "IN_PROGRESS", "PROOF_READY", "REVISION_REQUESTED"].includes(s.status)).reduce((sum, s) => sum + s._count.id, 0);
  const paidOrders = orderStats.filter((s) => ["DELIVERED", "CLOSED"].includes(s.status)).reduce((sum, s) => sum + s._count.id, 0);

  const SERVICE_LABEL: Record<string, string> = {
    EMBROIDERY_DIGITIZING: "Embroidery Digitizing", VECTOR_ART: "Vector Art",
    COLOR_SEPARATION_DTF: "Color Separation / DTF", CUSTOM_PATCHES: "Custom Patches",
  };

  return (
    <div className="grid gap-6">
      <section>
        <p className="section-eyebrow">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">My Reports</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A summary of your orders and activity with GenX Digitizing.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="h-4 w-4" />} label="Total orders" value={totalOrders} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Active orders" value={activeOrders} />
        <StatCard icon={<CheckCircle className="h-4 w-4" />} label="Completed" value={completedOrders} />
        <StatCard icon={<RefreshCw className="h-4 w-4" />} label="Delivered" value={paidOrders} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-muted-foreground" />Orders by status</CardTitle>
        </CardHeader>
        <CardContent>
          {orderStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="grid gap-2">
              {orderStats.map((s) => (
                <div key={s.status} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm">
                  <span className="capitalize text-muted-foreground">{s.status.toLowerCase().replace(/_/g, " ")}</span>
                  <span className="font-semibold">{s._count.id}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent orders</CardTitle></CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders found.</p>
          ) : (
            <div className="grid gap-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{order.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{order.orderNumber} · {SERVICE_LABEL[order.serviceType] ?? order.serviceType}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[10px] font-medium capitalize">{order.status.toLowerCase().replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
