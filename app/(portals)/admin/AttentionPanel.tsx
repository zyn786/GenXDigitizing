"use client";

import Link from "next/link";
import type { AttentionAlert, AttentionReport } from "@/lib/supabase/attention";

/**
 * "What needs attention right now", at the top of the admin dashboard.
 *
 * The point is that every line is actionable and clickable. A dashboard of
 * totals tells you the month is fine; it does not tell you that a lead has been
 * waiting 40 minutes. The counts are the ones that change what somebody does in
 * the next hour.
 *
 * Counts of zero are not shown as greyed-out tiles — a wall of zeros is noise
 * that trains people to stop reading. When nothing needs attention, the panel
 * says so in one line and gets out of the way.
 */

const LEVEL = {
  critical: {
    text: "#B91C1C",
    soft: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.28)",
    dot: "#DC2626",
  },
  warning: {
    text: "#B45309",
    soft: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.28)",
    dot: "#D97706",
  },
  opportunity: {
    text: "#1D4ED8",
    soft: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.25)",
    dot: "#2563EB",
  },
} as const;

function CountTile({
  value,
  label,
  href,
  tone,
}: {
  value: number;
  label: string;
  href: string;
  tone: "critical" | "warning";
}) {
  const c = LEVEL[tone];
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border px-3.5 py-3 no-underline transition-all hover:-translate-y-0.5"
      style={{ background: c.soft, borderColor: c.border }}
    >
      <span className="font-syne text-[22px] font-bold leading-none" style={{ color: c.text }}>
        {value}
      </span>
      <span className="text-[12px] font-semibold leading-tight" style={{ color: c.text }}>
        {label}
      </span>
    </Link>
  );
}

export function AttentionPanel({ report }: { report: AttentionReport }) {
  const { counts, alerts, degraded } = report;

  const tiles = [
    counts.unansweredLeads > 0 && {
      value: counts.unansweredLeads,
      label: `unanswered lead${counts.unansweredLeads === 1 ? "" : "s"}`,
      href: "/crm/leads",
      tone: "critical" as const,
    },
    counts.ordersAtRisk > 0 && {
      value: counts.ordersAtRisk,
      label: `order${counts.ordersAtRisk === 1 ? "" : "s"} at risk`,
      href: "/admin/orders",
      tone: "critical" as const,
    },
    counts.quotesAwaitingReply > 0 && {
      value: counts.quotesAwaitingReply,
      label: `quote${counts.quotesAwaitingReply === 1 ? "" : "s"} waiting`,
      href: "/crm/leads",
      tone: "warning" as const,
    },
    counts.followUpsDue > 0 && {
      value: counts.followUpsDue,
      label: `follow-up${counts.followUpsDue === 1 ? "" : "s"} due`,
      href: "/crm/leads",
      tone: "warning" as const,
    },
  ].filter(Boolean) as {
    value: number;
    label: string;
    href: string;
    tone: "critical" | "warning";
  }[];

  const nothingNeedsAttention = tiles.length === 0 && alerts.length === 0;

  return (
    <section className="mb-5 sm:mb-6" aria-labelledby="attention-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3
          id="attention-heading"
          className="font-syne text-[15px] font-bold sm:text-base"
          style={{ color: "var(--txt)" }}
        >
          Needs attention
        </h3>
        <span className="text-[11px]" style={{ color: "var(--txt3)" }}>
          {counts.newLeadsToday} new lead{counts.newLeadsToday === 1 ? "" : "s"} today ·{" "}
          {counts.deliveredToday} delivered today
        </span>
      </div>

      {degraded && (
        <div
          className="mb-3 rounded-xl border px-3.5 py-2.5 text-[12px]"
          style={{
            background: LEVEL.warning.soft,
            borderColor: LEVEL.warning.border,
            color: LEVEL.warning.text,
          }}
        >
          Some figures could not be loaded — this panel is incomplete, not clear. ({degraded})
        </div>
      )}

      {nothingNeedsAttention && !degraded && (
        <div
          className="rounded-xl border px-4 py-3 text-[13px]"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--txt2)",
          }}
        >
          Nothing is waiting. No unanswered leads, no quotes outstanding, no orders inside their
          deadline window.
        </div>
      )}

      {tiles.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {tiles.map((t) => (
            <CountTile key={t.label} {...t} />
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {alerts.slice(0, 12).map((a: AttentionAlert, i: number) => {
            const c = LEVEL[a.level];
            return (
              <Link
                key={a.id}
                href={a.href}
                className="flex items-start gap-3 px-3.5 py-3 no-underline transition-colors hover:bg-black/[0.02]"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
              >
                <span
                  className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: c.dot }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold" style={{ color: "var(--txt)" }}>
                    {a.title}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: "var(--txt3)" }}>
                    {a.detail}
                  </span>
                </span>
                <span
                  className="flex-shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: c.soft, color: c.text, borderColor: c.border }}
                >
                  {a.kind}
                </span>
              </Link>
            );
          })}
          {alerts.length > 12 && (
            <div
              className="px-3.5 py-2 text-[11.5px]"
              style={{ borderTop: "1px solid var(--border)", color: "var(--txt3)" }}
            >
              +{alerts.length - 12} more
            </div>
          )}
        </div>
      )}
    </section>
  );
}
