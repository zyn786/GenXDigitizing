/* ── Server-only: estimate with live DB config ─────────────────
   Do NOT import this from client components. */

import { estimateOrderPrice, type OrderEstimateInput } from "@/lib/pricing/order-estimate";
import { getAllPricingConfig } from "@/lib/pricing/config";

export async function estimateOrderPriceWithConfig(
  input: OrderEstimateInput,
): Promise<ReturnType<typeof estimateOrderPrice>> {
  try {
    const config = await getAllPricingConfig();
    const stitchRate = parseFloat(config["stitch_rate_per_1000"] ?? "1.00");
    const freeEnabled = config["free_first_design_enabled"] === "true";
    const puffJBBase = parseFloat(config["puff_jacket_back_base_price"] ?? "35.00");

    return estimateOrderPrice(input, {
      stitchRatePer1000: stitchRate,
      freeFirstDesignEnabled: freeEnabled,
      puffJacketBackBasePrice: puffJBBase,
    });
  } catch {
    return estimateOrderPrice(input);
  }
}
