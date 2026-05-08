/* ── Order pricing estimate helper ─────────────────────────────
   Reusable across order wizard, auto-invoice, and pricing preview.
   Uses existing pricing config when available, safe defaults otherwise. */

import { getServiceByType } from "@/lib/quote-order/catalog";
import type { ServiceType } from "@/lib/quote-order/catalog";
import type { DesignPlacement } from "@prisma/client";

/* ── Types ──────────────────────────────────────────────────── */

export type OrderEstimateInput = {
  serviceType: string;
  placement?: DesignPlacement | string | null;
  designWidthIn?: number | null;
  designHeightIn?: number | null;
  quantity?: number;
  is3dPuff?: boolean;
  isJacketBack?: boolean;
  stitchCount?: number | null;
  turnaround?: "STANDARD" | "URGENT" | "SAME_DAY";
  colorCount?: number;
  isFirstOrder?: boolean;
  isAuthenticated?: boolean;
};

export type OrderEstimate = {
  baseAmount: number;
  addons: { label: string; amount: number }[];
  discounts: { label: string; amount: number }[];
  subtotal: number;
  total: number;
  currency: string;
  explanation: string[];
  isFirstOrderFreeApplied: boolean;
};

/* ── Defaults ───────────────────────────────────────────────── */

const MIN_PRICE = 10;
const STITCH_RATE_PER_1000 = 1.0;
const PUFF_ADDON = 10;
const PUFF_JACKET_BACK_BASE = 35;
const JACKET_BACK_BASE = 40;
const LARGE_DESIGN_BASE = 30;
const STANDARD_BASE = 20;
const SMALL_BASE = 15;

const TURNAROUND_FEES: Record<string, number> = {
  STANDARD: 0,
  URGENT: 12,
  SAME_DAY: 24,
};

const BULK_RULES = [
  { minQty: 5,  discountPercent: 5  },
  { minQty: 10, discountPercent: 10 },
  { minQty: 25, discountPercent: 15 },
  { minQty: 50, discountPercent: 20 },
];

/* ── Helpers ────────────────────────────────────────────────── */

function isSmallPlacement(placement: string | null | undefined): boolean {
  if (!placement) return true;
  const small = new Set([
    "LEFT_CHEST", "RIGHT_CHEST", "HAT_FRONT", "HAT_SIDE",
    "HAT_BACK", "POCKET", "SLEEVE_LEFT", "SLEEVE_RIGHT",
    "PUFF_LEFT_CHEST", "PUFF_HAT",
  ]);
  return small.has(placement);
}

