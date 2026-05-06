import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { CouponsManager } from "@/components/admin/coupons-manager";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Coupons") };

export default async function AdminCouponsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER" && role !== "MARKETING") redirect("/admin/dashboard");

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, role: true } }, approvedBy: { select: { name: true } } },
  });

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Coupons</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Promotions</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Coupons</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage discount codes. Marketing-created codes require admin approval before going live.
        </p>
      </section>

      <CouponsManager initialCoupons={coupons} userRole={role ?? ""} />
    </div>
  );
}
