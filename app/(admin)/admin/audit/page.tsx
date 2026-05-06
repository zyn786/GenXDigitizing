import type { Route } from "next";
import { BillingAuditViewer } from "@/components/admin/billing-audit-viewer";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AdminAuditPage() {
  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Audit</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Billing audit</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Audit Records</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Every billing mutation creates an immutable audit entry. Records require a SUPER_ADMIN authenticator-code unlock and expire after 5 minutes.
        </p>
      </section>

      <BillingAuditViewer />
    </div>
  );
}
