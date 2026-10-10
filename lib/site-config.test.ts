import { describe, it, expect } from "vitest";
import { SITE_CLAIMS, SITE_CLAIM_TAGS, TURNAROUND_RANGE_LABEL } from "./site-config";
import { TURNAROUND_HOURS, BIG_DESIGN_HOURS } from "./sla";

/**
 * The site promised "12-hour turnaround" in about twenty places while the
 * scheduler allowed 24, so the marketing claim and the enforced deadline were
 * different numbers for the same thing. These tests exist so that cannot happen
 * again silently.
 */
describe("turnaround claim vs scheduler", () => {
  it("advertises the range the tiers actually cover", () => {
    const fastest = Math.min(...Object.values(TURNAROUND_HOURS));
    const slowest = Math.max(...Object.values(TURNAROUND_HOURS));
    expect(TURNAROUND_RANGE_LABEL).toBe(`${fastest}–${slowest}h`);
  });

  it("uses that same range as the published claim", () => {
    expect(SITE_CLAIMS.turnaround.value).toBe(TURNAROUND_RANGE_LABEL);
  });

  it("does not advertise an hour inside the range that no tier delivers", () => {
    // The old claim was a flat "12h" — not the standard window (24) and not the
    // urgent one (3). A range is only honest if the endpoints are real tiers.
    const hours = Object.values(TURNAROUND_HOURS);
    const [, low, high] = TURNAROUND_RANGE_LABEL.match(/^(\d+)–(\d+)h$/)!.map(Number);
    expect(hours).toContain(low);
    expect(hours).toContain(high);
  });

  it("keeps large designs as the 12-hour exception, and says so separately", () => {
    // BIG_DESIGN_HOURS is deliberately shorter than standard — the counter-
    // intuitive rule documented in lib/sla.ts. If that ever changes, the "~12h"
    // claims on jumbo/full-back copy become wrong.
    expect(BIG_DESIGN_HOURS).toBe(12);
    expect(BIG_DESIGN_HOURS).not.toBe(TURNAROUND_HOURS.standard);
  });
});

describe("claim tags", () => {
  it("carries no stale 12-hour turnaround claim", () => {
    for (const tag of SITE_CLAIM_TAGS) {
      expect(tag).not.toMatch(/12-hour turnaround/i);
    }
  });

  it("uses the shared range constant rather than a hardcoded string", () => {
    expect(SITE_CLAIM_TAGS.some((t) => t.includes(TURNAROUND_RANGE_LABEL))).toBe(true);
  });
});
