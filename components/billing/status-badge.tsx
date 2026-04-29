import type { InvoiceStatus } from "@/lib/billing/types";

export function BillingStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className="inline-flex rounded-full border border-border/80 bg-secondary/80 px-3 py-1 text-xs font-medium">
      {status.replaceAll("_", " ")}
    </span>
  );
}
