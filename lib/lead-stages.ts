/**
 * The lead pipeline, in one place.
 *
 * These seven values are the `lead_stage` enum in the database
 * (supabase/migrations/001_initial_schema.sql:20). The CRM board, the server
 * routes that move a lead, and the event summaries written to `lead_events` all
 * need the same vocabulary and the same human labels — before this file they
 * each carried their own copy, which is how `quote_sent` and `negotiation` came
 * to be valid in the database, absent from the board, and fatal to render.
 *
 * Pure and dependency-free so it can be imported from a client component, a
 * server route, or a test without pulling anything in.
 */

/** Every value the database will accept, in funnel order. */
export const LEAD_STAGES = [
  "lead",
  "contacted",
  "quote_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

/** Human labels. Used for the board and for event summaries. */
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  lead: "New Lead",
  contacted: "Contacted",
  quote_sent: "Quote Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === "string" && (LEAD_STAGES as readonly string[]).includes(value);
}

/** Label for display, falling back to the raw value for an unknown stage. */
export function leadStageLabel(stage: string | null | undefined): string {
  if (!stage) return "Unknown";
  return isLeadStage(stage) ? LEAD_STAGE_LABELS[stage] : stage;
}

/**
 * The one-line summary recorded when a lead moves.
 *
 * The board and the API both need this sentence and they must not drift — a
 * timeline that says "Stage changed: New Lead → Contacted" in one place and
 * "Moved to Contacted" in another is a timeline nobody trusts.
 */
export function summariseStageChange(
  from: string | null | undefined,
  to: string | null | undefined
): string {
  const toLabel = leadStageLabel(to);
  if (!from) return `Moved to ${toLabel}`;
  if (from === to) return `Stage unchanged (${toLabel})`;
  return `Stage changed: ${leadStageLabel(from)} → ${toLabel}`;
}
