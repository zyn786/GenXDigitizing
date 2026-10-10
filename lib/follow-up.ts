/**
 * When to chase a lead, and when to stop.
 *
 * Nothing on a schedule has ever looked at a lead. A lead that goes quiet is
 * never surfaced, so "follow up in three days" is a person remembering — and
 * when the team is busy, they don't. This is the rule the engine runs on.
 *
 * The delays are the same ones the admin attention panel already uses
 * (lib/lead-timing.ts), imported rather than restated: a dashboard that
 * says "quotes waiting" and an engine that chases on a different schedule would
 * disagree with each other, which is exactly the drift that made the turnaround
 * claim wrong in twenty places.
 *
 * Pure and dependency-free. No clock, no database — every function takes `now`
 * so the behaviour at a boundary is testable rather than hopeful.
 */

import { QUOTE_CHASE_MS, STALE_LEAD_MS } from "@/lib/lead-timing";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * How long to wait, per stage, before chasing.
 *
 * A brand-new lead gets the shortest delay because it is the most valuable
 * moment: someone who asked a question minutes ago is still looking at their
 * screen. A contacted lead has already heard from us once, so the second touch
 * can wait.
 */
export const FOLLOW_UP_DELAY_MS = {
  /** Enquiry arrived, nobody has replied yet. */
  lead: 4 * HOUR,
  /** We replied; they have not. */
  contacted: STALE_LEAD_MS, // 3 days
  /** A quote is out; that is the one worth chasing hardest. */
  quote_sent: QUOTE_CHASE_MS, // 2 days
  negotiation: STALE_LEAD_MS,
} as const;

export type FollowUpStage = keyof typeof FOLLOW_UP_DELAY_MS;

/**
 * How many times the engine may chase without a human involved.
 *
 * Two. Beyond that it stops and hands the lead to a person — an automated
 * system that keeps mailing someone who has stopped answering is spam, and the
 * customer is entitled to be left alone.
 */
export const MAX_AUTOMATED_FOLLOW_UPS = 2;

/** Stages where chasing is still appropriate. Terminal stages are excluded. */
const CHASEABLE_STAGES: string[] = ["lead", "contacted", "quote_sent", "negotiation"];

export function isChaseableStage(stage: string | null | undefined): stage is FollowUpStage {
  return typeof stage === "string" && stage in FOLLOW_UP_DELAY_MS;
}

/** When the next follow-up is due, given the stage and when it was entered. */
export function nextFollowUpAt(stage: string, from: Date | number = Date.now()): Date | null {
  if (!isChaseableStage(stage)) return null;
  const fromMs = from instanceof Date ? from.getTime() : from;
  return new Date(fromMs + FOLLOW_UP_DELAY_MS[stage]);
}

export type FollowUpDecision =
  | { action: "send"; dueAt: Date }
  | { action: "wait"; dueAt: Date }
  | { action: "hand_to_human"; reason: string }
  | { action: "skip"; reason: string };

export interface FollowUpInput {
  stage: string | null | undefined;
  /** The stored due date, if any. Null means nobody ever set one. */
  followUpAt: string | Date | null | undefined;
  /** How many automated follow-ups have already gone out. */
  attempts: number;
  now?: number;
}

/**
 * Decide what to do with one lead.
 *
 * Returns an explicit reason for every non-send outcome. A silent skip is how a
 * lead disappears: the engine would look like it was working while quietly
 * doing nothing.
 */
export function decideFollowUp(input: FollowUpInput): FollowUpDecision {
  const now = input.now ?? Date.now();

  if (!isChaseableStage(input.stage)) {
    return { action: "skip", reason: `stage "${input.stage ?? "unknown"}" is not chased` };
  }

  if (input.attempts >= MAX_AUTOMATED_FOLLOW_UPS) {
    // Not "skip" — this one needs a person, and saying so is the point.
    return {
      action: "hand_to_human",
      reason: `${input.attempts} automated follow-ups already sent with no reply`,
    };
  }

  if (!input.followUpAt) {
    // No due date was ever set. Rather than guessing one, ask for it to be set:
    // a lead created before this engine existed must not be mailed on a
    // schedule nobody chose.
    return { action: "skip", reason: "no follow-up date set" };
  }

  const due = input.followUpAt instanceof Date ? input.followUpAt : new Date(input.followUpAt);
  if (!Number.isFinite(due.getTime())) {
    return { action: "skip", reason: "follow-up date is not a valid date" };
  }

  if (due.getTime() > now) {
    return { action: "wait", dueAt: due };
  }

  return { action: "send", dueAt: due };
}

/**
 * The dedupe key for one follow-up.
 *
 * The cron can overlap with a retry, and Vercel can invoke it twice. Writing
 * this value into a unique column is what makes a second attempt a no-op
 * instead of a second email to the same customer.
 */
export function followUpKey(leadId: string, sequence: number): string {
  return `${leadId}:${sequence}`;
}
