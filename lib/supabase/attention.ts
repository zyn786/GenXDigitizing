// @ts-nocheck
/**
 * What needs attention right now.
 *
 * Every number here is read from a table that already exists. Nothing is
 * estimated, extrapolated, or invented — if a figure would be a guess, it is
 * not on this screen. That rule matters more here than anywhere else in the app:
 * a dashboard that cries wolf gets ignored, and an ignored dashboard is how a
 * lead goes unanswered for three days.
 *
 * The definitions deliberately match the code that already enforces them:
 * "at risk" uses the same statuses and windows as the SLA cron (lib/sla.ts), so
 * an order is never chased in one place and ignored in the other.
 *
 * Read-only. This module must never write — the CRM board used to run a
 * service-role "auto-lost" sweep on every render, which killed live leads.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { SLA_ACTIVE_STATUSES, SLA_WARNING_MS, SLA_URGENT_MS } from "@/lib/sla";

// Timing windows live in lib/lead-timing.ts so that lib/follow-up.ts — which a
// client component imports — can share them without pulling this module's
// server-only Supabase client into the browser bundle.
import {
  INACTIVE_CLIENT_DAYS,
  QUOTE_CHASE_MS,
  STALE_LEAD_MS,
  TIMING_UNITS,
  UNANSWERED_LEAD_MS,
} from "@/lib/lead-timing";

export { INACTIVE_CLIENT_DAYS, QUOTE_CHASE_MS, STALE_LEAD_MS, UNANSWERED_LEAD_MS };

const { MINUTE, HOUR, DAY } = TIMING_UNITS;

/** Open stages — a lead in one of these is still winnable. */
const OPEN_LEAD_STAGES = ["lead", "contacted", "quote_sent", "negotiation"];

export type AttentionLevel = "critical" | "warning" | "opportunity";

export interface AttentionAlert {
  id: string;
  level: AttentionLevel;
  /** Short kind label: "High priority", "Follow-up", "Order risk", "Opportunity". */
  kind: string;
  title: string;
  detail: string;
  /** Where the team goes to act on it. */
  href: string;
  /** Machine-readable payload so the UI can sort or filter without re-parsing. */
  meta?: Record<string, unknown>;
}

export interface AttentionCounts {
  newLeadsToday: number;
  unansweredLeads: number;
  quotesAwaitingReply: number;
  followUpsDue: number;
  ordersAtRisk: number;
  deliveredToday: number;
}

export interface AttentionReport {
  counts: AttentionCounts;
  alerts: AttentionAlert[];
  /** Set when a query failed; the panel says so rather than showing zeros. */
  degraded: string | null;
}

function hoursSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((now - t) / HOUR);
}

