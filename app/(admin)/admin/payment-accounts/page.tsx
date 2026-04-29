import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buildTitle } from "@/lib/site";
import { getPaymentAccounts } from "@/lib/payments/repository";
import { PaymentAccountsManager } from "@/components/admin/payment-accounts-manager";

export const metadata: Metadata = { title: buildTitle("Payment Methods") };

function isApprover(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export default async function AdminPaymentAccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isApprover(session.user.role)) redirect("/admin/dashboard");

  const accounts = await getPaymentAccounts();

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Billing settings
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Payment methods</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Configure manual payment accounts shown to clients on invoices. Clients submit
          payment screenshots which you review before unlocking their completed files.
        </p>
      </section>

      <PaymentAccountsManager initialAccounts={accounts} />
    </div>
  );
}
