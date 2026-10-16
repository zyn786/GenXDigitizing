import { describe, it, expect } from "vitest";
import { readSourceStripped } from "./test-source";

/**
 * Copy that tells the opposite of what the code does.
 *
 * The enforced order flow is: work starts on submission with no payment and no
 * invoice; the invoice is created when the order reaches QA review, by which
 * point digitizing is already finished; payment gates the customer's DOWNLOAD.
 * Two notifications said otherwise — that work begins after payment, and that
 * payment makes an order ready for assignment — and both would have been read
 * by a customer or an admin as fact.
 *
 * This is a source scan rather than a route test because the strings are the
 * thing that drifted, and `lib/turnaround-claim.test.ts` already established
 * the pattern: a claim that was corrected once comes back the next time someone
 * edits the surrounding code.
 */

const read = (p: string) => readSourceStripped(p);

const INVOICE_STATUS = "app/api/invoices/[id]/status/route.ts";

describe("payment notifications describe what actually happens", () => {
  it("does not tell the customer work begins after payment", () => {
    // The invoice is created at QA review, after the digitizing is done.
    expect(read(INVOICE_STATUS)).not.toMatch(/Work will begin shortly/i);
  });

  it("does not tell admins payment makes an order ready for assignment", () => {
    // Assignment is `submitted -> assigned`, reachable with nothing paid.
    expect(read(INVOICE_STATUS)).not.toMatch(/ready for assignment/i);
  });

  it("says what payment actually unlocks — the download", () => {
    const src = read(INVOICE_STATUS);
    expect(src).toMatch(/ready to download/i);
    expect(src).toMatch(/can now download the output files/i);
  });
});

describe("payment does not move an order", () => {
  it("never resets an order to submitted on payment", () => {
    // This write discarded the assignment, the in-progress timestamp and the
    // QA sign-off of any order that was not already submitted/delivered/
    // cancelled/refunded, and there is no edge into `submitted` from those
    // states in the transition table — so it bypassed the state machine too.
    const src = read(INVOICE_STATUS);
    const orderWrites = src.match(/from\("orders"\)[\s\S]{0,200}?status:\s*"submitted"/g) ?? [];
    expect(orderWrites).toEqual([]);
  });

  it("keeps the download gate where it belongs — on the invoice, not the order", () => {
    // 006_payment_gating_rls.sql is what actually withholds the files.
    const rls = read("supabase/migrations/006_payment_gating_rls.sql");
    expect(rls).toMatch(/status\s*=\s*'paid'/);
  });
});

describe("the sales agent cites pages that say what it claims", () => {
  it("does not cite the refund policy for payment timing", () => {
    const policy = read("lib/ai/policy.ts");
    const timing = policy.slice(policy.indexOf('topic: "payment_timing"'));
    const block = timing.slice(0, timing.indexOf("},"));
    expect(block).not.toMatch(/refund-policy/);
  });

  it("cites pages that do state it", () => {
    expect(read("lib/ai/policy.ts")).toMatch(/Home page FAQ; \/pricing/);
  });

  it("is backed by real copy on those pages", () => {
    // If this wording is ever removed from the pages the citation names, the
    // agent's answer becomes unsupported again.
    expect(read("app/(marketing)/pricing/PricingContent.tsx")).toMatch(/Pay only when satisfied/i);
    expect(read("app/(marketing)/home/page.tsx")).toMatch(/pay when satisfied/i);
  });
});

describe("the refund policy does not promise to refund money never taken", () => {
  it("scopes the before-work refund to amounts actually paid", () => {
    const src = read("app/(marketing)/refund-policy/page.tsx");
    expect(src).toMatch(/100% refund of any amount paid toward it/i);
    // The old sentence implied a payment had been made by that point.
    expect(src).not.toMatch(/receive a <strong>100% refund<\/strong> at any time/);
  });
});
