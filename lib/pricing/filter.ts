import type { PricingCatalog } from "@/lib/pricing/catalog";

export const APPROVED_CATEGORY_KEYS = [
  "EMBROIDERY_DIGITIZING",
  "VECTOR_REDRAW",
  "DTF_SCREEN_PRINT",
] as const;

export const APPROVED_TIER_KEYS: Record<string, string[]> = {
  EMBROIDERY_DIGITIZING: ["standard", "large", "jumbo"],
  VECTOR_REDRAW:         ["basic", "standard", "complex"],
  DTF_SCREEN_PRINT:      ["single-color", "spot-color", "full-process"],
};

export function filterApprovedCatalog(catalog: PricingCatalog): PricingCatalog {
  return {
    ...catalog,
    categories: catalog.categories
      .filter((c) => (APPROVED_CATEGORY_KEYS as readonly string[]).includes(c.key))
      .map((c) => ({
        ...c,
        tiers: c.tiers.filter((t) => (APPROVED_TIER_KEYS[c.key] ?? []).includes(t.key)),
      }))
      .filter((c) => c.tiers.length > 0),
  };
}
