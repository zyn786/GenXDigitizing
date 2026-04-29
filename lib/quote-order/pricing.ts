import type { QuoteOrderInput } from "@/schemas/quote-order";
import { getServiceByType, getPlacementMeta } from "@/lib/quote-order/catalog";

type PricingBreakdown = {
  base: number;
  quantityAdj: number;
  sizeAdj: number;
  colorAdj: number;
  complexityAdj: number;
  extras: number;
  turnaroundAdj: number;
  stitchAdj: number;
  bulkDiscountAdj: number;
  placementSurcharge: number;
};

export type QuotePricing = {
  subtotal: number;
  total: number;
  breakdown: PricingBreakdown;
  isFreeDesign: boolean;
  discountPercent: number;
};

const complexityMap = { LOW: 0, MEDIUM: 6, HIGH: 14 } as const;
const turnaroundMap = { STANDARD: 0, URGENT: 12, SAME_DAY: 24 } as const;

const DEFAULT_STITCH_RATE = 1.0;
const DEFAULT_BULK_RULES = [
  { minQty: 5,  discountPercent: 5  },
  { minQty: 10, discountPercent: 10 },
  { minQty: 25, discountPercent: 15 },
  { minQty: 50, discountPercent: 20 },
];
const PUFF_JACKET_BACK_SURCHARGE = 23;

export type PricingOptions = {
  stitchRatePer1000?: number;
  stitchPricingEnabled?: boolean;
  bulkRules?: Array<{ minQty: number; discountPercent: number }>;
  freeFirstDesign?: boolean;
  isFirstOrder?: boolean;
  puffJacketBackBasePrice?: number;
};

export function computeQuotePricing(
  input: QuoteOrderInput,
  opts: PricingOptions = {}
): QuotePricing {
  const {
    stitchRatePer1000 = DEFAULT_STITCH_RATE,
    stitchPricingEnabled = true,
    bulkRules = DEFAULT_BULK_RULES,
    freeFirstDesign = false,
    isFirstOrder = false,
    puffJacketBackBasePrice = 35,
  } = opts;

  const service = getServiceByType(input.serviceType);
  const placement = input.placement ? getPlacementMeta(input.placement) : null;

  // Free first design
  if (freeFirstDesign && isFirstOrder && input.mode === "order") {
    return {
      subtotal: 0, total: 0, isFreeDesign: true, discountPercent: 100,
      breakdown: {
        base: 0, quantityAdj: 0, sizeAdj: 0, colorAdj: 0,
        complexityAdj: 0, extras: 0, turnaroundAdj: 0,
        stitchAdj: 0, bulkDiscountAdj: 0, placementSurcharge: 0,
      },
    };
  }

  // 3D Puff Jacket Back = separate premium service
  const is3dPuffJB = input.is3dPuffJacketBack || placement?.is3DPuffJacketBack;
  if (is3dPuffJB) {
    const base = puffJacketBackBasePrice;
    const turnaroundAdj = turnaroundMap[input.turnaround];
    const total = Math.round((base + turnaroundAdj) * 100) / 100;
    return {
      subtotal: base, total, isFreeDesign: false, discountPercent: 0,
      breakdown: {
        base, quantityAdj: 0, sizeAdj: 0, colorAdj: 0,
        complexityAdj: 0, extras: 0, turnaroundAdj,
        stitchAdj: 0, bulkDiscountAdj: 0, placementSurcharge: 0,
      },
    };
  }

  const base = service.basePrice;

  // Quantity adjustment (patches only by default)
  const quantityAdj =
    input.serviceType === "CUSTOM_PATCHES"
      ? input.quantity >= 250 ? 18 : input.quantity >= 100 ? 10 : 0
      : 0;

  // Stitch-count pricing: if stitch count provided and enabled, override sizeAdj
  let sizeAdj = 0;
  let stitchAdj = 0;
  if (stitchPricingEnabled && input.stitchCount && input.stitchCount > 0) {
    stitchAdj = Math.round(((input.stitchCount / 1000) * stitchRatePer1000) * 100) / 100;
  } else {
    sizeAdj = input.sizeInches > 4 ? (input.sizeInches - 4) * 2 : 0;
  }

  const colorAdj = input.colorCount > 4 ? (input.colorCount - 4) * 1.5 : 0;
  const complexityAdj = complexityMap[input.complexity];

  let extras = 0;
  if (input.sourceCleanup) extras += 8;
  if (input.smallText) extras += 6;
  if (input.threeDPuff && !is3dPuffJB) extras += 10;

  const turnaroundAdj = turnaroundMap[input.turnaround];

  // Placement surcharge: Large/Jacket Back add a premium
  let placementSurcharge = 0;
  if (placement) {
    if (["LARGE_DESIGN", "JACKET_BACK"].includes(placement.value)) {
      placementSurcharge = 8;
    } else if (["FULL_BACK", "FULL_FRONT"].includes(placement.value)) {
      placementSurcharge = 15;
    }
  }

  const subtotalBeforeDiscount =
    base + quantityAdj + sizeAdj + stitchAdj + colorAdj +
    complexityAdj + extras + placementSurcharge;

  // Bulk discount
  let discountPercent = 0;
  const sortedRules = [...bulkRules].sort((a, b) => a.minQty - b.minQty);
  for (const rule of sortedRules) {
    if (input.quantity >= rule.minQty) discountPercent = rule.discountPercent;
  }

  const bulkDiscountAdj = discountPercent > 0
    ? -Math.round(subtotalBeforeDiscount * (discountPercent / 100) * 100) / 100
    : 0;

  const subtotal = Math.round((subtotalBeforeDiscount + bulkDiscountAdj) * 100) / 100;
  const total = Math.round((subtotal + turnaroundAdj) * 100) / 100;

  return {
    subtotal,
    total,
    isFreeDesign: false,
    discountPercent,
    breakdown: {
      base,
      quantityAdj,
      sizeAdj,
      colorAdj,
      complexityAdj,
      extras,
      turnaroundAdj,
      stitchAdj,
      bulkDiscountAdj,
      placementSurcharge,
    },
  };
}
