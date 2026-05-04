import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { OrderProgressBar } from "@/components/workflow/order-progress-bar";
import { getClientWorkflowStatusLabel, getClientWorkflowStatusTone } from "@/lib/workflow/status";
import type { WorkflowOrder } from "@/lib/workflow/types";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ClientOrdersTable({ orders }: { orders: WorkflowOrder[] }) {
  return (
    <div className="grid gap-4">
      {orders.map((order) => {
        const label = getClientWorkflowStatusLabel(order.status);
        const tone = getClientWorkflowStatusTone(order.status);

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
