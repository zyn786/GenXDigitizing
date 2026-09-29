// @ts-nocheck
/**
 * Invariant checks for the order → notification → email chain.
 *
 * Every check here maps to a silent failure that was actually found by reading
 * code — which is the point. The system had no instrument that could see any of
 * them, so they persisted for months while CI stayed green. This module is that
 * instrument.
 *
 * Read-only by construction: nothing here writes. It is safe to run against
 * production and safe to schedule.
 *
 * A check returns `ok: false` when reality violates the invariant, and
 * `skipped` when it could not run at all (usually an unapplied migration) —
 * skipped is reported distinctly so a missing table never reads as healthy.
 */

import { isMissingColumn } from "@/lib/db-errors";

export type Severity = "critical" | "high" | "medium";

export interface CheckResult {
  id: string;
  title: string;
  /** What a failure means, in operator terms. */
  meaning: string;
  severity: Severity;
  ok: boolean;
  count: number;
  detail: string;
  samples: string[];
  /** Set when the check could not run. Never treated as a pass. */
  skipped?: string;
}

export interface InvariantReport {
  ok: boolean;
  generatedAt: string;
  windowHours: number;
  checks: CheckResult[];
  failed: number;
  skipped: number;
  critical: number;
}

export interface InvariantOptions {
  /** How far back to look. */
  windowHours?: number;
  /** How long an unassigned `submitted` order may sit before it counts as stalled. */
  staleSubmittedHours?: number;
  /** How long an overdue order may go without an escalation notification. */
  escalationRepeatHours?: number;
}

/** Statuses where we still owe the customer work. */
const ACTIVE_STATUSES = ["submitted", "assigned", "in_progress", "review"];

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

function hoursAgoIso(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}

/** Rough "did anyone get told about this order" — any notification naming it. */
function notifiedOrderNumbers(notifications: { title?: string | null }[]): Set<string> {
  const out = new Set<string>();
  for (const n of notifications) {
    const m = /—\s*(\S+)\s*$/.exec(n.title ?? "");
    if (m) out.add(m[1]);
  }
  return out;
}

