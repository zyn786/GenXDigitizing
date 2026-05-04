import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { PricingConfigEditor } from "@/components/admin/pricing-config-editor";
import { buildTitle } from "@/lib/site";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Pricing Config") };

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);

export default async function PricingConfigPage() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) redirect("/admin/dashboard");

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Pricing Config</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Pricing governance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Pricing Configuration</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Control stitch-plan pricing rates, bulk discounts, free-first-design rules, and special service pricing.
        </p>
      </section>

      <PricingConfigEditor />
    </div>
  );
}
