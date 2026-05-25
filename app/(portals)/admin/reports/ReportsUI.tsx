// @ts-nocheck
"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { formatCurrency, getInitials } from "@/lib/utils";
import { TrendingUp, DollarSign, Users, ShoppingCart } from "lucide-react";

const CARD_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D" },
];

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
const clr = CARD_COLORS;

const PIE_COLORS = ["#A855F7","#22D3EE","#34D399","#FCD34D","#FB7185","#F97316"];

interface Props {
  monthly: { month: string; revenue: number; orders: number }[];
  breakdown: { label: string; count: number; revenue: number; pct: number }[];
  designers: any[];
  topClients: any[];
  totalRevenue: number;
  totalOrders: number;
  avgValue: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) { return null; }
  return (
    <div style={{ background: "var(--elevated)", border: "1px solid var(--border2)", borderRadius: 10, padding: "8px 14px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <p style={{ color: txt2, marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? "#8B5CF6", fontWeight: 700, fontFamily: "Syne,sans-serif" }}>
          {p.name === "revenue" ? formatCurrency(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
};

export function AdminReportsUI({
  monthly, breakdown, designers, topClients,
  totalRevenue, totalOrders, avgValue,
}: Props) {
  const maxRevenue = Math.max(...monthly.map(m => m.revenue), 1);

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-jakarta font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Reports & Analytics
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>
          {new Date().getFullYear()} performance overview
        </p>
      </div>

      {/* KPI row — 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        {[
          { label: "Annual Revenue", val: formatCurrency(totalRevenue, "USD", true), icon: <DollarSign size={16} />, ci: 4 },
          { label: "Total Orders", val: totalOrders, icon: <ShoppingCart size={16} />, ci: 2 },
          { label: "Avg Order Value", val: formatCurrency(avgValue), icon: <TrendingUp size={16} />, ci: 1 },
          { label: "Active Designers", val: designers.length, icon: <Users size={16} />, ci: 3 },
        ].map(s => {
          const c = clr[s.ci];
          return (
            <div key={s.label} className="rounded-2xl p-3 sm:p-3.5 transition-all duration-200 hover:translate-y-[-2px]"
              style={{ background: c.bgSoft, border: `1px solid ${c.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bgSoft, color: c.icon }}>
                  {s.icon}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold" style={{ color: txt2 }}>{s.label}</div>
              </div>
              <div className="font-jakarta font-bold text-lg sm:text-xl" style={{ color: c.text }}>{s.val}</div>
            </div>
          );
        })}
      </div>

      {/* Monthly revenue bar chart */}
      <div className="rounded-2xl p-4 sm:p-5 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: txt }}>
          Monthly Revenue — {new Date().getFullYear()}
        </h3>
        {totalRevenue === 0 ? (
          <div className="text-center py-8 opacity-40">
            <p className="text-sm" style={{ color: txt3 }}>No revenue data yet — appears as orders are paid</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barSize={24}>
              <XAxis dataKey="month" tick={{ fill: txt3, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: txt3, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? "$0" : formatCurrency(v, "USD", true)} width={55} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)" }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {monthly.map((m, i) => (
                  <Cell key={i} fill={m.revenue === maxRevenue ? "url(#barGrad)" : "#D1D5DB"} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Service breakdown + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4">
        {/* Bar breakdown */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="font-jakarta font-bold text-sm mb-3" style={{ color: txt }}>Revenue by Service</h3>
          {breakdown.length === 0 ? (
            <p className="text-sm text-center py-5" style={{ color: txt3 }}>No orders yet</p>
          ) : breakdown.slice(0, 6).map((s, i) => (
            <div key={s.label} className="mb-3 last:mb-0">
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color: txt2 }}>{s.label}</span>
                <div className="flex gap-2.5">
                  <span className="text-xs" style={{ color: txt3 }}>{s.count} orders</span>
                  <span className="text-xs font-bold font-jakarta" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                    {formatCurrency(s.revenue)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="font-jakarta font-bold text-sm mb-3" style={{ color: txt }}>Order Mix</h3>
          {breakdown.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: txt3 }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={breakdown.slice(0, 6)} dataKey="count" nameKey="label" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {breakdown.slice(0, 6).map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--elevated)", border: "1px solid var(--border2)", borderRadius: 10, fontSize: 12, color: txt }}
                  formatter={(val: any, name: any) => [`${val} orders`, name]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: txt2 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Designer performance + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Designers */}
        <div className="rounded-2xl p-4 sm:p-5 overflow-x-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="font-jakarta font-bold text-sm mb-3" style={{ color: txt }}>Designer Performance</h3>
          {designers.length === 0 ? (
            <p className="text-sm text-center py-5" style={{ color: txt3 }}>No designers yet</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Designer","Done","Avg Turn","Rev %","Rating"].map(h => (
                    <th key={h} className="text-left px-2 py-1.5 text-[10px] uppercase tracking-[0.4px] font-semibold"
                      style={{ color: txt3, borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {designers.map((d: any) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="p-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg,#F59E0B,#F97316)` }}>
                        {getInitials((d.users as any)?.full_name ?? "")}
                      </div>
                      <span className="text-xs font-medium" style={{ color: txt }}>{(d.users as any)?.full_name ?? "—"}</span>
                    </td>
                    <td className="p-2 text-xs font-bold" style={{ color: "#34D399" }}>{d.completed_orders}</td>
                    <td className="p-2 text-xs" style={{ color: "#22D3EE" }}>{Number(d.avg_turnaround_h).toFixed(1)}h</td>
                    <td className="p-2 text-xs" style={{ color: Number(d.revision_rate) > 5 ? "#FB7185" : "#34D399" }}>{Number(d.revision_rate).toFixed(0)}%</td>
                    <td className="p-2 text-xs" style={{ color: "#FCD34D" }}>
                      {"★".repeat(Math.round(d.avg_rating))}
                      <span style={{ color: txt3, marginLeft: 3 }}>{Number(d.avg_rating).toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top clients */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="font-jakarta font-bold text-sm mb-3" style={{ color: txt }}>Top Clients by LTV</h3>
          {topClients.length === 0 ? (
            <p className="text-sm text-center py-5" style={{ color: txt3 }}>No clients yet</p>
          ) : topClients.map((c: any, i: number) => {
            const maxLtv = Number(topClients[0]?.ltv ?? 1);
            const pct = Math.round((Number(c.ltv) / maxLtv) * 100);
            return (
              <div key={c.id} className="mb-2.5 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: txt3, width: 16 }}>#{i + 1}</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: i === 0 ? "linear-gradient(135deg,#F59E0B,#F97316)" : "linear-gradient(135deg,#7C3AED,#06B6D4)" }}>
                      {getInitials(c.company_name ?? "?")}
                    </div>
                    <span className="text-xs font-medium" style={{ color: txt }}>{c.company_name}</span>
                    {c.tier === "vip" && <span className="text-[10px]">👑</span>}
                  </div>
                  <span className="text-[13px] font-bold font-jakarta" style={{ color: "#34D399" }}>{formatCurrency(c.ltv)}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: i === 0 ? "linear-gradient(90deg,#F59E0B,#F97316)" : "linear-gradient(90deg,#7C3AED,#A855F7)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
