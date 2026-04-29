import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientInvoiceList } from "@/components/billing/client-invoice-list";
import { getClientInvoices } from "@/lib/billing/repository";

export default async function ClientInvoicesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?next=/client/invoices");
  }

  const invoices = await getClientInvoices(session.user.id);

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Billing
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Invoices &amp; billing
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          View your invoice history, payment status, balances, and receipts.
          Open any invoice to start a billing conversation with our team.
        </p>
      </section>

      <ClientInvoiceList invoices={invoices} />
    </div>
  );
}