import { AdminInvoiceList } from "@/components/billing/admin-invoice-list";
import { getAdminInvoices } from "@/lib/billing/repository";

export default async function AdminInvoicesPage() {
  const invoices = await getAdminInvoices();

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Billing operations
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Invoices
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          All client invoices across every order. Record payments, apply
          discounts, issue receipts, and open an invoice to start a billing
          conversation with the client.
        </p>
      </section>

      <AdminInvoiceList invoices={invoices} />
    </div>
  );
}