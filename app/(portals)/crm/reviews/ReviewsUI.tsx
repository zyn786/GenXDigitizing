// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter }               from "next/navigation";
import { toast }                   from "sonner";
import { createClient }            from "@/lib/supabase/client";
import { formatDate }              from "@/lib/utils";

export function CRMReviewsUI({ reviews: initial }: { reviews: any[] }) {
  const router     = useRouter();
  const supabase   = createClient();
  const [,startTx] = useTransition();
  const [reviews,  setReviews]  = useState(initial);
  const [filter,   setFilter]   = useState(0);

  const avg     = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
  const counts  = [5,4,3,2,1].map(n => ({ n, count: reviews.filter(r => r.stars === n).length }));

  async function toggle(id: string, current: boolean) {
    const { error } = await supabase.from("reviews").update({ is_published: !current }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    setReviews(r => r.map(rev => rev.id === id ? { ...rev, is_published: !current } : rev));
    toast.success(!current ? "Review published" : "Review hidden");
    startTx(() => router.refresh());
  }

  const filtered = filter === 0 ? reviews : reviews.filter(r => r.stars === filter);

  return (
    <div className="portal-content">
      {/* Stats header */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 22px" }}>
        {/* Big average */}
        <div style={{ textAlign: "center", paddingRight: 20, borderRight: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 48, background: "linear-gradient(135deg,#FCD34D,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
            {avg > 0 ? avg.toFixed(1) : "—"}
          </div>
          <div style={{ fontSize: 22, color: "#FCD34D", letterSpacing: 2, marginTop: 4 }}>
            {"★".repeat(Math.round(avg))}
          </div>
          <div style={{ fontSize: 12, color: "var(--txt3)", marginTop: 4 }}>{reviews.length} reviews</div>
        </div>

        {/* Star breakdown */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          {counts.map(({ n, count }) => {
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                onClick={() => setFilter(filter === n ? 0 : n)}>
                <span style={{ fontSize: 12, color: filter === n ? "#FCD34D" : "#475569", fontWeight: filter === n ? 700 : 400, minWidth: 24 }}>{n}★</span>
                <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#F59E0B,#FCD34D)", borderRadius: 3, transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--txt3)", minWidth: 36, textAlign: "right" }}>{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter label */}
      {filter > 0 && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--txt2)" }}>Showing {filter}-star reviews</span>
          <button onClick={() => setFilter(0)} style={{ fontSize: 11, color: "#A855F7", background: "none", border: "none", cursor: "pointer" }}>Clear filter</button>
        </div>
      )}

      {/* Reviews list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", opacity: .5 }}>
            <p style={{ fontSize: 13, color: "var(--txt3)" }}>No reviews for this filter</p>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{ background: "var(--surface)", border: `1px solid ${r.is_published ? "rgba(52,211,153,0.15)" : "var(--border)"}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.clients?.users?.full_name ?? r.clients?.company_name ?? "Client"}</div>
                <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2 }}>{r.clients?.company_name}</div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#A855F7", marginTop: 2 }}>{r.orders?.order_number}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 16, color: "#FCD34D" }}>{"★".repeat(r.stars)}<span style={{ color: "#1e2230" }}>{"★".repeat(5 - r.stars)}</span></div>
                <button onClick={() => toggle(r.id, r.is_published)}
                  style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none",
                    background: r.is_published ? "rgba(244,63,94,0.12)" : "rgba(52,211,153,0.12)",
                    color:      r.is_published ? "#FB7185" : "#34D399" }}>
                  {r.is_published ? "Hide" : "Publish"}
                </button>
              </div>
            </div>
            {r.text ? (
              <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6, fontStyle: "italic", borderLeft: "2px solid #7C3AED", paddingLeft: 10 }}>
                "{r.text}"
              </p>
            ) : (
              <p style={{ fontSize: 12, color: "var(--txt3)", fontStyle: "italic" }}>No written review</p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ fontSize: 11, color: "var(--txt3)" }}>{formatDate(r.created_at)}</span>
              <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                background: r.is_published ? "rgba(52,211,153,0.1)" : "rgba(148,163,184,0.1)",
                color:      r.is_published ? "#34D399" : "#94A3B8",
                border:     r.is_published ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(148,163,184,0.2)" }}>
                {r.is_published ? "Published" : "Hidden"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
