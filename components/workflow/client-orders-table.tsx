import Link from "next/link";
import type { Route } from "next";

import { OrderProgressBar } from "@/components/workflow/order-progress-bar";
import { OrderStatusBadge } from "@/components/workflow/order-status-badge";
import type { WorkflowOrder } from "@/lib/workflow/types";

export function ClientOrdersTable({ orders }: { orders: WorkflowOrder[] }) {
  return (
    <div className="grid gap-4">
      {orders.map((order) => {
        const href = `/client/orders/${order.id}` as Route;

        return (
          <article
            key={order.id}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                  {order.reference}
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {order.title}
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  {order.serviceLabel} · {order.companyName ?? order.clientName}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <Link
                  href={href}
                  className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.08] px-4 text-sm text-white transition hover:bg-white/[0.12]"
                >
                  Open
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/40">
                  Progress
                </div>
                <OrderProgressBar value={order.progressPercent} />
              </div>
              <div className="text-sm text-white/60">{order.dueLabel}</div>
              <div className="text-sm text-white/60">
                {order.revisionCount} revision{order.revisionCount === 1 ? "" : "s"}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
