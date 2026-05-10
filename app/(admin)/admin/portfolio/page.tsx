import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { PortfolioManager } from "@/components/admin/portfolio-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Portfolio") };

export default async function AdminPortfolioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await prisma.portfolioItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } }, images: true },
  });

  const pendingCount = items.filter((i) => i.approvalStatus === "PENDING_APPROVAL").length;

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Portfolio</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Content management</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Portfolio</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Add, edit, feature, hide, or delete portfolio items.
          {session.user.role !== "SUPER_ADMIN" && " Uploaded items are sent for Super Admin review before appearing publicly."}
        </p>
        {pendingCount > 0 && session.user.role === "SUPER_ADMIN" && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            {pendingCount} item{pendingCount !== 1 ? "s" : ""} pending approval
          </p>
        )}
      </section>

      <PortfolioManager initialItems={items} userRole={session.user.role ?? "MANAGER"} />
    </div>
  );
}
