import Link from "next/link";
import type { Route } from "next";
import { FileText } from "lucide-react";

import type { InvoiceRecord } from "@/lib/billing/types";
import { BillingStatusBadge } from "@/components/billing/status-badge";
import { getCurrencySymbol } from "@/lib/billing/currencies";

export function ClientInvoiceList({ invoices }: { invoices: InvoiceRecord[] }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border/80 bg-card/70 py-16 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40" />
        <div className="mt-3 text-sm font-medium">No invoices yet</div>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Invoices will appear here once your first order is confirmed and billed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {invoices.map((invoice) => {
        const invoiceHref = `/client/invoices/${invoice.id}` as Route;

        return (
          <div
            key={invoice.id}
            className="rounded-[1.75rem] border border-border/80 bg-card/70 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xl font-semibold">{invoice.clientName}</div>
              </div>

              <BillingStatusBadge status={invoice.status} />
            </div>

            <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <div>
                Total: {getCurrencySymbol(invoice.currency)}
                {invoice.total.toFixed(2)}
              </div>
              <div>
                Balance: {getCurrencySymbol(invoice.currency)}
                {invoice.balanceDue.toFixed(2)}
              </div>
              <div>Due: {invoice.dueDate}</div>
            </div>

            <Link
              href={invoiceHref}
              className="mt-4 inline-flex text-sm font-medium"
            >
              View invoice
            </Link>
          </div>
        );
      })}
    </div>
  );
}