import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientInvoiceList } from "@/components/billing/client-invoice-list";
import { getClientInvoices } from "@/lib/billing/repository";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Invoices") };

export default async function ClientInvoicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/invoices");

  const invoices = await getClientInvoices(session.user.id);

  return (
    <div className="grid gap-6">
      <section>
        <p className="section-eyebrow">Billing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Invoices & Billing</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          View your invoice history, payment status, balances, and receipts.
        </p>
      </section>

      <ClientInvoiceList invoices={invoices} />
    </div>
  );
}
