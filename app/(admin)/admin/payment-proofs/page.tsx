import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { buildTitle } from "@/lib/site";
import { getPaymentProofs } from "@/lib/payments/repository";
import { PaymentProofsManager } from "@/components/admin/payment-proofs-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Payment Proofs") };

function isApprover(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export default async function AdminPaymentProofsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isApprover(session.user.role)) redirect("/admin/dashboard");

  const proofs = await getPaymentProofs();
  const pendingCount = proofs.filter((p) => p.status === "PENDING").length;

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Payment Proofs</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Billing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Payment Proofs
          {pendingCount > 0 && (
            <span className="ml-3 inline-flex h-7 items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 text-lg font-semibold text-amber-600 dark:text-amber-400">
              {pendingCount} pending
            </span>
          )}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review payment screenshots submitted by clients. Approving a proof marks the invoice as paid and unlocks completed files for download.
        </p>
      </section>

      <PaymentProofsManager initialProofs={proofs} />
    </div>
  );
}
