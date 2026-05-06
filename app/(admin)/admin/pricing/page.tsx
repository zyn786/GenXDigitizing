import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { DEFAULT_PRICING_CATALOG } from "@/lib/pricing/catalog";
import { PricingEditor } from "@/components/admin/pricing-editor";
import type { PricingCatalog } from "@/lib/pricing/catalog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Pricing") };

export default async function AdminPricingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") redirect("/admin/dashboard");

  const [categories, addons, delivery] = await Promise.all([
    prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { tiers: { orderBy: { sortOrder: "asc" } } } }),
    prisma.serviceAddon.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.deliveryOption.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const catalog: PricingCatalog = categories.length > 0
    ? {
        categories: categories.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji ?? "", description: c.description ?? "", isActive: c.isActive, tiers: c.tiers.map((t) => ({ key: t.key, label: t.label, price: Number(t.basePrice), isActive: t.isActive })) })),
        addons: addons.length > 0 ? addons.map((a) => ({ key: a.key, label: a.label, price: Number(a.price), isActive: a.isActive })) : DEFAULT_PRICING_CATALOG.addons,
        delivery: delivery.length > 0 ? delivery.map((d) => ({ key: d.key, label: d.label, subLabel: d.subLabel ?? "", extraPrice: Number(d.extraPrice), isActive: d.isActive })) : DEFAULT_PRICING_CATALOG.delivery,
      }
    : DEFAULT_PRICING_CATALOG;

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Pricing</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Pricing governance</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Pricing</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Edit service tiers, base prices, add-on rates, and delivery speed pricing. Changes reflect immediately on client forms.
        </p>
      </section>

      <PricingEditor initialCatalog={catalog} />
    </div>
  );
}
