import { describe, expect, it } from "vitest";

import {
  defaultReminderRules,
  getAudiencesForEvent,
  getRulesForEvent,
} from "@/lib/notifications/rules";

describe("notification rules", () => {
  it("returns rule set for proof ready", () => {
    const rules = getRulesForEvent("PROOF_READY");
    expect(rules.length).toBeGreaterThan(0);
  });

  it("includes client audience for invoice overdue", () => {
    const audiences = getAudiencesForEvent("INVOICE_OVERDUE");
    expect(audiences).toContain("CLIENT");
  });

  it("keeps defaults enabled", () => {
    expect(defaultReminderRules.every((rule) => rule.enabled)).toBe(true);
  });
});
