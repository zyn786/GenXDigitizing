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

export const metadata: Metadata = { title: buildTitle("Activity Log") };

const ACTION_LABELS: Record<string, string> = {
  "order.created": "Order created", "order.status_changed": "Status changed", "order.cancelled": "Order cancelled",
  "quote.converted_to_order": "Quote converted", "designer.assigned": "Designer assigned",
  "portfolio.item_created": "Portfolio item added", "portfolio.item_updated": "Portfolio item updated", "portfolio.item_deleted": "Portfolio item deleted",
  "pricing.updated": "Pricing updated", "campaign.created": "Campaign created", "campaign.approved": "Campaign approved",
  "campaign.rejected": "Campaign rejected", "campaign.activated": "Campaign activated",
  "coupon.created": "Coupon created", "coupon.approved": "Coupon approved", "coupon.deactivated": "Coupon deactivated",
};

export default async function AdminActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") redirect("/admin/dashboard");

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    include: { actorUser: { select: { name: true, email: true, role: true } } },
  });

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Activity Log</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">System logs</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Activity Log</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Every important action across the platform — orders, status changes, assignments, pricing updates, and more.
        </p>
      </section>

      {logs.length === 0 ? (
        <div className="rounded-[2rem] border border-border/60 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">No activity recorded yet.</div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="hidden grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr] gap-4 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:grid">
            <div>Time</div><div>Action</div><div>Actor</div><div>Entity</div><div>Details</div>
          </div>
          <div className="divide-y divide-border/60">
            {logs.map((log) => {
              const meta = log.metadata as Record<string, unknown> | null;
              return (
                <div key={log.id} className="grid grid-cols-1 gap-1 px-5 py-3.5 text-sm sm:grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr] sm:items-center">
                  <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                  <p className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</p>
                  <p className="text-muted-foreground">
                    {log.actorUser?.name ?? log.actorEmail ?? "System"}
                    {log.actorUser?.role && <span className="ml-1 text-xs opacity-50">({log.actorUser.role})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{log.entityType}</p>
                  <p className="truncate text-xs text-muted-foreground">{meta ? Object.entries(meta).slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(" · ") : "—"}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
