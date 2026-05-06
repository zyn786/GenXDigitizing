import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Calendar } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { OrderProgressBar } from "@/components/workflow/order-progress-bar";
import { getClientWorkflowStatusLabel, getClientWorkflowStatusTone } from "@/lib/workflow/status";
import type { WorkflowOrder } from "@/lib/workflow/types";

/* ------------------------------------------------------------------ */
/* Status dot indicator map                                            */
/* ------------------------------------------------------------------ */

const STATUS_DOTS: Record<string, string> = {
  SUBMITTED:           "bg-blue-400",
  UNDER_REVIEW:        "bg-blue-400",
  ASSIGNED_TO_DESIGNER:"bg-amber-400",
  IN_PROGRESS:         "bg-amber-400 animate-pulse",
  PROOF_READY:         "bg-violet-400 animate-pulse",
  REVISION_REQUESTED:  "bg-fuchsia-400",
  APPROVED:            "bg-emerald-400",
  DELIVERED:           "bg-teal-400",
  CLOSED:              "bg-teal-400",
  CANCELLED:           "bg-red-400",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ClientOrdersTable({ orders }: { orders: WorkflowOrder[] }) {
  return (
    <div className="grid gap-4">
      {orders.map((order) => {
        const label   = getClientWorkflowStatusLabel(order.status);
        const tone    = getClientWorkflowStatusTone(order.status);
        const dot     = STATUS_DOTS[order.status] ?? "bg-muted-foreground/40";
        const isActive = !["DELIVERED", "CLOSED", "CANCELLED"].includes(order.status);

        return (
          <Card
            key={order.id}
            className={`group relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
              order.status === "PROOF_READY"
                ? "border-violet-500/30 bg-violet-500/[0.03] shadow-[0_0_0_1px_rgba(139,92,246,0.1)]"
                : ""
            }`}
          >
            {/* Left accent bar for active orders */}
            {isActive && (
              <div
                className={`absolute inset-y-0 left-0 w-0.5 rounded-l-[inherit] ${
                  order.status === "PROOF_READY"
                    ? "bg-gradient-to-b from-violet-400 to-violet-600"
                    : order.status === "IN_PROGRESS" || order.status === "ASSIGNED_TO_DESIGNER"
                    ? "bg-gradient-to-b from-amber-400 to-amber-600"
                    : "bg-gradient-to-b from-indigo-400 to-indigo-600"
                }`}
                aria-hidden
              />
            )}

            <CardContent className="p-5 pl-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: order info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {order.reference}
                    </p>
                    {/* Live dot indicator */}
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
                      aria-hidden
                    />
                  </div>
                  <h2 className="mt-1 truncate text-lg font-semibold">{order.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.serviceLabel}
                    {order.companyName ? ` · ${order.companyName}` : ""}
                  </p>
                </div>

                {/* Right: status + open button */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
                  >
                    {label}
                  </span>
                  <Link
                    href={`/client/orders/${order.id}` as Route}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm font-medium transition hover:bg-card hover:shadow-sm group-hover:border-primary/30 group-hover:text-primary"
                  >
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              {/* Progress + meta row */}
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Progress
                  </p>
                  <OrderProgressBar value={order.progressPercent} />
                </div>

                {order.dueLabel && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {order.dueLabel}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  {order.revisionCount} revision
                  {order.revisionCount === 1 ? "" : "s"}
                </p>
              </div>

              {/* Proof ready callout */}
              {order.status === "PROOF_READY" && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.07] px-4 py-3">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)] animate-pulse" />
                  <span className="text-sm font-medium text-violet-400">
                    Your proof is ready — review and approve to continue.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
