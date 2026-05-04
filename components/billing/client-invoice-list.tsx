import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { InvoiceRecord } from "@/lib/billing/types";
import { getCurrencySymbol } from "@/lib/billing/currencies";

function invoiceStatusTone(status: string): string {
  switch (status) {
    case "PAID": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "PARTIALLY_PAID": return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "OVERDUE": return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
    case "SENT": return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "CANCELLED": return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
    default: return "border-border/60 bg-muted/60 text-muted-foreground";
  }
}

export function ClientInvoiceList({ invoices }: { invoices: InvoiceRecord[] }) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="No invoices yet"
        description="Invoices will appear here once your first order is confirmed and billed."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {invoices.map((invoice) => {
        const href = `/client/invoices/${invoice.id}` as Route;
        const symbol = getCurrencySymbol(invoice.currency);

        return (
          <Card key={invoice.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xl font-semibold">{invoice.clientName}</p>
                </div>
                <Badge className={invoiceStatusTone(invoice.status)}>
                  {invoice.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                <p>Total: {symbol}{invoice.total.toFixed(2)}</p>
                <p>Balance: {symbol}{invoice.balanceDue.toFixed(2)}</p>
                <p>Due: {invoice.dueDate}</p>
              </div>

              <Link
                href={href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary transition hover:gap-2"
              >
                View invoice
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
