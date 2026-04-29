"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";

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
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          placeholder="Search by order #, title, or client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 flex-1 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-2xl border border-border/80 bg-background px-4 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {(search || statusFilter) && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {orders.length} orders
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/70">
        <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] gap-3 border-b border-border/80 px-5 py-4 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:grid">
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
          <div className="divide-y divide-border/80">
            {filtered.map((order) => {
              const href = `/admin/orders/${order.id}` as Route;
              return (
                <div
                  key={order.id}
                  className="grid grid-cols-1 gap-2 px-5 py-4 text-sm sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] sm:items-center"
                >
                  <div>
                    <div className="font-semibold">{order.reference}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{order.title}</div>
                  </div>
                  <div className="text-muted-foreground">
                    {order.companyName ?? order.clientName}
                  </div>
                  <div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.assignedTo ?? "Unassigned"}
                  </div>
                  <div className="sm:text-right">
                    <Link
                      href={href}
                      className="inline-flex h-9 items-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
