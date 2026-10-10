/**
 * The append-only record of what happened to a lead.
 *
 * Before this, the entire history of a lead was one `crm_leads.notes` text
 * column that six different writers appended to with read-modify-write. Two
 * consequences, both real:
 *
 *   1. Concurrent writers destroyed each other's entries. The CRM board built
 *      its update from the copy loaded at page render, so a client reply
 *      recorded server-side while the board sat open vanished on the next drag
 *      of a stage — the business's memory of who said what, erased by a mouse.
 *   2. Nothing was structured. No actor, no from/to stage, no event type, no
 *      way to query time-to-first-contact or quote-to-order. The board parsed
 *      the text back out with a regex at render time.
 *
 * Rows here are append-only: nothing updates or deletes one. The notes column
 * keeps the structured facts that other code reads (artwork lines via
 * lib/lead-artwork, the reference via lib/lead-reference); the timeline moves
 * here.
 *
 * Recording must never take down the business action that produced it. A failed
 * event is logged loudly and swallowed — losing a note about an email is bad,
 * losing the email is worse.
 */

import { summariseStageChange } from "./lead-stages";

/** The event vocabulary. Mirrored by a CHECK constraint in migration 052. */
export const LEAD_EVENT_TYPES = [
  "created",
  "stage_change",
  "assigned",
  "email_sent",
  "email_failed",
  "chat_reply",
  "order_created",
  "note",
] as const;

export type LeadEventType = (typeof LEAD_EVENT_TYPES)[number];

export function isLeadEventType(value: unknown): value is LeadEventType {
  return typeof value === "string" && (LEAD_EVENT_TYPES as readonly string[]).includes(value);
}

export interface LeadEventInput {
  leadId: string;
  type: LeadEventType;
  /** Who caused it. Null means the system did. */
  actorId?: string | null;
  /**
   * Snapshot of the actor's display name. Stored alongside the id because a
   * timeline that goes blank when a staff account is deleted is not a record.
   */
  actorLabel?: string | null;
  summary: string;
  fromStage?: string | null;
  toStage?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Build the row to insert, so the writer and the tests agree on its shape. */
export function buildLeadEventRow(input: LeadEventInput) {
  if (!input.leadId) throw new Error("lead event requires a leadId");
  if (!input.summary?.trim()) throw new Error("lead event requires a summary");
  if (!isLeadEventType(input.type)) {
    throw new Error(`unknown lead event type: ${String(input.type)}`);
  }

  return {
    lead_id: input.leadId,
    type: input.type,
    actor_id: input.actorId ?? null,
    actor_label: input.actorLabel?.trim() || null,
    summary: input.summary.trim(),
    from_stage: input.fromStage ?? null,
    to_stage: input.toStage ?? null,
    metadata: input.metadata ?? null,
  };
}

/** Convenience for the most common event, so callers cannot get the wording wrong. */
export function buildStageChangeEvent(input: {
  leadId: string;
  fromStage: string | null | undefined;
  toStage: string;
  actorId?: string | null;
  actorLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}): LeadEventInput {
  return {
    leadId: input.leadId,
    type: "stage_change",
    actorId: input.actorId ?? null,
    actorLabel: input.actorLabel ?? null,
    summary: summariseStageChange(input.fromStage, input.toStage),
    fromStage: input.fromStage ?? null,
    toStage: input.toStage,
    metadata: input.metadata ?? null,
  };
}

type AnyClient = { from: (table: string) => any };

/**
 * Write one event. Never throws.
 *
 * Returns whether it landed so a caller that cares can say so; callers that do
 * not care can ignore it. The console line is deliberately loud: an event that
 * silently fails to record is exactly the class of bug this table exists to
 * eliminate.
 */
export async function recordLeadEvent(
  client: AnyClient,
  input: LeadEventInput
): Promise<{ ok: boolean; error?: string }> {
  let row: ReturnType<typeof buildLeadEventRow>;
  try {
    row = buildLeadEventRow(input);
  } catch (err) {
    // A malformed event is a programming error, not a runtime condition.
    console.error("[lead-events] refused to record a malformed event:", err, input);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const { error } = await client.from("lead_events").insert(row);
    if (error) {
      console.error(
        "[lead-events] event NOT recorded —",
        row.type,
        "lead",
        row.lead_id,
        error.message ?? error
      );
      return { ok: false, error: error.message ?? String(error) };
    }
    return { ok: true };
  } catch (err) {
    // Thrown errors mean the client itself failed; the business action still
    // stands and must not be rolled back for this.
    console.error("[lead-events] event NOT recorded (threw) —", row.type, row.lead_id, err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
