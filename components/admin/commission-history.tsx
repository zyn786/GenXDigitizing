"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type CommissionRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderTitle: string;
  estimatedPrice: number | null;
  amount: number;
  rate: number;
  type: "PERCENTAGE" | "FLAT_RATE";
  status: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
};

type Props = {
  userId: string;
  initialRows: CommissionRow[];
};

export function CommissionHistory({ userId, initialRows }: Props) {
  const [rows, setRows] = React.useState<CommissionRow[]>(initialRows);
  const [paying, setPaying] = React.useState<string | null>(null);

  async function markPaid(commissionId: string) {
    setPaying(commissionId);
    try {
      const res = await fetch(`/api/admin/staff/${userId}/commissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId }),
      });
      if (!res.ok) return;
      setRows((prev) =>
        prev.map((r) =>
          r.id === commissionId
            ? { ...r, status: "PAID", paidAt: new Date().toISOString() }
            : r,
        ),
      );
    } finally {
      setPaying(null);
    }
  }

  const pending = rows.filter((r) => r.status === "PENDING");
  const paid = rows.filter((r) => r.status === "PAID");

  if (rows.length === 0) {
    return (
      <Card className="rounded-[1.5rem] border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No commissions yet. They are created automatically when orders are marked Delivered.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.5rem] border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Commission History</CardTitle>
        <CardDescription>
          Commissions are auto-created when an order is marked Delivered. Mark as Paid once payment
          is sent to the designer.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {pending.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
              Pending — ${pending.reduce((s, r) => s + r.amount, 0).toFixed(2)}
            </div>
            <div className="grid gap-2">
              {pending.map((row) => (
                <CommissionRow key={row.id} row={row} paying={paying} onPay={markPaid} />
              ))}
            </div>
          </div>
        )}

        {paid.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Paid — ${paid.reduce((s, r) => s + r.amount, 0).toFixed(2)}
            </div>
            <div className="grid gap-2">
              {paid.map((row) => (
                <CommissionRow key={row.id} row={row} paying={paying} onPay={markPaid} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CommissionRow({
  row,
  paying,
  onPay,
}: {
  row: CommissionRow;
  paying: string | null;
  onPay: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-secondary/40 px-4 py-3 text-sm">
      <div className="min-w-0">
        <div className="font-medium truncate">{row.orderTitle}</div>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Link href={`/admin/orders/${row.orderId}` as Route} className="hover:underline">
            {row.orderNumber}
          </Link>
          {row.estimatedPrice != null && <span>Order: ${row.estimatedPrice.toFixed(2)}</span>}
          <span>
            {row.type === "PERCENTAGE" ? `${row.rate}%` : `$${row.rate} flat`}
          </span>
          <span>{new Date(row.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold">${row.amount.toFixed(2)}</span>
        {row.status === "PENDING" ? (
          <button
            onClick={() => onPay(row.id)}
            disabled={paying === row.id}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-500/15 px-3 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-60"
          >
            {paying === row.id && <Loader2 className="h-3 w-3 animate-spin" />}
            Mark Paid
          </button>
        ) : (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            Paid {row.paidAt ? new Date(row.paidAt).toLocaleDateString() : ""}
          </span>
        )}
      </div>
    </div>
  );
}
