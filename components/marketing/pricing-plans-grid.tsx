import { getPricingCatalog } from "@/lib/pricing/catalog";
import { PricingPlansGridClient } from "@/components/marketing/pricing-plans-grid-client";
import type { PricingTabCategory } from "@/components/marketing/pricing-plans-grid-client";

// Mark the middle tier (index 1) as popular when there are 3+ tiers.
function buildCategories(catalog: Awaited<ReturnType<typeof getPricingCatalog>>): PricingTabCategory[] {
  return catalog.categories.map((cat) => ({
    key: cat.key,
    label: cat.label,
    plans: cat.tiers.map((tier, i) => ({
      title: tier.label,
      price: `$${tier.price}`,
      popular: cat.tiers.length >= 3 && i === 1,
    })),
  }));
}

export async function PricingPlansGrid() {
  const catalog = await getPricingCatalog();
  const categories = buildCategories(catalog);

  return <PricingPlansGridClient categories={categories} />;
}
