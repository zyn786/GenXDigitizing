import { describe, it, expect } from "vitest";
import { PLAN_CONFIG, getCreditCost } from "./plans";

/**
 * `service_tiers.credit_cost` existed only in application code until migration
 * 056 created it, so these paths ran on `undefined` for their whole life. They
 * are the contract the admin pricing panel now writes against — a blank field
 * stores NULL and must land exactly where `undefined` used to.
 */
describe("getCreditCost", () => {
  it("treats NULL and undefined the same — the plan's own cost", () => {
    for (const plan of Object.keys(PLAN_CONFIG)) {
      expect(getCreditCost(plan, true, null)).toBe(getCreditCost(plan, true, undefined));
    }
  });

  it("uses a per-tier override when one is set", () => {
    expect(getCreditCost("starter", true, 5)).toBe(5);
    expect(getCreditCost("starter", false, 5)).toBe(5);
  });

  it("ignores a value the column's CHECK should have prevented", () => {
    // 0 and negatives cannot reach the column (056 rejects them), but if they
    // ever did, falling through to the plan default is the safe reading —
    // treating 0 as "free" would hand out designs for nothing.
    expect(getCreditCost("starter", false, 0)).toBe(getCreditCost("starter", false));
    expect(getCreditCost("starter", false, -3)).toBe(getCreditCost("starter", false));
  });

  it("still charges the plan's big-design rate when there is no override", () => {
    const plan = Object.keys(PLAN_CONFIG)[0];
    expect(getCreditCost(plan, true)).toBe(PLAN_CONFIG[plan].creditCostBigDesign);
  });

  it("falls back to something sane for a plan it does not know", () => {
    // A retired plan name must not produce NaN or undefined on an invoice.
    const cost = getCreditCost("plan-that-no-longer-exists", true);
    expect(Number.isFinite(cost)).toBe(true);
    expect(cost).toBeGreaterThanOrEqual(1);
  });
});