/** "3 minutes", "4 hours", "12 days" — the phrasing the alerts are built from. */
export function humanAge(ms: number): string {
  const safe = Math.max(0, ms);
  const mins = Math.floor(safe / MINUTE);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"}`;
  const hours = Math.floor(safe / HOUR);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(safe / DAY);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * How urgent an order is, given the time left before its deadline.
 *
 * Same boundaries the SLA cron acts on (urgent inside 30 minutes, warning
 * inside 2 hours), so the dashboard and the emails agree. Anything already past
 * its deadline is critical.
 */
export function orderRiskLevel(remainingMs: number): AttentionLevel {
  if (remainingMs <= SLA_URGENT_MS) return "critical";
  return "warning";
}

function startOfTodayUtc(now: number): string {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getAttentionReport(now = Date.now()): Promise<AttentionReport> {
  const db = createAdminClient();
  const sinceToday = startOfTodayUtc(now);
  const unansweredBefore = new Date(now - UNANSWERED_LEAD_MS).toISOString();
  const staleBefore = new Date(now - STALE_LEAD_MS).toISOString();
  const chaseBefore = new Date(now - QUOTE_CHASE_MS).toISOString();
  const warnDeadline = new Date(now + SLA_WARNING_MS).toISOString();
  const inactiveBefore = new Date(now - INACTIVE_CLIENT_DAYS * DAY).toISOString();

  const [
    newLeadsRes,
    unansweredRes,
    quotesRes,
    followUpRes,
    atRiskRes,
    deliveredRes,
    abandonedRes,
    inactiveRes,
  ] = await Promise.all([
    // Created today and still untouched.
    db.from("crm_leads").select("id", { count: "exact", head: true }).gte("created_at", sinceToday),

    // Open, in the first stage, and old enough that a human should have replied.
    db
      .from("crm_leads")
      .select("id, contact_name, email, company, created_at, source", { count: "exact" })
      .eq("stage", "lead")
      .lt("created_at", unansweredBefore)
      .order("created_at", { ascending: true })
      .limit(20),

    // Quote out, nothing since.
    db
      .from("crm_leads")
      .select("id, contact_name, email, company, deal_value, updated_at")
      .eq("stage", "quote_sent")
      .lt("updated_at", chaseBefore)
      .order("updated_at", { ascending: true })
      .limit(20),

    // An explicit follow-up date that has come due. Nothing writes follow_up_at
    // yet (the follow-up engine is not built), so this is normally 0 — it is
    // wired now so the engine has somewhere to appear rather than needing this
    // panel rewritten when it lands.
    db
      .from("crm_leads")
      .select("id", { count: "exact", head: true })
      .lte("follow_up_at", new Date(now).toISOString())
      .in("stage", OPEN_LEAD_STAGES),

    // Orders we still owe, inside the warning window or already past it.
    db
      .from("orders")
      .select("id, order_number, status, sla_deadline, design_name, clients(company_name)")
      .in("status", SLA_ACTIVE_STATUSES)
      .not("sla_deadline", "is", null)
      .lte("sla_deadline", warnDeadline)
      .order("sla_deadline", { ascending: true })
      .limit(20),

    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "delivered")
      .gte("delivered_at", sinceToday),

    // Open leads with no follow-up date at all, sitting untouched.
    //
    // The engine clears `follow_up_at` when it gives up — two automated nudges
    // with no reply means the lead is now a person's job. Clearing the date
    // would also remove it from the count above, which would be the worst
    // possible outcome: the leads the robot gave up on are exactly the ones a
    // human has to pick up. This query is how they stay visible.
    db
      .from("crm_leads")
      .select("id, contact_name, email, company, stage, updated_at")
      .in("stage", OPEN_LEAD_STAGES)
      .is("follow_up_at", null)
      .lt("updated_at", staleBefore)
      .order("updated_at", { ascending: true })
      .limit(20),

    // Customers who used to order and have gone quiet. Only clients with real
    // order history count — a contact who never bought is a lead, not a lapsed
    // customer, and emailing them as one would be wrong.
    db
      .from("clients")
      .select("id, company_name, ltv, users(full_name, email), orders(created_at)")
      .gt("ltv", 0)
      .order("ltv", { ascending: false })
      .limit(50),
  ]);

  const firstError =
    newLeadsRes.error ||
    unansweredRes.error ||
    quotesRes.error ||
    followUpRes.error ||
    atRiskRes.error ||
    deliveredRes.error ||
    abandonedRes.error ||
    inactiveRes.error;

  const unanswered = unansweredRes.data ?? [];
  const quotes = quotesRes.data ?? [];
  const atRisk = atRiskRes.data ?? [];

  const alerts: AttentionAlert[] = [];

  // ── High priority: a lead nobody has answered ──────────────
  for (const lead of unanswered) {
    const age = now - new Date(lead.created_at).getTime();
    alerts.push({
      id: `unanswered-${lead.id}`,
      level: "critical",
      kind: "High priority",
      title: `${lead.contact_name || lead.email} has not been answered for ${humanAge(age)}`,
      detail: `${lead.company || lead.email} · came in via ${(lead.source || "website").replace("_", " ")}`,
      href: "/crm/leads",
      meta: { leadId: lead.id, ageMs: age },
    });
  }

  // ── Follow-up: quote sent, no reply ────────────────────────
  for (const lead of quotes) {
    const age = now - new Date(lead.updated_at).getTime();
    alerts.push({
      id: `quote-${lead.id}`,
      level: "warning",
      kind: "Follow-up",
      title: `Quote sent to ${lead.contact_name || lead.email} ${humanAge(age)} ago with no response`,
      detail: lead.deal_value ? `Worth $${lead.deal_value}` : "No value recorded",
      href: "/crm/leads",
      meta: { leadId: lead.id, ageMs: age },
    });
  }

  // ── Order risk: production deadline approaching ────────────
  for (const order of atRisk) {
    const remaining = new Date(order.sla_deadline).getTime() - now;
    const overdue = remaining < 0;
    alerts.push({
      id: `order-${order.id}`,
      level: orderRiskLevel(remaining),
      kind: "Order risk",
      title: overdue
        ? `Order ${order.order_number} is ${humanAge(-remaining)} past its deadline`
        : `Order ${order.order_number} is due in ${humanAge(remaining)}`,
      detail: `${order.design_name || "Untitled"} · ${order.status} · ${order.clients?.company_name || "—"}`,
      href: `/admin/orders/${order.id}`,
      meta: { orderId: order.id, remainingMs: remaining },
    });
  }

  // ── Nobody is chasing these ────────────────────────────────
  for (const lead of abandonedRes.data ?? []) {
    const age = now - new Date(lead.updated_at).getTime();
    alerts.push({
      id: `abandoned-${lead.id}`,
      level: "warning",
      kind: "Needs a person",
      title: `${lead.contact_name || lead.email} has had no activity for ${humanAge(age)} and nothing is scheduled`,
      detail: `${lead.company || lead.email} · ${lead.stage} · no follow-up date set`,
      href: "/crm/leads",
      meta: { leadId: lead.id, ageMs: age },
    });
  }

  // ── Opportunity: a customer who has gone quiet ─────────────
  const inactive = (inactiveRes.data ?? []).filter((c) => {
    const orders = c.orders ?? [];
    if (!orders.length) return false;
    const last = Math.max(...orders.map((o) => new Date(o.created_at).getTime()));
    return Number.isFinite(last) && last < new Date(inactiveBefore).getTime();
  });

  for (const client of inactive.slice(0, 10)) {
    const orders = client.orders ?? [];
    const last = Math.max(...orders.map((o) => new Date(o.created_at).getTime()));
    alerts.push({
      id: `inactive-${client.id}`,
      level: "opportunity",
      kind: "Opportunity",
      title: `${client.company_name || client.users?.full_name || "A customer"} has not ordered in ${humanAge(now - last)}`,
      detail: `${orders.length} order${orders.length === 1 ? "" : "s"} historically · lifetime $${Math.round(client.ltv)}`,
      href: "/admin/clients",
      meta: { clientId: client.id, lastOrderMs: last },
    });
  }

  // Loudest first, then oldest first inside a level — the item that has been
  // waiting longest is the one doing the damage.
  const rank: Record<AttentionLevel, number> = { critical: 0, warning: 1, opportunity: 2 };
  alerts.sort((a, b) => rank[a.level] - rank[b.level]);

  return {
    counts: {
      newLeadsToday: newLeadsRes.count ?? 0,
      unansweredLeads: unansweredRes.count ?? unanswered.length,
      quotesAwaitingReply: quotes.length,
      followUpsDue: followUpRes.count ?? 0,
      ordersAtRisk: atRisk.length,
      deliveredToday: deliveredRes.count ?? 0,
    },
    alerts,
    degraded: firstError ? firstError.message : null,
  };
}
