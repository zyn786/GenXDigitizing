/**
 * The business policies the assistant is allowed to state.
 *
 * The drafting prompt told the model to "state the actual sample policy" while
 * giving it no source for one — so the model did the only thing it could and
 * invented it. The prompt also forbids guessing about refunds, guarantees and
 * deadlines, which left it contradicting itself on exactly the questions where
 * a wrong answer costs money.
 *
 * Every entry below is something GenX already publishes to customers, and each
 * one names where it is published. Nothing here is new policy: this file moves
 * existing public statements into a form the assistant can cite. If a policy
 * changes on the site, it changes here too — the two must not disagree.
 *
 * Anything NOT in this file is not answerable. The tool tells the model to say
 * a human will confirm, which is the honest answer, rather than filling the gap
 * with something plausible.
 *
 * Prices and turnaround windows are deliberately absent — they come from the
 * live service_tiers table and lib/sla.ts respectively, which are already the
 * source of truth for those.
 */

import { TURNAROUND_HOURS, BIG_DESIGN_HOURS } from "@/lib/sla";
import { SITE_CLAIMS } from "@/lib/site-config";

export interface PolicyEntry {
  /** Short key the model can ask for. */
  topic: string;
  /** The statement, phrased as it may be told to a customer. */
  statement: string;
  /** Where the business publishes it — so a human can check the two agree. */
  publishedAt: string;
}

export const BUSINESS_POLICIES: PolicyEntry[] = [
  {
    topic: "revisions",
    statement:
      "Revisions are unlimited and free. We keep revising until the file runs cleanly on your machine — there is no cap and no extra charge.",
    publishedAt: "Home page FAQ and every service page; lib/site-config.ts",
  },
  {
    topic: "free_sample",
    statement:
      "One free sample: upload your logo and we digitize it at no cost, with no payment details required. This is offered once per customer, not per design.",
    publishedAt: "components/marketing/FreeSampleBanner.tsx",
  },
  {
    topic: "refund_before_work",
    statement:
      "You can cancel and get a 100% refund at any time before work on your order has begun.",
    publishedAt: "/refund-policy, section 1",
  },
  {
    topic: "refund_quality",
    statement:
      "If the file still does not meet your requirements after reasonable revision attempts — typically 2–3 rounds addressing specific, actionable feedback — you may be eligible for a refund.",
    publishedAt: "/refund-policy, section 2",
  },
  {
    topic: "payment_timing",
    statement:
      "You pay only after you have seen and approved the preview. No payment is required to get a quote or a proof.",
    publishedAt: "Home page and service pages; /refund-policy",
  },
  {
    topic: "turnaround",
    statement:
      `Exactly one of these applies to any given order — quote the one that matches and never combine them into a range: ` +
      `Standard is ${TURNAROUND_HOURS.standard} hours. Rush is ${TURNAROUND_HOURS.rush} hours. Urgent is ${TURNAROUND_HOURS.urgent} hours. ` +
      `A large or complex design (jumbo, full back, complex vector) is quoted at ${BIG_DESIGN_HOURS} hours regardless of the speed chosen, because that rule replaces the others.`,
    publishedAt: "lib/sla.ts; /terms-and-conditions",
  },
  {
    topic: "turnaround_guarantee",
    statement:
      "Turnaround targets are what we schedule and consistently meet, but the terms state they are not a guarantee. Never promise a guaranteed delivery time.",
    publishedAt: "/terms-and-conditions, delivery section",
  },
  {
    topic: "pricing_model",
    // Deliberately carries NO figure. Putting "$7" here would give the model a
    // second, hardcoded price source alongside the live lookup — and if the
    // prices in service_tiers ever changed, this sentence would keep quoting
    // the old one. Every number a customer sees must come from
    // get_service_prices, which reads the database.
    statement:
      "There is a standard per-design price, with volume discounts at 5+ and 10+ designs. The figure for any specific design must come from get_service_prices, which reads the live pricing configuration — never state a price that did not come from there.",
    publishedAt: "/pricing; lib/supabase (service_tiers) is the source of truth",
  },
  {
    topic: "file_formats",
    statement: `${SITE_CLAIMS.formats.value} machine formats are supported, and format conversion is free.`,
    publishedAt: "lib/site-config.ts; home page FAQ",
  },
];

/** Everything the assistant may state, as one block for the model. */
export function renderPolicyForModel(): string {
  return BUSINESS_POLICIES.map((p) => `- [${p.topic}] ${p.statement}`).join("\n");
}

/** Compare topics ignoring case, spaces, hyphens and underscores. */
function normaliseTopic(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Look up one topic. Returns null when the question has no published answer —
 * which the tool turns into "I'll check with the team", never a guess.
 */
export function findPolicy(topic: string): PolicyEntry | null {
  const key = normaliseTopic(topic);
  // Every string contains "", so an empty query would otherwise match the first
  // policy and the assistant would answer an unknown question with it.
  if (!key) return null;

  const exact = BUSINESS_POLICIES.find((p) => normaliseTopic(p.topic) === key);
  if (exact) return exact;

  // Partial matching helps with the way a question is actually phrased
  // ("sample", "refund"), but a very short key matches almost anything, so it
  // is not attempted.
  if (key.length < 4) return null;
  return (
    BUSINESS_POLICIES.find((p) => normaliseTopic(p.topic).includes(key)) ??
    BUSINESS_POLICIES.find((p) => key.includes(normaliseTopic(p.topic))) ??
    null
  );
}

/**
 * The exact wording the model must fall back to. Kept here rather than in the
 * prompt so the tool and the prompt cannot drift apart.
 */
export const POLICY_UNKNOWN_REPLY =
  "I don't have that confirmed, so I won't guess — I'll check with the team and come back to you.";
