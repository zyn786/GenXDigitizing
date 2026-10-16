// @ts-nocheck
/**
 * The durable notification outbox.
 *
 * Every internal alert that is worth retrying goes through here: enqueue a row,
 * a worker claims it, attempts it, and either marks it done or schedules another
 * attempt. Losing an alert because a provider blinked is not acceptable for the
 * events this carries — a new qualified lead, a customer message nobody
 * answered, a failed outbound send.
 *
 * Three rules, all of them load-bearing:
 *
 *   1. **Enqueue is idempotent.** `(event_key, channel)` is UNIQUE and the
 *      insert ignores conflicts, so a retried webhook or a double-clicked
 *      action notifies once. Duplicate suppression lives in the database, not
 *      in a worker's memory, because the worker is a serverless function that
 *      does not have any.
 *   2. **Claiming is atomic.** `claim_notification_outbox` uses
 *      `FOR UPDATE SKIP LOCKED`, so two overlapping crons never take the same
 *      row. See migration 065.
 *   3. **A status means what it says.** For `in_app`, a stored row *is*
 *      delivery — the dashboard reads that table. For `whatsapp`, Meta's 200
 *      means *accepted*; the receipt arrives later on the status webhook, and
 *      until it does the honest state is `accepted`. Nothing here reports
 *      `delivered` on evidence it does not have.
 *
 * The pure parts — backoff, terminal-decision, payload validation — are
 * exported separately from the I/O so they can be tested without a database or
 * a network, which is where the interesting mistakes live.
 */

import { sendWhatsAppText } from "@/lib/whatsapp/send";

export const OUTBOX_CHANNELS = ["in_app", "whatsapp"] as const;
export type OutboxChannel = (typeof OUTBOX_CHANNELS)[number];

export const OUTBOX_STATUSES = [
  "pending",
  "sending",
  "accepted",
  "delivered",
  "failed",
  "dead",
  "unknown",
] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

/**
 * The events this carries. Not a constraint in the database — `event_type` is
 * free text there so a new alert does not need a migration — but a closed list
 * here, so a typo is a compile error rather than a row nobody routes.
 */
export const OUTBOX_EVENT_TYPES = [
  "qualified_social_lead",
  "new_conversation",
  "unanswered_urgent_message",
  "order_created",
  "order_status_changed",
  "outbound_message_failed",
  "webhook_processing_failed",
  "integration_expiring",
] as const;
export type OutboxEventType = (typeof OUTBOX_EVENT_TYPES)[number];

/**
 * `notif_type` enum in migration 001. Mirrored here because
 * `notifyUsers`/the outbox insert `payload.notifType` straight into an enum
 * column: one bad value fails the entire batch, so it is checked before the
 * insert rather than discovered by it.
 */
export const NOTIF_TYPES = [
  "order_update",
  "message",
  "payment",
  "system",
  "sla_warning",
  "review",
] as const;
export type NotifType = (typeof NOTIF_TYPES)[number];

export function isNotifType(value: unknown): value is NotifType {
  return typeof value === "string" && (NOTIF_TYPES as readonly string[]).includes(value);
}

// ── Backoff ─────────────────────────────────────────────────

/**
 * First retry waits this long — chosen to match the worker's cron cadence (the
 * outbox entry in vercel.json runs every five minutes), because a shorter delay
 * cannot be observed anyway: the row would simply sit due until the next pass.
 * Attempts therefore land at roughly 5 min, 20 min, 30 min (the cap), then dead.
 */
export const BACKOFF_BASE_MS = 5 * 60_000;
/** Each retry multiplies the wait by this. */
export const BACKOFF_FACTOR = 4;
/** Ceiling, so attempt 9 is not waiting a week. */
export const BACKOFF_MAX_MS = 30 * 60_000;
/** Default attempts before a row is declared dead. */
export const DEFAULT_MAX_ATTEMPTS = 5;
/** Jitter as a fraction of the delay, spread either side. */
export const JITTER_RATIO = 0.2;

