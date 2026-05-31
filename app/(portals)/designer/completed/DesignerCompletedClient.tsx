// @ts-nocheck
"use client";
import { useState } from "react";
import { Star, CheckCircle2, Clock, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate, TURNAROUND_OPTIONS } from "@/lib/utils";
import { PageShell, PageHeader, StatGrid, FilterTabs, CardList, EmptyState } from "@/components/ui/Layout";
import { TAB_COLORS } from "@/lib/design-tokens";

const STAT_COLORS = [
  { bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.20)", icon: "#2563EB", text: "#1D4ED8" },
  { bgSoft: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.20)", icon: "#D97706", text: "#92400E" },
  { bgSoft: "rgba(6,182,212,0.08)",  border: "rgba(6,182,212,0.20)",  icon: "#0891B2", text: "#0E7490" },
  { bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.20)", icon: "#059669", text: "#047857" },
];

type Order = any;

export function DesignerCompletedClient({ orders, profile, designerName, designerAvatar }: {
  orders: Order[]; profile: any; designerName: string; designerAvatar?: string;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const completed = profile?.completed_orders ?? orders.length;
  const avgRating = profile?.avg_rating ? Number(profile.avg_rating).toFixed(1) : null;
  const avgTurnaround = profile?.avg_turnaround_h ? Number(profile.avg_turnaround_h).toFixed(1) : null;
  const revisionRate = profile?.revision_rate ? Number(profile.revision_rate).toFixed(0) : null;

  const counts = {
    all: orders.length,
    approved: orders.filter((o: Order) => o.status === "approved").length,
    delivered: orders.filter((o: Order) => o.status === "delivered").length,
    urgent: orders.filter((o: Order) => o.turnaround === "urgent").length,
    rush: orders.filter((o: Order) => o.turnaround === "rush").length,
    standard: orders.filter((o: Order) => o.turnaround === "standard").length,
    fiveStar: orders.filter((o: Order) => o.reviews?.[0]?.stars >= 5).length,
  };

  let filtered = orders;
  if (filter === "approved") filtered = orders.filter((o: Order) => o.status === "approved");
  else if (filter === "delivered") filtered = orders.filter((o: Order) => o.status === "delivered");
  else if (filter === "urgent") filtered = orders.filter((o: Order) => o.turnaround === "urgent");
  else if (filter === "rush") filtered = orders.filter((o: Order) => o.turnaround === "rush");
  else if (filter === "standard") filtered = orders.filter((o: Order) => o.turnaround === "standard");
  else if (filter === "fiveStar") filtered = orders.filter((o: Order) => o.reviews?.[0]?.stars >= 5);

  const filterTabs = [
    { key: "all", label: "All", icon: "📋", count: counts.all, color: TAB_COLORS.all },
    { key: "approved", label: "Approved", icon: "✅", count: counts.approved, color: TAB_COLORS.approved },
    { key: "delivered", label: "Delivered", icon: "🚀", count: counts.delivered, color: TAB_COLORS.delivered },
    { key: "fiveStar", label: "5★ Rated", icon: "⭐", count: counts.fiveStar, color: TAB_COLORS.fiveStar },
    { key: "urgent", label: "Urgent", icon: "🔥", count: counts.urgent, color: TAB_COLORS.urgent },
    { key: "rush", label: "Rush", icon: "⚡", count: counts.rush, color: TAB_COLORS.rush },
    { key: "standard", label: "Standard", icon: "🕐", count: counts.standard, color: TAB_COLORS.standard },
  ];

  return (
    <PageShell>
      <PageHeader
        name={designerName}
        avatar={designerAvatar}
        badge="Designer"
        badgeColor="#10B981"
        avatarGradient="linear-gradient(135deg, #10B981, #06B6D4)"
        right={avgRating ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#D97706" }}>
            <Star size={13} fill="#D97706" /> {avgRating}
          </span>
        ) : undefined}
        title="Completed Jobs"
        titleGradient="linear-gradient(135deg, #10B981, #06B6D4, #6366F1)"
        subtitle={`${orders.length} jobs completed · ${counts.approved} approved · ${counts.delivered} delivered · ${counts.fiveStar} top-rated`}
      />

      <StatGrid items={[
        { label: "Completed", value: completed, icon: <CheckCircle2 size={15} />, color: STAT_COLORS[0] },
        { label: "Avg Rating", value: avgRating ? `${avgRating} ★` : "—", icon: <Star size={15} />, color: STAT_COLORS[1] },
        { label: "Avg Turnaround", value: avgTurnaround ? `${avgTurnaround}h` : "—", icon: <Clock size={15} />, color: STAT_COLORS[2] },
        { label: "Revision Rate", value: revisionRate !== null ? `${revisionRate}%` : "—", icon: <RotateCcw size={15} />, color: revisionRate !== null && Number(revisionRate) > 5 ? STAT_COLORS[0] : STAT_COLORS[3] },
      ]} />

      <FilterTabs tabs={filterTabs} active={filter} onChange={setFilter} />

      {orders.length === 0 ? (
        <EmptyState icon="🏁" title="No completed jobs yet" description="Finished orders will appear here" />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching jobs" description="Try a different filter" />
      ) : (
        <CardList>
          {filtered.map((o: Order) => {
            const isOpen = expanded.has(o.id);
            const r = o.reviews?.[0];
            const t = TURNAROUND_OPTIONS[o.turnaround] ?? TURNAROUND_OPTIONS.standard;
            const statusColor = o.status === "approved" ? "#06B6D4" : "#10B981";
            const statusBg = o.status === "approved" ? "rgba(6,182,212,0.08)" : "rgba(16,185,129,0.08)";
            const statusText = o.status === "approved" ? "#0E7490" : "#047857";
            const statusBorder = o.status === "approved" ? "rgba(6,182,212,0.25)" : "rgba(16,185,129,0.25)";

            return (
              <CardList.Item key={o.id} id={o.id} expanded={isOpen} onToggle={toggle} accentColor={statusColor}
                header={
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-sm font-bold tracking-tight"
                          style={{ background: "linear-gradient(90deg, #10B981, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          {o.order_number}
                        </span>
                        <span className="text-2xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: statusBg, color: statusText, border: `1px solid ${statusBorder}` }}>
                          {o.status?.replace(/_/g, " ")}
                        </span>
                        <span className="text-2xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}40` }}>
                          {t.icon} {t.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--txt)" }}>
                        {o.clients?.company_name ?? "—"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--txt2)" }}>
                        <span>{o.service_tiers?.label ?? ""}</span>
                        <span className="text-2xs px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--elevated)", color: "var(--txt3)" }}>
                          {o.output_format}
                        </span>
                        {r && (
                          <span className="inline-flex items-center gap-1" style={{ color: "#D97706" }}>
                            <Star size={10} fill="#D97706" /> {r.stars}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <span className="text-2xs hidden sm:inline" style={{ color: "var(--txt3)" }}>
                        {o.delivered_at ? formatDate(o.delivered_at, { month: "short", day: "numeric" }) : ""}
                      </span>
                      {isOpen ? <ChevronUp size={16} style={{ color: "var(--txt3)" }} /> : <ChevronDown size={16} style={{ color: "var(--txt3)" }} />}
                    </div>
                  </div>
                }>
                {/* Expanded detail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-2xs uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--txt3)" }}>Order Details</p>
                    {[
                      ["Design", o.design_name || "—"],
                      ["Service", o.service_tiers?.label],
                      ["Size", o.service_tiers?.size_desc],
                      ["Stitches", o.stitch_count ? o.stitch_count.toLocaleString() : "—"],
                      ["Format", o.output_format],
                      ["Colors", o.color_count ?? "—"],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between py-1.5 text-xs" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span style={{ color: "var(--txt3)" }}>{l}</span>
                        <span style={{ color: "var(--txt)", fontWeight: 500 }}>{v ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-2xs uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--txt3)" }}>Timeline</p>
                    {[
                      ["Delivered", o.delivered_at ? formatDate(o.delivered_at, { month: "short", day: "numeric", year: "numeric" }) : "—"],
                      ["Turnaround", `${t.icon} ${t.label}`],
                      ["Created", o.created_at ? formatDate(o.created_at, { month: "short", day: "numeric", year: "numeric" }) : "—"],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between py-1.5 text-xs" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span style={{ color: "var(--txt3)" }}>{l}</span>
                        <span style={{ color: "var(--txt)", fontWeight: 500 }}>{v ?? "—"}</span>
                      </div>
                    ))}
                    {r && (
                      <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
                        <p className="text-2xs uppercase tracking-wider font-semibold mb-2" style={{ color: "#92400E" }}>Client Review</p>
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={14} fill={i <= r.stars ? "#D97706" : "none"}
                              style={{ color: i <= r.stars ? "#D97706" : "var(--border2)" }} />
                          ))}
                        </div>
                        {r.text && <p className="text-xs mt-1.5 leading-relaxed italic" style={{ color: "var(--txt2)" }}>"{r.text}"</p>}
                      </div>
                    )}
                  </div>
                </div>
                {o.order_files?.length > 0 && (
                  <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-2xs uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--txt3)" }}>
                      Files ({o.order_files.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {o.order_files.map((f: any) => (
                        <span key={f.id} className="text-2xs px-2 py-1 rounded-lg font-medium"
                          style={{
                            background: f.file_type === "output" ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.06)",
                            color: f.file_type === "output" ? "#047857" : "#4338CA",
                            border: `1px solid ${f.file_type === "output" ? "rgba(16,185,129,0.20)" : "rgba(99,102,241,0.18)"}`,
                          }}>
                          {f.file_type === "output" ? "📎 " : "🖼 "}{f.file_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardList.Item>
            );
          })}
        </CardList>
      )}
    </PageShell>
  );
}
