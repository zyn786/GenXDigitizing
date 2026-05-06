import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { buildTitle } from "@/lib/site";
import { getPaymentAccounts } from "@/lib/payments/repository";
import { PaymentAccountsManager } from "@/components/admin/payment-accounts-manager";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Payment Methods</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Billing settings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Payment Methods</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Configure manual payment accounts shown to clients on invoices. Clients submit payment screenshots which you review before unlocking files.
        </p>
      </section>

      <PaymentAccountsManager initialAccounts={accounts} />
    </div>
  );
}
