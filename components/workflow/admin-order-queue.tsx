"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/workflow/order-status-badge";
import type { WorkflowOrder } from "@/lib/workflow/types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PROOF_READY", label: "Proof Ready" },
  { value: "REVISION_REQUESTED", label: "Revision" },
  { value: "APPROVED", label: "Approved" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AdminOrderQueue({ orders }: { orders: WorkflowOrder[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.reference.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          o.clientName.toLowerCase().includes(q) ||
          (o.companyName?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  return (
    <div className="grid gap-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search by order #, title, or client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border/70 bg-card pl-4 pr-4 text-sm outline-none transition focus:border-primary/40 focus:bg-card focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-2xl border border-border/70 bg-card px-4 text-sm outline-none transition focus:border-primary/40"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {(search || statusFilter) && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {orders.length} orders
        </p>
      )}

      {/* Table — card-stack on mobile, grid on sm+ */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {/* Desktop header row */}
        <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] gap-3 border-b border-border/60 bg-muted/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground sm:grid">
          <div>Order</div>
          <div>Client</div>
          <div>Status</div>
          <div>Assigned</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="group px-4 py-3 text-sm transition-colors hover:bg-muted/30 sm:px-5 sm:py-4"
              >
                {/* Mobile card layout */}
                <div className="flex items-start justify-between gap-3 sm:hidden">
                  <div className="min-w-0">
                    <p className="font-semibold group-hover:text-primary transition-colors duration-150 truncate">{order.reference}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{order.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{order.companyName ?? order.clientName}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                  <Button asChild variant="outline" shape="pill" size="sm" className="shrink-0">
                    <Link href={`/admin/orders/${order.id}` as Route}>Open</Link>
                  </Button>
                </div>
                {/* Desktop grid layout */}
                <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] items-center gap-3 sm:grid">
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors duration-150">{order.reference}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{order.title}</p>
                  </div>
                  <p className="truncate text-muted-foreground">{order.companyName ?? order.clientName}</p>
                  <div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.assignedTo ?? <span className="italic opacity-40">Unassigned</span>}
                  </p>
                  <div className="text-right">
                    <Button asChild variant="outline" shape="pill" size="sm">
                      <Link href={`/admin/orders/${order.id}` as Route}>Inspect</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
