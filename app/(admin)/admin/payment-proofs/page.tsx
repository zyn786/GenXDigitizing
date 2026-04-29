import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buildTitle } from "@/lib/site";
import { getPaymentProofs } from "@/lib/payments/repository";
import { PaymentProofsManager } from "@/components/admin/payment-proofs-manager";

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
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Billing
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Payment proofs
          {pendingCount > 0 && (
            <span className="ml-3 inline-flex h-7 items-center rounded-full bg-amber-500/15 px-3 text-lg font-semibold text-amber-400">
              {pendingCount} pending
            </span>
          )}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Review payment screenshots submitted by clients. Approving a proof marks the invoice
          as paid and unlocks completed files for download.
        </p>
      </section>

      <PaymentProofsManager initialProofs={proofs} />
    </div>
  );
}