export async function runInvariantChecks(
  db: any,
  opts: InvariantOptions = {}
): Promise<InvariantReport> {
  const windowHours = opts.windowHours ?? 24;
  const staleSubmittedHours = opts.staleSubmittedHours ?? 4;
  const escalationRepeatHours = opts.escalationRepeatHours ?? 6;

  const since = hoursAgoIso(windowHours);
  const checks: CheckResult[] = [];

  // ── Bulk reads ──────────────────────────────────────────────
  const { data: orders } = await db
    .from("orders")
    .select("id, order_number, status, price, sla_deadline, created_at, designer_id, design_name")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const { data: activeOrders } = await db
    .from("orders")
    .select("id, order_number, status, sla_deadline, created_at, designer_id")
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(500);

  // Notifications are the only record that anyone was told anything.
  const { data: notifications } = await db
    .from("notifications")
    .select("title, created_at, user_id")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);

  const recentOrders = orders ?? [];
  const openOrders = activeOrders ?? [];
  const recentNotifs = notifications ?? [];
  const notified = notifiedOrderNumbers(recentNotifs);

  const sample = (rows: any[], f: (r: any) => string) => rows.slice(0, 5).map(f);

  // ── 1. Order created but nobody internal was told ───────────
  {
    const unnotified = recentOrders.filter((o) => !notified.has(o.order_number));
    checks.push({
      id: "orders_not_notified",
      title: "Every new order has an internal notification",
      meaning:
        "An order exists that no team member was notified about. The customer believes it was placed; nobody is working on it.",
      severity: "critical",
      ok: unnotified.length === 0,
      count: unnotified.length,
      detail: `${unnotified.length} of ${recentOrders.length} orders in the last ${windowHours}h have no notification naming them.`,
      samples: sample(unnotified, (o) => `${o.order_number} (${o.status}, ${money(o.price)})`),
    });
  }

  // ── 2. Past deadline with no escalation ─────────────────────
  {
    const overdue = openOrders.filter((o) => {
      const h = hoursUntil(o.sla_deadline);
      return h !== null && h < 0;
    });
    const unescalated = overdue.filter((o) => {
      const escalated = recentNotifs.some(
        (n) =>
          /^SLA (Warning|Urgent|OVERDUE)/.test(n.title ?? "") &&
          (n.title ?? "").includes(o.order_number) &&
          new Date(n.created_at).getTime() > Date.now() - escalationRepeatHours * 3_600_000
      );
      return !escalated;
    });
    checks.push({
      id: "overdue_unescalated",
      title: "Overdue orders are escalated",
      meaning:
        "An order is past its deadline and nothing has escalated it in the repeat window. This is the state that used to be unreachable — the cron skipped anything already past due.",
      severity: "critical",
      ok: unescalated.length === 0,
      count: unescalated.length,
      detail: `${overdue.length} open order(s) past deadline; ${unescalated.length} with no escalation in the last ${escalationRepeatHours}h.`,
      samples: sample(unescalated, (o) => {
        const h = hoursUntil(o.sla_deadline);
        return `${o.order_number} — ${Math.abs(h ?? 0).toFixed(1)}h overdue (${o.status}${o.designer_id ? "" : ", UNASSIGNED"})`;
      }),
    });
  }

  // ── 3. Sitting unassigned ──────────────────────────────────
  {
    const stalled = openOrders.filter(
      (o) =>
        o.status === "submitted" &&
        !o.designer_id &&
        new Date(o.created_at).getTime() < Date.now() - staleSubmittedHours * 3_600_000
    );
    checks.push({
      id: "orders_stuck_submitted",
      title: "No order sits unassigned",
      meaning:
        "A paid order has been waiting for someone to pick it up. Previously the SLA cron ignored `submitted` entirely, so this could sit forever.",
      severity: "high",
      ok: stalled.length === 0,
      count: stalled.length,
      detail: `${stalled.length} order(s) in \`submitted\` with no designer for over ${staleSubmittedHours}h.`,
      samples: sample(
        stalled,
        (o) => `${o.order_number} — since ${new Date(o.created_at).toISOString().slice(0, 16)}Z`
      ),
    });
  }

  // ── 4. No deadline at all ──────────────────────────────────
  {
    const undated = openOrders.filter((o) => !o.sla_deadline);
    checks.push({
      id: "null_sla_deadline",
      title: "Every open order has a deadline",
      meaning:
        "The column is nullable with no default, and a NULL deadline is invisible to every deadline surface — the cron, the admin UI and the designer view all skip it silently.",
      severity: "high",
      ok: undated.length === 0,
      count: undated.length,
      detail: `${undated.length} open order(s) with no sla_deadline.`,
      samples: sample(undated, (o) => `${o.order_number} (${o.status})`),
    });
  }

  // ── 5. Order with no artwork ───────────────────────────────
  {
    const ids = recentOrders.map((o) => o.id);
    let missingArtwork: any[] = [];
    if (ids.length) {
      const { data: files } = await db
        .from("order_files")
        .select("order_id, file_type")
        .in("order_id", ids)
        .eq("file_type", "artwork");

      const { data: failedUploads } = await db
        .from("audit_logs")
        .select("entity_id")
        .eq("action", "artwork_upload_failed")
        .in("entity_id", ids);

      const hasArtwork = new Set((files ?? []).map((f: any) => f.order_id));
      const knownFailed = new Set((failedUploads ?? []).map((a: any) => a.entity_id));

      // A known failed upload is accounted for — the team already has an alert.
      missingArtwork = recentOrders.filter((o) => !hasArtwork.has(o.id) && !knownFailed.has(o.id));
    }
    checks.push({
      id: "missing_artwork",
      title: "Every order has its artwork",
      meaning:
        "The order exists but no artwork is attached and no upload failure was recorded — the customer may believe their files went through.",
      severity: "critical",
      ok: missingArtwork.length === 0,
      count: missingArtwork.length,
      detail: `${missingArtwork.length} order(s) in the last ${windowHours}h with no artwork file and no recorded upload failure.`,
      samples: sample(missingArtwork, (o) => `${o.order_number} — ${o.design_name || "unnamed"}`),
    });
  }

  // ── 6. Failed sends ────────────────────────────────────────
  {
    const { data, error } = await db
      .from("email_failures")
      .select("subject, to_email, error, created_at")
      .eq("resolved", false)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error && isMissingColumn(error)) {
      checks.push({
        id: "email_failures_unresolved",
        title: "No unresolved email failures",
        meaning: "Failed sends are recorded so they can be retried instead of vanishing.",
        severity: "high",
        ok: true,
        count: 0,
        detail: "",
        samples: [],
        skipped: "email_failures table missing — apply migration 046",
      });
    } else {
      const rows = data ?? [];
      checks.push({
        id: "email_failures_unresolved",
        title: "No unresolved email failures",
        meaning:
          "Failed sends are recorded so they can be retried instead of vanishing. Before migration 046 a bounced email was indistinguishable from a delivered one.",
        severity: "high",
        ok: rows.length === 0,
        count: rows.length,
        detail: `${rows.length} unresolved send failure(s) in the last ${windowHours}h.`,
        samples: sample(
          rows,
          (r) =>
            `${r.to_email} — "${String(r.subject).slice(0, 40)}" — ${String(r.error).slice(0, 60)}`
        ),
      });
    }
  }

  // ── 7. Transactional email actually goes out ───────────────
  {
    // The invariant is conditional on traffic: if orders were created, the
    // transactional sender should have sent. Silence with no orders is not a
    // failure, so this cannot false-alarm on a quiet day.
    const { data, error } = await db
      .from("sent_emails")
      .select("id, from_email, sent_by, sent_at")
      .gte("sent_at", since)
      .limit(2000);

    if (error) {
      checks.push({
        id: "transactional_email_flowing",
        title: "Transactional email is being sent",
        meaning:
          "Customer notifications (order received, delivered, revision) are leaving the system.",
        severity: "critical",
        ok: true,
        count: 0,
        detail: "",
        samples: [],
        skipped: `could not read sent_emails: ${error.message}`,
      });
    } else {
      const rows = data ?? [];
      // Transactional sends leave `sent_by` NULL; only the admin composer sets it.
      const transactional = rows.filter((r) => !r.sent_by);
      const expected = recentOrders.length > 0;
      const ok = !expected || transactional.length > 0;

      checks.push({
        id: "transactional_email_flowing",
        title: "Transactional email is being sent",
        meaning:
          "If orders were created but no transactional send was logged, customer notifications are not going out. This is the check that would have caught the current problem the day it started.",
        severity: "critical",
        ok,
        count: transactional.length,
        detail: expected
          ? `${recentOrders.length} order(s) created in the last ${windowHours}h; ${transactional.length} transactional send(s) logged.`
          : `No orders in the last ${windowHours}h — nothing expected.`,
        samples: transactional.slice(0, 3).map((r) => `${r.from_email} at ${r.sent_at}`),
      });
    }
  }

  // ── 8. Delivery webhook silence ────────────────────────────
  {
    const { data, error } = await db
      .from("email_events")
      .select("id")
      .gte("created_at", since)
      .limit(1);

    if (error && isMissingColumn(error)) {
      checks.push({
        id: "email_webhook_delivering",
        title: "Resend delivery webhook is recording events",
        meaning: "Bounce and complaint events arrive so deliverability problems are visible.",
        severity: "medium",
        ok: true,
        count: 0,
        detail: "",
        samples: [],
        skipped: "email_events table missing — apply migration 046",
      });
    } else {
      const { count: sentCount } = await db
        .from("sent_emails")
        .select("*", { count: "exact", head: true })
        .gte("sent_at", since);

      const events = data?.length ?? 0;
      const sent = sentCount ?? 0;
      // Sends but no events means the webhook is misconfigured or erroring. It
      // returned 401 on every delivery for a while and nothing noticed.
      const ok = !(sent > 0 && events === 0);

      checks.push({
        id: "email_webhook_delivering",
        title: "Resend delivery webhook is recording events",
        meaning:
          "Mail was sent but no delivery events arrived — the webhook signature check or its tables are failing, and bounces are going unseen.",
        severity: "medium",
        ok,
        count: events,
        detail: `${sent} send(s) and ${events} delivery event(s) in the last ${windowHours}h.`,
        samples: [],
      });
    }
  }

  // ── 9. Notification delivery ───────────────────────────────
  {
    const { data, error } = await db
      .from("notification_failures")
      .select("channel, reason, title, created_at")
      .eq("resolved", false)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error && isMissingColumn(error)) {
      checks.push({
        id: "notifications_delivered",
        title: "Notifications are being delivered",
        meaning: "Undelivered notifications are recorded so a lost alert is visible.",
        severity: "high",
        ok: true,
        count: 0,
        detail: "",
        samples: [],
        skipped: "notification_failures table missing — apply migration 050",
      });
    } else {
      const rows = data ?? [];
      // Push being unconfigured is one failure per send and drowns out the rest.
      const pushDisabled = rows.filter((r) => /VAPID/i.test(r.reason ?? ""));
      const other = rows.filter((r) => !/VAPID/i.test(r.reason ?? ""));

      checks.push({
        id: "notifications_delivered",
        title: "Notifications are being delivered",
        meaning:
          "A notification could not be delivered. Before this was recorded, a failed alert was indistinguishable from a delivered one.",
        severity: "high",
        ok: rows.length === 0,
        count: rows.length,
        detail:
          `${rows.length} undelivered notification(s) in the last ${windowHours}h` +
          (pushDisabled.length ? ` — ${pushDisabled.length} because push has no VAPID keys.` : "."),
        samples: sample(
          other.length ? other : rows,
          (r) => `[${r.channel}] ${r.title} — ${String(r.reason).slice(0, 70)}`
        ),
      });
    }
  }

  // ── 10. Crons reporting failures ───────────────────────────
  {
    const alerts = recentNotifs.filter((n) => /^Cron Alert:/.test(n.title ?? ""));
    checks.push({
      id: "cron_alerts",
      title: "No cron jobs are reporting failure",
      meaning:
        "A cron alerted admins that it failed. The SLA cron used to fail on every run — a synchronous NextResponse had .catch() called on it — and nothing watched it.",
      severity: "high",
      ok: alerts.length === 0,
      count: alerts.length,
      detail: `${alerts.length} cron failure alert(s) in the last ${windowHours}h.`,
      samples: alerts.slice(0, 5).map((n) => String(n.title)),
    });
  }

  const failed = checks.filter((c) => !c.ok && !c.skipped);
  const skipped = checks.filter((c) => c.skipped);

  return {
    ok: failed.length === 0,
    generatedAt: new Date().toISOString(),
    windowHours,
    checks,
    failed: failed.length,
    skipped: skipped.length,
    critical: failed.filter((c) => c.severity === "critical").length,
  };
}

/** One-line summary for logs and uptime checks. */
export function summarise(report: InvariantReport): string {
  if (report.ok && report.skipped === 0) return `OK — ${report.checks.length} checks passed`;
  const failing = report.checks.filter((c) => !c.ok && !c.skipped);
  const parts = failing.map((c) => `${c.id}=${c.count}`);
  if (report.skipped) parts.push(`skipped=${report.skipped}`);
  return `${failing.length} failing: ${parts.join(", ")}`;
}
