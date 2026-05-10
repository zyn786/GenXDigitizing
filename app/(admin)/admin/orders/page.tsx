import type { Route } from "next";

import { auth } from "@/auth";
import { AdminOrderQueue } from "@/components/workflow/admin-order-queue";
import { getAdminOrders } from "@/lib/workflow/repository";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function AdminOrdersPage() {
  const session = await auth();
  const designerId = session?.user?.role === "DESIGNER" ? session.user.id : undefined;
  const orders = await getAdminOrders(designerId);

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Operations queue</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Order Queue</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Active orders across all stages — from submission to delivery. Filter by status, search by client or order number.
        </p>
      </section>

      <AdminOrderQueue orders={orders} />
    </div>
  );
}
