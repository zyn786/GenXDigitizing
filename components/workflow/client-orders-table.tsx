import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { OrderProgressBar } from "@/components/workflow/order-progress-bar";
import type { WorkflowOrder } from "@/lib/workflow/types";

/* ------------------------------------------------------------------ */
/* Client-friendly status labels                                       */
/* ------------------------------------------------------------------ */

function clientStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SUBMITTED: "Order Received",
    UNDER_REVIEW: "Under Review",
    ASSIGNED_TO_DESIGNER: "In Production",
    IN_PROGRESS: "In Production",
    PROOF_READY: "Proof Ready",
    REVISION_REQUESTED: "Revision In Progress",
    APPROVED: "Proof Approved",
    DELIVERED: "Completed",
    CLOSED: "Completed",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status.replaceAll("_", " ").toLowerCase();
}

function statusTone(status: string): string {
  switch (status) {
    case "PROOF_READY": return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
    case "REVISION_REQUESTED": return "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20";
    case "APPROVED": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "DELIVERED":
    case "CLOSED": return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
    case "CANCELLED": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "IN_PROGRESS":
    case "ASSIGNED_TO_DESIGNER": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    default: return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ClientOrdersTable({ orders }: { orders: WorkflowOrder[] }) {
  return (
    <div className="grid gap-4">
      {orders.map((order) => {
        const label = clientStatusLabel(order.status);
        const tone = statusTone(order.status);

        return (
          <Card key={order.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {order.reference}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-semibold">{order.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.serviceLabel}{order.companyName ? ` · ${order.companyName}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
                    {label}
                  </span>
                  <Link
                    href={`/client/orders/${order.id}` as Route}
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm font-medium transition hover:bg-card hover:shadow-sm"
                  >
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
                  <OrderProgressBar value={order.progressPercent} />
                </div>
                <p className="text-sm text-muted-foreground">{order.dueLabel}</p>
                <p className="text-sm text-muted-foreground">
                  {order.revisionCount} revision{order.revisionCount === 1 ? "" : "s"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
