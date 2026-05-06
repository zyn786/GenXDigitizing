import { AdminInvoiceList } from "@/components/billing/admin-invoice-list";
import { getAdminInvoices } from "@/lib/billing/repository";

export default async function AdminInvoicesPage() {
  const invoices = await getAdminInvoices();

  return (
    <div className="grid gap-6">
      <section>
        <p className="section-eyebrow">Billing operations</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Invoices</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          All client invoices across every order. Record payments, apply discounts, and issue receipts.
        </p>
      </section>

      <AdminInvoiceList invoices={invoices} />
    </div>
  );
}