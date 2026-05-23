// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatRelative, getInitials } from "@/lib/utils";
import { Star, MessageSquare, Trophy, TrendingUp } from "lucide-react";

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

interface Props {
  reviews: any[]; avgRating: number; total: number; fiveStarPct: number; fourPlusPct: number;
}

export function AdminReviewsUI({ reviews, avgRating, total, fiveStarPct, fourPlusPct }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [,startTx] = useTransition();
  const [filter, setFilter] = useState(0);

  const filtered = filter === 0 ? reviews : reviews.filter(r => r.stars === filter);

  async function togglePublished(id: string, current: boolean) {
    const { error } = await supabase.from("reviews").update({ is_published: !current } as any).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    toast.success(!current ? "Review published" : "Review unpublished");
    startTx(() => router.refresh());
  }

  function Stars({ n, size = 14 }: { n: number; size?: number }) {
    return (
      <span>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: i <= n ? "#F59E0B" : "#D1D5DB", fontSize: size }}>★</span>
        ))}
      </span>
    );
  }

  const sums = [
    { label: "Avg Rating", val: total ? `${avgRating} ⭐` : "—", icon: <Star size={16} />, ci: 2 },
    { label: "Total Reviews", val: total, icon: <MessageSquare size={16} />, ci: 4 },
    { label: "5-Star Rate", val: `${fiveStarPct}%`, icon: <Trophy size={16} />, ci: 1 },
    { label: "4+ Star Rate", val: `${fourPlusPct}%`, icon: <TrendingUp size={16} />, ci: 3 },
  ];

  const starTabs = [0, 5, 4, 3, 2, 1].map(n => ({
    n,
    label: n === 0 ? "All" : "★".repeat(n),
    count: n === 0 ? reviews.length : reviews.filter(r => r.stars === n).length,
    ci: n === 0 ? 0 : 2,
  }));

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-syne font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Reviews
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>Client feedback on completed orders</p>
      </div>

      {/* Stat cards — 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        {sums.map(s => {
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
              <div className="font-syne font-bold text-lg sm:text-xl" style={{ color: c.text }}>{s.val}</div>
            </div>
          );
        })}
      </div>

      {/* Star filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {starTabs.map(tab => {
          const c = clr[tab.ci];
          const isActive = filter === tab.n;
          return (
            <button key={tab.n} onClick={() => setFilter(tab.n)}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all active:scale-95"
              style={{
                background: isActive ? c.bgSoft : "var(--elevated)",
                color: isActive ? c.text : txt2,
                borderColor: isActive ? c.border : "var(--border2)",
              }}>
              {tab.label}
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">⭐</p>
          <p className="font-syne font-bold text-base mb-1" style={{ color: txt }}>No reviews found</p>
          <p className="text-sm" style={{ color: txt2 }}>
            {filter !== 0 ? "No reviews match the selected star filter." : "Reviews appear automatically after order delivery"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(r => {
            const client = (r.clients as any);
            const order = (r.orders as any);
            const initials = getInitials(client?.company_name ?? "?");
            const isPublished = r.is_published;
            return (
              <div key={r.id} className="rounded-2xl p-4 sm:p-5 border"
                style={{ background: "var(--surface)", borderColor: isPublished ? "var(--border)" : clr[5].border }}>
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full flex items-center justify-center text-[12px] sm:text-[13px] font-bold text-white flex-shrink-0 font-syne"
                      style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[3].bg})` }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[13px] sm:text-sm" style={{ color: txt }}>{client?.company_name ?? "—"}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[11px]" style={{ color: txt2 }}>
                        <span className="font-mono font-bold" style={{ color: clr[4].text }}>{order?.order_number}</span>
                        <span className="w-1 h-1 rounded-full" style={{ background: txt3 }} />
                        <span>{(order?.service_tiers as any)?.label}</span>
                        <span className="w-1 h-1 rounded-full hidden sm:inline" style={{ background: txt3 }} />
                        <span className="hidden sm:inline">{formatRelative(r.created_at)}</span>
                      </div>
                      <div className="text-[10px] mt-0.5 sm:hidden" style={{ color: txt3 }}>{formatRelative(r.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
                    <Stars n={r.stars} size={15} />
                    <button onClick={() => togglePublished(r.id, isPublished)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-all active:scale-95"
                      style={{
                        background: isPublished ? clr[1].bgSoft : clr[5].bgSoft,
                        color: isPublished ? clr[1].text : clr[5].text,
                        borderColor: isPublished ? clr[1].border : clr[5].border,
                      }}>
                      {isPublished ? "Published" : "Hidden"}
                    </button>
                  </div>
                </div>
                {/* Review text */}
                {r.text && (
                  <p className="text-[13px] leading-relaxed rounded-xl p-2.5 sm:p-3 italic"
                    style={{ background: "var(--elevated)", color: txt2, borderLeft: `3px solid ${clr[4].icon}` }}>
                    "{r.text}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
