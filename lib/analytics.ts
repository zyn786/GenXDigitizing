/**
 * Funnel measurement, from the lead event log.
 *
 * Every number here comes from `lead_events` rows that the application already
 * writes. Nothing is sampled, estimated or modelled — the whole reason the
 * event log exists is that "how long does a lead wait for a first reply?" was
 * previously unanswerable, because the timeline lived in a text column that no
 * query could count.
 *
 * The aggregation is pure and takes rows, not a database, so the arithmetic is
 * testable without one. `getFunnelReport` does the reading.
 *
 * Two deliberate omissions:
 *
 *   - No averages without the sample size beside them. "4.2 hours" from two
 *     leads is not a measurement, it is a coincidence, and a dashboard that
 *     presents it as one gets trusted and then misleads.
 *   - No conversion rate below a stated minimum. A percentage over a handful of
 *     leads swings wildly and invites decisions that are really noise.
 */

import { LEAD_STAGES, type LeadStage } from "@/lib/lead-stages";

/** Below this, a rate is reported as "too few to say" rather than as a number. */
export const MIN_SAMPLE_FOR_RATE = 10;

const HOUR = 60 * 60 * 1000;

export interface EventRow {
  lead_id: string;
  type: string;
  from_stage: string | null;
  to_stage: string | null;
  created_at: string;
}

export interface DurationStat {
  /** Median, not mean: one lead answered after three weeks skews a mean badly. */
  medianHours: number | null;
  samples: number;
}

export interface RateStat {
  numerator: number;
  denominator: number;
  /** Percentage, or null when the denominator is below MIN_SAMPLE_FOR_RATE. */
  pct: number | null;
  note?: string;
}

export interface FunnelReport {
  /** First reply: lead created → the first thing we did about it. */
  timeToFirstContact: DurationStat;
  /** Quote sent → won. The step the business most wants to shorten. */
  quoteToWon: DurationStat;
  /** How often a lead converts at all. */
  leadToWon: RateStat;
  /** How often a lead got any human reply at all — the other half of the funnel. */
  answeredRate: RateStat;
  totals: {
    leads: number;
    contacted: number;
    quotesSent: number;
    won: number;
    lost: number;
  };
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value * 10) / 10;
}

function hoursBetween(fromIso: string, toIso: string): number | null {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const hours = (b - a) / HOUR;
  // A negative gap means the events are out of order; counting it would drag
  // the median down and flatter the response time.
  return hours >= 0 ? hours : null;
}

/** Group by lead, keeping events in the order they happened. */
function byLead(events: EventRow[]): Map<string, EventRow[]> {
  const map = new Map<string, EventRow[]>();
  for (const e of events) {
    const list = map.get(e.lead_id) ?? [];
    list.push(e);
    map.set(e.lead_id, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  return map;
}

/**
 * Events that mean a human actually did something about the lead.
 *
 * `stage_change` out of the first stage counts, and so does an email or a chat
 * reply. Deliberately NOT counted: the lead merely being created, or an
 * automated follow-up — the customer is still waiting for an answer in both
 * cases, and counting them would make the response time look better than it is.
 */
const CONTACT_EVENT = new Set(["email_sent", "chat_reply"]);

export function buildFunnelReport(events: EventRow[]): FunnelReport {
  const grouped = byLead(events);

  const firstContactHours: number[] = [];
  const quoteToWonHours: number[] = [];

  let leads = 0;
  let contacted = 0;
  let quotesSent = 0;
  let won = 0;
  let lost = 0;

  for (const list of grouped.values()) {
    const created = list.find((e) => e.type === "created");
    if (created) leads++;

    const firstContact = list.find(
      (e) => CONTACT_EVENT.has(e.type) || (e.type === "stage_change" && e.from_stage === "lead")
    );
    if (firstContact) contacted++;
    if (created && firstContact) {
      const h = hoursBetween(created.created_at, firstContact.created_at);
      if (h !== null) firstContactHours.push(h);
    }

    const quote = list.find((e) => e.type === "stage_change" && e.to_stage === "quote_sent");
    if (quote) quotesSent++;

    const win = list.find((e) => e.type === "stage_change" && e.to_stage === "won");
    if (win) won++;

    if (quote && win) {
      const h = hoursBetween(quote.created_at, win.created_at);
      if (h !== null) quoteToWonHours.push(h);
    }

    if (list.some((e) => e.type === "stage_change" && e.to_stage === "lost")) lost++;
  }

  // Note on follow-up effectiveness: the engine records its sends as `note`
  // events whose summary is prose ("Follow-up 1/2 emailed automatically"), so
  // counting them means matching on wording — fragile, and it would break the
  // first time someone edits the sentence. There is no metric for it here
  // rather than a metric that measures something else under that name. It
  // needs a distinguishable event type first; until then the follow-up log
  // table (lead_follow_ups) is the place to count from.

  return {
    timeToFirstContact: {
      medianHours: median(firstContactHours),
      samples: firstContactHours.length,
    },
    quoteToWon: { medianHours: median(quoteToWonHours), samples: quoteToWonHours.length },
    leadToWon: rate(won, leads, "of leads created were won"),
    answeredRate: rate(contacted, leads, "of leads got a human reply"),
    totals: { leads, contacted, quotesSent, won, lost },
  };
}

function rate(numerator: number, denominator: number, note: string): RateStat {
  if (denominator < MIN_SAMPLE_FOR_RATE) {
    return {
      numerator,
      denominator,
      pct: null,
      note: `too few to say — ${denominator} of ${MIN_SAMPLE_FOR_RATE} needed`,
    };
  }
  return {
    numerator,
    denominator,
    pct: Math.round((numerator / denominator) * 1000) / 10,
    note,
  };
}

/** Format a stat for display, refusing to invent confidence it does not have. */
export function formatDuration(stat: DurationStat): string {
  if (stat.medianHours === null) return "—";
  const unit = stat.medianHours === 1 ? "hour" : "hours";
  return `${stat.medianHours} ${unit} (${stat.samples} lead${stat.samples === 1 ? "" : "s"})`;
}

export function formatRate(stat: RateStat): string {
  if (stat.pct === null) return stat.note ?? "—";
  return `${stat.pct}% (${stat.numerator}/${stat.denominator})`;
}

/** The stages the report counts, exported so the UI and the query agree. */
export const TRACKED_STAGES: LeadStage[] = [...LEAD_STAGES];
