import { describe, it, expect } from "vitest";
import {
  BUSINESS_POLICIES,
  POLICY_UNKNOWN_REPLY,
  findPolicy,
  renderPolicyForModel,
} from "./policy";
import { TURNAROUND_HOURS, BIG_DESIGN_HOURS } from "@/lib/sla";
import { SITE_CLAIMS } from "@/lib/site-config";

describe("business policy source", () => {
  it("keeps every claim traceable to where it is published", () => {
    for (const p of BUSINESS_POLICIES) {
      expect(p.topic).toBeTruthy();
      expect(p.statement.length).toBeGreaterThan(20);
      // A policy with no published home cannot be checked by a human later.
      expect(p.publishedAt).toBeTruthy();
    }
  });

  it("never lets turnaround drift from the value the system schedules", () => {
    // The whole point of moving policy out of the prompt: if someone changes
    // the SLA window, the sentence the assistant may say changes with it.
    const t = findPolicy("turnaround");
    expect(t).not.toBeNull();
    expect(t!.statement).toContain(`${TURNAROUND_HOURS.standard} hours`);
    expect(t!.statement).toContain(`${TURNAROUND_HOURS.rush} hours`);
    expect(t!.statement).toContain(`${TURNAROUND_HOURS.urgent} hours`);
    expect(t!.statement).toContain(`${BIG_DESIGN_HOURS} hours`);
  });

  it("carries no price figure at all, so the live lookup stays the only source", () => {
    // Putting a figure here would give the model a second, hardcoded price
    // source; if service_tiers changed, this sentence would keep quoting the
    // old one. A live draft test caught the model doing exactly that.
    const p = findPolicy("pricing_model");
    expect(p!.statement).not.toMatch(/\$\s?\d/);
    expect(p!.statement).toContain("get_service_prices");
  });

  it("states turnaround as alternatives, never as a combined range", () => {
    // A live draft returned "about 12–24 hours" — a number that exists nowhere
    // in the data — because the statement listed four figures without saying
    // they were alternatives. It now says so explicitly.
    const t = findPolicy("turnaround")!;
    expect(t.statement).toMatch(/never combine them into a range/i);
    expect(t.statement).not.toMatch(/\d+\s*[–-]\s*\d+\s*hours/i);
  });

  it("says out loud that turnaround is not a guarantee", () => {
    // The terms disclaim the guarantee; the site once promised one. The
    // assistant must not be the third version of this.
    const g = findPolicy("turnaround_guarantee");
    expect(g!.statement).toMatch(/not a guarantee/i);
  });

  it("has policies for the questions that cost money when guessed", () => {
    for (const topic of ["free_sample", "refund_before_work", "refund_quality", "revisions"]) {
      expect(findPolicy(topic)).not.toBeNull();
    }
  });

  it("resolves topics the model is likely to phrase differently", () => {
    expect(findPolicy("sample")?.topic).toBe("free_sample");
    expect(findPolicy("Refund")?.topic).toBe("refund_before_work");
    expect(findPolicy("turn-around")?.topic).toBe("turnaround");
  });

  it("returns null rather than a guess for an unpublished question", () => {
    expect(findPolicy("do you offer net 30 payment terms")).toBeNull();
    expect(findPolicy("")).toBeNull();
  });

  it("tells the model to defer instead of inventing", () => {
    expect(POLICY_UNKNOWN_REPLY).toMatch(/won't guess/i);
  });

  it("renders every topic for the prompt", () => {
    const rendered = renderPolicyForModel();
    for (const p of BUSINESS_POLICIES) expect(rendered).toContain(p.topic);
  });
});
