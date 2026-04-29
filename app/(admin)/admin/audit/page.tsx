import { BillingAuditViewer } from "@/components/admin/billing-audit-viewer";

export default function AdminAuditPage() {
  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Billing audit
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Audit records
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Every billing mutation — invoices sent, payments recorded, discounts applied, proofs
          approved — creates an immutable audit entry. These records require a SUPER_ADMIN
          authenticator-code unlock and expire after 5 minutes.
        </p>
      </section>

      <BillingAuditViewer />
    </div>
  );
}