function isLargePlacement(placement: string | null | undefined): boolean {
  if (!placement) return false;
  const large = new Set([
    "LARGE_DESIGN", "JACKET_BACK", "FULL_BACK", "FULL_FRONT",
    "PUFF_JACKET_BACK",
  ]);
  return large.has(placement);
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/* ── Main estimate function ─────────────────────────────────── */

export function estimateOrderPrice(
  input: OrderEstimateInput,
  configOverrides?: {
    stitchRatePer1000?: number;
    freeFirstDesignEnabled?: boolean;
    puffJacketBackBasePrice?: number;
    minPrice?: number;
  },
): OrderEstimate {
  const {
    serviceType,
    placement: rawPlacement,
    designWidthIn,
    designHeightIn,
    quantity = 1,
    is3dPuff = false,
    isJacketBack = false,
    stitchCount,
    turnaround = "STANDARD",
    colorCount = 1,
    isFirstOrder = false,
    isAuthenticated = false,
  } = input;

  const freeEnabled = configOverrides?.freeFirstDesignEnabled ?? true;
  const stitchRate = configOverrides?.stitchRatePer1000 ?? STITCH_RATE_PER_1000;
  const puffJBBase = configOverrides?.puffJacketBackBasePrice ?? PUFF_JACKET_BACK_BASE;
  const minPrice = configOverrides?.minPrice ?? MIN_PRICE;

  const addons: { label: string; amount: number }[] = [];
  const discounts: { label: string; amount: number }[] = [];
  const explanation: string[] = [];

  /* ── First order free ── */
  if (freeEnabled && isFirstOrder && isAuthenticated) {
    return {
      baseAmount: 0,
      addons: [],
      discounts: [{ label: "First order free (100%)", amount: 0 }],
      subtotal: 0,
      total: 0,
      currency: "USD",
      explanation: [
        "First order free — new client promotion applied.",
        "No payment required for this order.",
      ],
      isFirstOrderFreeApplied: true,
    };
  }

  /* ── 3D Puff Jacket Back ── */
  const placement = typeof rawPlacement === "string" ? rawPlacement : (rawPlacement ?? null);
  const is3dPuffJB = is3dPuff && isJacketBack && isLargePlacement(placement);

  if (is3dPuffJB) {
    const base = puffJBBase;
    const turnaroundFee = TURNAROUND_FEES[turnaround] ?? 0;
    const total = base + turnaroundFee;

    explanation.push(`3D Puff Jacket Back base price: ${formatCurrency(base)}`);
    if (turnaroundFee > 0) {
      addons.push({ label: `${turnaround} turnaround fee`, amount: turnaroundFee });
      explanation.push(`${turnaround} turnaround fee: ${formatCurrency(turnaroundFee)}`);
    }

    return {
      baseAmount: base,
      addons,
      discounts,
      subtotal: base,
      total,
      currency: "USD",
      explanation,
      isFirstOrderFreeApplied: false,
    };
  }

  /* ── Base price determination ── */
  let baseAmount: number;
  const service = (() => {
    try { return getServiceByType(serviceType as ServiceType); } catch { return null; }
  })();

  if (service) {
    baseAmount = service.basePrice;
    explanation.push(`Service base price (${service.label}): ${formatCurrency(baseAmount)}`);
  } else if (isLargePlacement(placement)) {
    baseAmount = isJacketBack ? JACKET_BACK_BASE : LARGE_DESIGN_BASE;
    explanation.push(`Estimated base (large placement): ${formatCurrency(baseAmount)}`);
  } else if (isSmallPlacement(placement)) {
    baseAmount = SMALL_BASE;
    explanation.push(`Estimated base (small placement): ${formatCurrency(baseAmount)}`);
  } else {
    baseAmount = STANDARD_BASE;
    explanation.push(`Estimated base (standard): ${formatCurrency(baseAmount)}`);
  }

  /* ── Stitch-count override ── */
  let stitchAdj = 0;
  if (stitchCount && stitchCount > 0) {
    stitchAdj = Math.round((stitchCount / 1000) * stitchRate * 100) / 100;
    if (stitchAdj > baseAmount) {
      baseAmount = stitchAdj;
      explanation.push(`Stitch-count pricing (${stitchCount.toLocaleString()} stitches at $${stitchRate}/1,000): ${formatCurrency(stitchAdj)}`);
    }
  }

  /* ── Size adjustment ── */
  let sizeAdj = 0;
  if (!stitchAdj && designWidthIn && designHeightIn) {
    const maxDim = Math.max(designWidthIn, designHeightIn);
    if (maxDim > 4) {
      sizeAdj = Math.round((maxDim - 4) * 2 * 100) / 100;
      addons.push({ label: `Size adjustment (${maxDim.toFixed(1)}")`, amount: sizeAdj });
      explanation.push(`Size adjustment: ${formatCurrency(sizeAdj)}`);
    }
  }

  /* ── 3D Puff addon (non-jacket-back) ── */
  if (is3dPuff && !is3dPuffJB) {
    addons.push({ label: "3D Puff digitizing add-on", amount: PUFF_ADDON });
    explanation.push(`3D Puff add-on: ${formatCurrency(PUFF_ADDON)}`);
  }

  /* ── Color quantity ── */
  let colorAdj = 0;
  if (colorCount > 4) {
    colorAdj = Math.round((colorCount - 4) * 1.5 * 100) / 100;
    addons.push({ label: `Extra colors (${colorCount - 4} over 4)`, amount: colorAdj });
    explanation.push(`Color adjustment (${colorCount} colors): ${formatCurrency(colorAdj)}`);
  }

  /* ── Turnaround ── */
  let turnaroundAdj = 0;
  if (turnaround && turnaround !== "STANDARD") {
    turnaroundAdj = TURNAROUND_FEES[turnaround] ?? 0;
    if (turnaroundAdj > 0) {
      addons.push({ label: `${turnaround} turnaround`, amount: turnaroundAdj });
      explanation.push(`Turnaround fee (${turnaround}): ${formatCurrency(turnaroundAdj)}`);
    }
  } else {
    explanation.push("Standard turnaround — no extra charge.");
  }

  /* ── Subtotal before discount ── */
  const subtotalBefore = baseAmount + sizeAdj + colorAdj + turnaroundAdj + (is3dPuff && !is3dPuffJB ? PUFF_ADDON : 0);

  /* ── Bulk discount ── */
  let discountPercent = 0;
  for (const rule of BULK_RULES) {
    if (quantity >= rule.minQty) discountPercent = rule.discountPercent;
  }

  let bulkDiscountAdj = 0;
  if (discountPercent > 0) {
    bulkDiscountAdj = Math.round(subtotalBefore * (discountPercent / 100) * 100) / 100;
    discounts.push({
      label: `Bulk discount (${quantity} units, ${discountPercent}%)`,
      amount: -bulkDiscountAdj,
    });
    explanation.push(`Bulk discount (${discountPercent}%): -${formatCurrency(bulkDiscountAdj)}`);
  }

  /* ── Final ── */
  const subtotal = Math.round(subtotalBefore * 100) / 100;
  let total = Math.round((subtotal + bulkDiscountAdj) * 100) / 100;
  if (total < minPrice) {
    explanation.push(`Minimum price floor applied: ${formatCurrency(minPrice)}`);
    total = minPrice;
  }

  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    addons,
    discounts,
    subtotal,
    total,
    currency: "USD",
    explanation,
    isFirstOrderFreeApplied: false,
  };
}