/**
 * How long to wait before attempt number `attempts + 1`.
 *
 * Exponentially growing and bounded, then jittered. The jitter is not
 * decoration: without it, every alert that failed during the same provider
 * outage retries in the same second and stampedes it a second time.
 *
 * `random` is injectable so tests are deterministic — a jittered value cannot
 * be asserted otherwise.
 */
export function backoffMs(
  attempts: number,
  random: () => number = Math.random,
  opts: { base?: number; factor?: number; max?: number; jitter?: number } = {}
): number {
  const base = opts.base ?? BACKOFF_BASE_MS;
  const factor = opts.factor ?? BACKOFF_FACTOR;
  const max = opts.max ?? BACKOFF_MAX_MS;
  const jitter = opts.jitter ?? JITTER_RATIO;

  const n = Math.max(1, Math.floor(attempts));
  // Cap the exponent before Math.pow so a huge attempt count cannot overflow to
  // Infinity and produce an Invalid Date downstream.
  const raw = Math.min(base * Math.pow(factor, n - 1), max);
  const spread = raw * jitter;
  const value = raw - spread + random() * spread * 2;
  return Math.max(0, Math.round(value));
}

/** Whether this attempt count exhausts the budget. */
export function isExhausted(attempts: number, maxAttempts: number = DEFAULT_MAX_ATTEMPTS): boolean {
  return attempts >= Math.max(1, maxAttempts);
}

/**
 * The next state for a row, given what the channel reported.
 *
 * `ok` means the destination has it. Which word that earns depends on the
 * channel: an in-app row is delivered the moment it is stored, a WhatsApp send
 * is only accepted until a receipt says otherwise.
 */
export function nextStatus(
  channel: OutboxChannel,
  result: { ok: boolean; providerId?: string | null },
  attempts: number,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS
): OutboxStatus {
  if (result.ok) return channel === "in_app" ? "delivered" : "accepted";
  return isExhausted(attempts, maxAttempts) ? "dead" : "failed";
}

/** Statuses the worker will pick up again. */
export function isClaimable(status: string): boolean {
  return status === "pending" || status === "failed" || status === "unknown";
}

/** Whether a row still has work in it, for the dashboard's queue depth. */
export function isOpenStatus(status: string): boolean {
  return status !== "delivered" && status !== "dead";
}

/**
 * Build the row an in-app alert becomes.
 *
 * Throws on a bad payload rather than inserting something the dashboard cannot
 * render: a notification with an enum-invalid type fails the whole batch insert
 * in `notifyUsers`, taking every other recipient's alert down with it.
 */
export function buildInAppNotification(payload: {
  userId: string;
  title?: unknown;
  body?: unknown;
  actionUrl?: unknown;
  notifType?: unknown;
}) {
  if (!payload.userId) throw new Error("an in-app notification needs a userId");
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!title) throw new Error("an in-app notification needs a title");
  if (!body) throw new Error("an in-app notification needs a body");

  return {
    user_id: payload.userId,
    type: isNotifType(payload.notifType) ? payload.notifType : "system",
    title,
    body,
    action_url:
      typeof payload.actionUrl === "string" && payload.actionUrl ? payload.actionUrl : null,
  };
}

// ── I/O ─────────────────────────────────────────────────────

type AnyClient = { from: (table: string) => any; rpc: (fn: string, args?: any) => any };

export interface EnqueueInput {
  /** Stable per logical event. Re-enqueuing the same key is a no-op. */
  eventKey: string;
  eventType: OutboxEventType | string;
  channel: OutboxChannel;
  /** User id for in_app; E.164 digits for whatsapp. */
  recipient: string | null;
  payload: Record<string, unknown>;
}

export interface EnqueueResult {
  ok: boolean;
  /** True when the row already existed — not an error. */
  duplicate: boolean;
  error?: string;
}

/**
 * Queue an alert. Never throws: an alert that cannot be queued must not take
 * down the action that produced it.
 */
