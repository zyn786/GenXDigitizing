// @ts-nocheck
"use client";

import Link from "next/link";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, Package, DollarSign, Star, Clock, Users, ShoppingCart, Activity } from "lucide-react";
import { formatCurrency, STATUS_CLASS, STATUS_LABEL, TURNAROUND_OPTIONS } from "@/lib/utils";

interface Stats {
  orders_mtd: number; orders_prev: number; revenue_mtd: number; revenue_prev: number;
  active_clients: number; active_orders: number; avg_rating: number; total_reviews: number;
  weekly: { day: string; orders: number }[];
}

interface Props { stats: Stats; recentOrders: any[]; breakdown: { label: string; count: number; pct: number }[]; }

function pctDelta(curr: number, prev: number) {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

// Bright, visually distinct stat card palette
const CARD_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D" },
];

export function AdminDashClient({ stats, recentOrders, breakdown }: Props) {
  const revDelta = pctDelta(stats.revenue_mtd, stats.revenue_prev);
  const ordersDelta = pctDelta(stats.orders_mtd, stats.orders_prev);

  const statCards = [
    { label: "Revenue MTD", value: formatCurrency(stats.revenue_mtd, "USD", true), delta: revDelta !== null ? `${revDelta > 0 ? "+" : ""}${revDelta}%` : null, up: (revDelta ?? 0) >= 0, sub: "collected this month", icon: <DollarSign size={18} />, ci: 0 },
    { label: "Orders MTD", value: stats.orders_mtd.toLocaleString(), delta: ordersDelta !== null ? `${ordersDelta > 0 ? "+" : ""}${ordersDelta}%` : null, up: (ordersDelta ?? 0) >= 0, sub: "vs last month", icon: <ShoppingCart size={18} />, ci: 1 },
    { label: "Active Orders", value: stats.active_orders.toString(), delta: null, up: true, sub: "in progress now", icon: <Activity size={18} />, ci: 2 },
    { label: "Active Clients", value: stats.active_clients.toString(), delta: null, up: true, sub: "with active orders", icon: <Users size={18} />, ci: 3 },
    { label: "Avg Rating", value: stats.avg_rating > 0 ? `${stats.avg_rating} ⭐` : "—", delta: null, up: true, sub: `${stats.total_reviews} total reviews`, icon: <Star size={18} />, ci: 4 },
    { label: "Pending", value: recentOrders.filter((o: any) => o.status === "pending").length.toString(), delta: null, up: false, sub: "needs attention", icon: <Clock size={18} />, ci: 5 },
  ];

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h2
          className="font-jakarta font-bold text-xl sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Platform Overview
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: "var(--txt3)" }}>
          Live metrics — updates on every page load
        </p>
      </div>

      {/* Stat cards — 2-col mobile, 3-col tablet, 3-col desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        {statCards.map((s) => {
          const clr = CARD_COLORS[s.ci];
          return (
            <div
              key={s.label}
              className="rounded-2xl p-3.5 sm:p-4 transition-all duration-200 hover:translate-y-[-2px]"
              style={{
                background: clr.bgSoft,
                border: `1px solid ${clr.border}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: clr.bgSoft, color: clr.icon }}
                >
                  {s.icon}
                </div>
                <p
                  className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold leading-tight"
                  style={{ color: "var(--txt2)" }}
                >
                  {s.label}
                </p>
              </div>
              <p
                className="font-jakarta font-extrabold text-[22px] sm:text-[26px] mb-1.5 leading-tight"
                style={{ color: clr.text }}
              >
                {s.value}
              </p>
              {s.delta !== null ? (
                <div className="flex items-center gap-1.5">
                  {s.up ? <TrendingUp size={12} color="#059669" /> : <TrendingDown size={12} color="#DC2626" />}
                  <span className="text-[11px] font-bold" style={{ color: s.up ? "#059669" : "#DC2626" }}>
                    {s.delta}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--txt3)" }}>
                    {s.sub}
                  </span>
                </div>
              ) : (
                <p className="text-[11px]" style={{ color: "var(--txt3)" }}>
                  {s.sub}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts section — stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        {/* Weekly volume */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
            <h3 className="font-jakarta font-bold text-sm" style={{ color: "var(--txt)" }}>
              Weekly Volume
            </h3>
            <span
              className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-semibold"
              style={{
                background: CARD_COLORS[0].bgSoft,
                color: CARD_COLORS[0].text,
                border: `1px solid ${CARD_COLORS[0].border}`,
              }}
            >
              Last 7 days
            </span>
          </div>
          {/* Mobile: horizontal bars */}
          <div className="sm:hidden">
            <div className="flex items-end gap-1.5 h-[80px]">
              {stats.weekly.map((d, i) => {
                const max = Math.max(...stats.weekly.map((x) => x.orders), 1);
                const h = Math.max(10, (d.orders / max) * 80);
                const isToday = i === stats.weekly.length - 1;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] font-bold" style={{ color: CARD_COLORS[0].text }}>
                      {d.orders}
                    </span>
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${h}px`,
                        background: isToday
                          ? "linear-gradient(180deg, #3B82F6, #8B5CF6)"
                          : "#D1D5DB",
                      }}
                    />
                    <span className="text-[9px]" style={{ color: "var(--txt3)" }}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Desktop: chart */}
          <div className="hidden sm:block">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={stats.weekly} barSize={24}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--txt3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--txt)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ color: "var(--txt)", fontWeight: 600 }}
                  cursor={{ fill: "var(--border)" }}
                />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                  {stats.weekly.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        i === stats.weekly.length - 1
                          ? "url(#todayGrad)"
                          : "#D1D5DB"
                      }
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service mix */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: "var(--txt)" }}>
            Service Mix (30 days)
          </h3>
          {breakdown.length === 0 ? (
            <p className="text-sm text-center pt-5" style={{ color: "var(--txt3)" }}>
              No orders yet
            </p>
          ) : (
            breakdown.map((s, i) => {
              const clr = CARD_COLORS[i % CARD_COLORS.length];
              return (
                <div key={s.label} className="mb-4 last:mb-0">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-medium" style={{ color: "var(--txt)" }}>
                      {s.label}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: clr.text }}>
                      {s.pct}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ background: "#E5E7EB" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.pct}%`,
                        background: `linear-gradient(135deg, ${clr.bg}, ${clr.icon})`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 sm:p-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3 className="font-jakarta font-bold text-sm" style={{ color: "var(--txt)" }}>
            Recent Orders
          </h3>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-200 no-underline hover:translate-x-0.5 self-start sm:self-auto"
            style={{
              color: CARD_COLORS[0].text,
              background: CARD_COLORS[0].bgSoft,
              borderColor: CARD_COLORS[0].border,
            }}
          >
            View all <ArrowUpRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-14 text-center text-sm" style={{ color: "var(--txt3)" }}>
            No orders yet
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden flex flex-col gap-2 p-3">
              {recentOrders.slice(0, 8).map((o: any) => {
                const t = TURNAROUND_OPTIONS[o.turnaround as keyof typeof TURNAROUND_OPTIONS];
                return (
                  <Link key={o.id} href={`/admin/orders/${o.id}`} className="no-underline">
                    <div
                      className="rounded-xl p-4 active:opacity-80 transition-all"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[14px] font-bold" style={{ color: "var(--txt)" }}>
                          {o.order_number}
                        </span>
                        <span
                          className={STATUS_CLASS[o.status]}
                          style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, border: "1px solid" }}
                        >
                          {STATUS_LABEL[o.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[13px] mb-3" style={{ color: "var(--txt2)" }}>
                        <span className="font-medium">{o.clients?.company_name ?? "—"}</span>
                        <span className="w-1 h-1 rounded-full" style={{ background: "var(--txt3)" }} />
                        <span>{o.service_tiers?.label ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-jakarta font-bold text-lg" style={{ color: "#059669" }}>
                          ${o.price}
                        </span>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 500,
                            background: `${t.color}18`,
                            color: t.color,
                            border: `1px solid ${t.color}30`,
                          }}
                        >
                          {t.icon} {t.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                    {["Order", "Client", "Service", "Format", "Price", "Turnaround", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--txt3)", borderBottom: "1px solid var(--border)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: any) => {
                    const t = TURNAROUND_OPTIONS[o.turnaround as keyof typeof TURNAROUND_OPTIONS];
                    return (
                      <tr
                        key={o.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--elevated)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${o.id}`} className="no-underline">
                            <span className="font-mono text-xs font-bold" style={{ color: CARD_COLORS[0].text }}>
                              {o.order_number}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium" style={{ color: "var(--txt)" }}>
                          {o.clients?.company_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--txt2)" }}>
                          {o.service_tiers?.label ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="font-mono text-[11px] px-2 py-0.5 rounded-md border"
                            style={{
                              background: "var(--elevated)",
                              color: "var(--txt2)",
                              borderColor: "var(--border2)",
                            }}
                          >
                            {o.output_format}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-jakarta font-bold text-[13px]" style={{ color: "#059669" }}>
                          ${o.price}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: 10,
                              fontWeight: 500,
                              background: `${t.color}15`,
                              color: t.color,
                              border: `1px solid ${t.color}25`,
                            }}
                          >
                            {t.icon} {t.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={STATUS_CLASS[o.status]}
                            style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, border: "1px solid" }}
                          >
                            {STATUS_LABEL[o.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
