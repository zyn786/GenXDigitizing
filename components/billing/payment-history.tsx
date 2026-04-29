import type { InvoicePayment, CurrencyCode } from "@/lib/billing/types";
import { getCurrencySymbol } from "@/lib/billing/currencies";

export function PaymentHistory({
  payments,
  currency,
}: {
  payments: InvoicePayment[];
  currency: CurrencyCode;
}) {
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="grid gap-3">
      {payments.map((payment) => (
        <div key={payment.id} className="rounded-2xl border border-border/80 bg-secondary/80 p-4 text-sm">
          <div className="font-medium">{payment.receiptNumber}</div>
          <div className="mt-1 text-muted-foreground">
            {symbol}{payment.amount.toFixed(2)} · {payment.method} · {new Date(payment.receivedAt).toLocaleString()}
          </div>
          {payment.note ? <div className="mt-2 text-muted-foreground">{payment.note}</div> : null}
        </div>
      ))}
    </div>
  );
}
