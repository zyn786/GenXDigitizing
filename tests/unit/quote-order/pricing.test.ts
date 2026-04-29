import { describe, expect, it } from "vitest";
import { computeQuotePricing } from "@/lib/quote-order/pricing";

const BASE_INPUT = {
  mode: "quote" as const,
  serviceType: "EMBROIDERY_DIGITIZING" as const,
  nicheSlug: "left-chest-logo",
  turnaround: "STANDARD" as const,
  customerName: "Avery",
  email: "avery@example.com",
  companyName: "",
  designTitle: "Logo",
  notes: "",
  quantity: 1,
  sizeInches: 4,
  colorCount: 4,
  complexity: "MEDIUM" as const,
  sourceCleanup: false,
  smallText: false,
  threeDPuff: false,
  is3dPuffJacketBack: false,
  fileFormats: [] as string[],
};

describe("computeQuotePricing", () => {
  it("prices a standard embroidery quote", () => {
    const result = computeQuotePricing(BASE_INPUT as never);

    expect(result.total).toBe(18);
    expect(result.breakdown.base).toBe(12);
    expect(result.breakdown.complexityAdj).toBe(6);
    expect(result.isFreeDesign).toBe(false);
  });

  it("adds patch quantity and rush modifiers", () => {
    const result = computeQuotePricing({
      ...BASE_INPUT,
      mode: "order" as const,
      serviceType: "CUSTOM_PATCHES" as const,
      nicheSlug: "chenille-patches",
      turnaround: "URGENT" as const,
      quantity: 250,
      sizeInches: 6,
      colorCount: 6,
      complexity: "HIGH" as const,
      sourceCleanup: true,
    } as never);

    expect(result.breakdown.quantityAdj).toBe(18);
    expect(result.breakdown.turnaroundAdj).toBe(12);
    expect(result.total).toBeGreaterThan(60);
  });

  it("uses stitch-count pricing when provided", () => {
    const result = computeQuotePricing(
      { ...BASE_INPUT, stitchCount: 10000 } as never,
      { stitchPricingEnabled: true, stitchRatePer1000: 1.0 }
    );
    expect(result.breakdown.stitchAdj).toBe(10);
    expect(result.breakdown.sizeAdj).toBe(0);
  });

  it("returns free design for first order when enabled", () => {
    const result = computeQuotePricing(
      { ...BASE_INPUT, mode: "order" as const } as never,
      { freeFirstDesign: true, isFirstOrder: true }
    );
    expect(result.isFreeDesign).toBe(true);
    expect(result.total).toBe(0);
  });

  it("applies bulk discount for large quantity", () => {
    const result = computeQuotePricing(
      { ...BASE_INPUT, quantity: 10 } as never,
      {
        bulkRules: [
          { minQty: 5, discountPercent: 5 },
          { minQty: 10, discountPercent: 10 },
        ],
      }
    );
    expect(result.discountPercent).toBe(10);
    expect(result.breakdown.bulkDiscountAdj).toBeLessThan(0);
  });

  it("treats 3D Puff Jacket Back as flat rate premium service", () => {
    const result = computeQuotePricing(
      { ...BASE_INPUT, placement: "PUFF_JACKET_BACK", is3dPuffJacketBack: true } as never,
      { puffJacketBackBasePrice: 35 }
    );
    expect(result.breakdown.base).toBe(35);
    expect(result.isFreeDesign).toBe(false);
  });
});
