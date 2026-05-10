import { prisma } from "@/lib/db";

export const PRICING_CONFIG_KEYS = {
  STITCH_RATE_PER_1000: "stitch_rate_per_1000",
  FREE_FIRST_DESIGN_ENABLED: "free_first_design_enabled",
  PUFF_JACKET_BACK_BASE_PRICE: "puff_jacket_back_base_price",
  STITCH_PRICING_ENABLED: "stitch_pricing_enabled",
  DEFAULT_TAX_PERCENT: "default_tax_percent",
} as const;

const DEFAULTS: Record<string, string> = {
  stitch_rate_per_1000: "1.00",
  free_first_design_enabled: "true",
  puff_jacket_back_base_price: "35.00",
  stitch_pricing_enabled: "true",
  default_tax_percent: "0",
};

type ConfigRecord = { key: string; value: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function getAllPricingConfig(): Promise<Record<string, string>> {
  try {
    const records: ConfigRecord[] = await db.pricingConfig.findMany();
    const map: Record<string, string> = { ...DEFAULTS };
    for (const r of records) map[r.key] = r.value;
    return map;
  } catch {
    return { ...DEFAULTS };
  }
}

type BulkRule = { id: string; minQty: number; discountPercent: { toNumber(): number } | number; isActive: boolean };

export async function getActiveBulkDiscountRules(): Promise<BulkRule[]> {
  try {
    return await db.bulkDiscountRule.findMany({
      where: { isActive: true },
      orderBy: { minQty: "asc" },
    });
  } catch {
    return [];
  }
}

export function applyBulkDiscount(
  subtotal: number,
  quantity: number,
  rules: Array<{ minQty: number; discountPercent: number | { toNumber(): number } }>
): { discountedTotal: number; discountPercent: number } {
  let discountPercent = 0;
  for (const rule of rules) {
    const pct = typeof rule.discountPercent === "number"
      ? rule.discountPercent
      : rule.discountPercent.toNumber();
    if (quantity >= rule.minQty) discountPercent = pct;
  }
  const discountedTotal = subtotal * (1 - discountPercent / 100);
  return { discountedTotal, discountPercent };
}