export async function enqueue(db: AnyClient, input: EnqueueInput): Promise<EnqueueResult> {
  try {
    if (!input.eventKey?.trim()) return { ok: false, duplicate: false, error: "eventKey required" };
    if (!(OUTBOX_CHANNELS as readonly string[]).includes(input.channel)) {
      return { ok: false, duplicate: false, error: `unknown channel: ${input.channel}` };
    }

    const { data, error } = await db
      .from("notification_outbox")
      .upsert(
        {
          event_key: input.eventKey,
          event_type: input.eventType,
          channel: input.channel,
          recipient: input.recipient,
          payload: input.payload ?? {},
        },
        { onConflict: "event_key,channel", ignoreDuplicates: true }
      )
      .select("id");

    if (error) {
      console.error("[outbox] enqueue failed:", input.eventType, error.message ?? error);
      return { ok: false, duplicate: false, error: error.message ?? String(error) };
    }

    // ignoreDuplicates returns no row when the key already existed.
    return { ok: true, duplicate: !data || data.length === 0 };
  } catch (err: any) {
    console.error("[outbox] enqueue threw:", input.eventType, err?.message ?? err);
    return { ok: false, duplicate: false, error: err?.message ?? String(err) };
  }
}

export interface OutboxRow {
  id: string;
  event_key: string;
  event_type: string;
  channel: OutboxChannel;
  recipient: string | null;
  payload: any;
  attempts: number;
  max_attempts: number;
}

export interface OutboxDeps {
  /** Deliver on one channel. Injected so the worker is testable without I/O. */
  send: (row: OutboxRow) => Promise<{ ok: boolean; providerId?: string | null; error?: string }>;
  now?: () => Date;
  random?: () => number;
  limit?: number;
}

export interface OutboxSummary {
  swept: number;
  claimed: number;
  delivered: number;
  accepted: number;
  retried: number;
  dead: number;
}

/**
 * The default dispatcher: one case per channel.
 *
 * `in_app` writes the `notifications` row the dashboard reads, so a successful
 * insert is delivery. `whatsapp` calls the existing sender and can only ever
 * earn `accepted` — Meta acknowledges, it does not confirm.
 */
export async function defaultSend(db: AnyClient, row: OutboxRow) {
  if (row.channel === "in_app") {
    if (!row.recipient) return { ok: false, error: "in_app row has no recipient" };
    try {
      const notification = buildInAppNotification({
        userId: row.recipient,
        title: row.payload?.title,
        body: row.payload?.body,
        actionUrl: row.payload?.actionUrl,
        notifType: row.payload?.notifType,
      });
      const { error } = await db.from("notifications").insert(notification);
      if (error) return { ok: false, error: error.message ?? String(error) };
      return { ok: true, providerId: null };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  if (row.channel === "whatsapp") {
    const to = row.recipient || process.env.WHATSAPP_ADMIN_NUMBER;
    if (!to) return { ok: false, error: "no WhatsApp recipient configured" };
    const text = String(row.payload?.text ?? row.payload?.body ?? "").trim();
    if (!text) return { ok: false, error: "whatsapp row has no text" };

    const res = await sendWhatsAppText(to, text);
    if (!res.ok) {
      // 131047 = outside the 24-hour window. Free-form text cannot be sent
      // there, and no approved template exists for these alerts, so this is
      // terminal rather than retryable: waiting will not reopen the window.
      const terminal = res.code === 131047;
      return { ok: false, error: res.error ?? "send failed", terminal };
    }
    return { ok: true, providerId: res.messageId ?? null };
  }

  return { ok: false, error: `no sender for channel ${row.channel}` };
}

/**
 * Queue an alert and try to deliver it right now.
 *
 * The outbox alone would delay every alert until the next cron pass — up to
 * five minutes. For "a customer just messaged us" that is the difference
 * between a useful alert and a history lesson, so the row is written first
 * (durable) and then attempted inline (fast).
 *
 * The inline attempt is only a latency optimisation, never the guarantee: if it
 * fails, or the process dies mid-send, the row is already on disk and the cron
 * picks it up. That is the whole point of writing before sending.
 *
 * Bounded to a few rows so a webhook response does not wait on a queue drain.
 */
export async function enqueueAndDeliver(
  db: AnyClient,
  input: EnqueueInput,
  deps: Pick<OutboxDeps, "send" | "now" | "random">
): Promise<EnqueueResult> {
  const result = await enqueue(db, input);
  if (!result.ok) return result;

  try {
    await processOutbox(db, { ...deps, limit: 3 });
  } catch (err: any) {
    // Never let a delivery attempt fail the action that produced the alert.
    // The row is queued; the cron will try again.
    console.error("[outbox] inline delivery failed, row stays queued:", err?.message ?? err);
  }

  return result;
}

/**
 * One worker pass: recover abandoned rows, claim what is due, attempt each,
 * record the outcome.
 *
 * Returns a summary rather than throwing, so the cron can report what happened
 * even when individual sends failed.
 */
export async function processOutbox(db: AnyClient, deps: OutboxDeps): Promise<OutboxSummary> {
  const now = deps.now ?? (() => new Date());
  const random = deps.random ?? Math.random;
  const limit = deps.limit ?? 25;

  const summary: OutboxSummary = {
    swept: 0,
    claimed: 0,
    delivered: 0,
    accepted: 0,
    retried: 0,
    dead: 0,
  };

  // Rows abandoned mid-send by a crashed worker. Retried rather than assumed
  // sent: a duplicate alert is a smaller problem than a lost one.
  try {
    const { data: swept } = await db.rpc("sweep_stuck_notification_outbox");
    summary.swept = typeof swept === "number" ? swept : 0;
  } catch (err: any) {
    console.error("[outbox] sweep failed:", err?.message ?? err);
  }

  const { data: rows, error } = await db.rpc("claim_notification_outbox", { p_limit: limit });
  if (error) {
    console.error("[outbox] claim failed:", error.message ?? error);
    return summary;
  }

  const claimed: OutboxRow[] = rows ?? [];
  summary.claimed = claimed.length;

  for (const row of claimed) {
    let result: { ok: boolean; providerId?: string | null; error?: string; terminal?: boolean };
    try {
      result = await deps.send(row);
    } catch (err: any) {
      // Distinct from a provider saying no: a throw means the dispatcher
      // itself broke, which is a code fault and worth a loud line as well as
      // the `last_error` the row records.
      console.error("[outbox] send threw:", row.id, row.channel, err?.message ?? err);
      result = { ok: false, error: err?.message ?? String(err) };
    }

    // A terminal provider refusal (outside the messaging window, a number that
    // cannot receive) is not worth retrying — but it is worth a person seeing,
    // so it lands in `dead` with the reason rather than cycling.
    const status = result.terminal
      ? "dead"
      : nextStatus(row.channel, result, row.attempts, row.max_attempts);

    const patch: Record<string, unknown> = {
      status,
      last_error: result.ok ? null : (result.error ?? "unknown error"),
      provider_id: result.providerId ?? null,
      updated_at: now().toISOString(),
    };

    if (status === "failed") {
      patch.next_attempt_at = new Date(
        now().getTime() + backoffMs(row.attempts, random)
      ).toISOString();
    }

    try {
      await db.from("notification_outbox").update(patch).eq("id", row.id);
    } catch (err: any) {
      // The claim already incremented attempts, so a failure to record the
      // outcome cannot cause an infinite retry loop — the row ages out via
      // max_attempts. Log it and carry on with the rest of the batch.
      console.error("[outbox] could not record outcome:", row.id, err?.message ?? err);
    }

    if (status === "delivered") summary.delivered++;
    else if (status === "accepted") summary.accepted++;
    else if (status === "dead") summary.dead++;
    else summary.retried++;
  }

  return summary;
}
