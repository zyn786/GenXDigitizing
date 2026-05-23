// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Save, Zap, Gift, Info } from "lucide-react";

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

const CAT_META: Record<string, { emoji: string; label: string; ci: number }> = {
  digitizing: { emoji: "🧵", label: "Embroidery Digitizing", ci: 4 },
  vector:     { emoji: "✏️", label: "Vector Redraw", ci: 3 },
  sewout:     { emoji: "🏷️", label: "Patch Design", ci: 1 },
};

const FREE_FEATURES = [
  { icon: "🔄", label: "Format Conversion", sub: "DST · PES · EMB · JEF · XXX + more" },
  { icon: "♾️", label: "Unlimited Revisions", sub: "Until 100% satisfied — always included" },
  { icon: "⏱️", label: "All Turnaround Speeds", sub: "Standard · Rush · Urgent — no extra cost" },
];

const TURNAROUND = [
  { icon: "🕐", label: "Standard", time: "12–24 hours", note: "Default for all orders", ci: 0 },
  { icon: "⚡", label: "Rush", time: "6 hours", note: "Most designs eligible", ci: 2 },
  { icon: "🔥", label: "Urgent", time: "3 hours", note: "Standard & vector only", ci: 4 },
];

export function AdminPricingUI({ tiers }: { tiers: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [,startTx] = useTransition();

  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(tiers.map(t => [t.id, Number(t.price)]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const grouped: Record<string, any[]> = {};
  for (const t of tiers) {
    grouped[t.category] = grouped[t.category] ?? [];
    grouped[t.category].push(t);
  }

  function handleChange(id: string, val: string) {
    const n = parseFloat(val);
    if (isNaN(n)) { return; }
    setPrices(p => ({ ...p, [id]: n }));
    setDirty(d => new Set(d).add(id));
  }

  async function saveTier(id: string) {
    setSaving(id);
    try {
      const { error } = await supabase
        .from("service_tiers")
        .update({ price: prices[id], updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) { toast.error("Failed to save price"); return; }
      toast.success("Price saved!");
      setDirty(d => { const n = new Set(d); n.delete(id); return n; });
      startTx(() => router.refresh());
    } finally { setSaving(null); }
  }

  async function saveAll() {
    const dirtyIds = Array.from(dirty);
    if (dirtyIds.length === 0) { toast("No changes to save"); return; }
    setSaving("all");
    try {
      for (const id of dirtyIds) {
        await supabase.from("service_tiers").update({ price: prices[id], updated_at: new Date().toISOString() }).eq("id", id);
      }
      toast.success(`${dirtyIds.length} price${dirtyIds.length > 1 ? "s" : ""} saved!`);
      setDirty(new Set());
      startTx(() => router.refresh());
    } finally { setSaving(null); }
  }

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-syne font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Pricing Settings
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>Changes apply instantly across all portals</p>
      </div>

      {/* Always Included */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={16} style={{ color: clr[4].icon }} />
          <h3 className="font-syne font-bold text-sm" style={{ color: txt }}>Always Included — Zero Extra Cost</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FREE_FEATURES.map(f => (
            <div key={f.label} className="flex items-start gap-3 p-3.5 rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <span className="text-xl flex-shrink-0 leading-none mt-0.5">{f.icon}</span>
              <div>
                <div className="text-[13px] font-semibold mb-0.5" style={{ color: txt }}>{f.label}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: txt2 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Turnaround Speeds */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} style={{ color: clr[2].icon }} />
          <h3 className="font-syne font-bold text-sm" style={{ color: txt }}>Turnaround Speeds</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {TURNAROUND.map(t => {
            const c = clr[t.ci];
            return (
              <div key={t.label} className="rounded-2xl p-4 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-syne font-bold text-sm" style={{ color: txt }}>{t.label}</span>
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{ background: clr[1].bgSoft, color: clr[1].text, borderColor: clr[1].border }}>FREE</span>
                </div>
                <div className="font-bold text-lg mb-0.5" style={{ color: c.text }}>{t.time}</div>
                <div className="text-[12px]" style={{ color: txt2 }}>{t.note}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 px-4 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2"
          style={{ background: clr[2].bgSoft, color: clr[2].text, border: `1px solid ${clr[2].border}` }}>
          <Info size={13} /> Jumbo / Full Back and Complex Vector: ~12 hours regardless of turnaround selection.
        </div>
      </div>

      {/* Base Prices */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">💰</span>
          <h3 className="font-syne font-bold text-sm" style={{ color: txt }}>Base Prices</h3>
        </div>
        <p className="text-[11px] mb-4" style={{ color: txt3 }}>
          Edit prices inline — press Enter or click Save. Changes apply instantly across all portals.
        </p>
      </div>

      {/* Category sections */}
      <div className="flex flex-col gap-4">
        {Object.entries(grouped).map(([cat, catTiers]) => {
          const meta = CAT_META[cat] ?? { emoji: "📋", label: cat, ci: 0 };
          const mc = clr[meta.ci];
          return (
            <div key={cat} className="rounded-2xl overflow-hidden border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {/* Category header */}
              <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3"
                style={{ background: mc.bgSoft, borderBottom: `1px solid var(--border)` }}>
                <span className="text-lg">{meta.emoji}</span>
                <h3 className="font-syne font-bold text-sm" style={{ color: mc.text }}>{meta.label}</h3>
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: mc.bgSoft, color: mc.text, border: `1px solid ${mc.border}` }}>
                  {catTiers.length} tier{catTiers.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Tier rows */}
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {catTiers.map(t => {
                  const isDirty = dirty.has(t.id);
                  const isSaving = saving === t.id || saving === "all";
                  return (
                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5 transition-colors"
                      style={{ background: isDirty ? mc.bgSoft : "transparent" }}>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[13px]" style={{ color: txt }}>{t.label}</span>
                          {t.is_big_design && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ background: clr[2].bgSoft, color: clr[2].text }}>Big Design</span>
                          )}
                        </div>
                        <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: txt2 }}>
                          <span>{t.size_desc}</span>
                          <span className="w-0.5 h-0.5 rounded-full" style={{ background: txt3 }} />
                          <span>Est. {t.est_hours}</span>
                          {t.is_big_design && (
                            <>
                              <span className="w-0.5 h-0.5 rounded-full" style={{ background: txt3 }} />
                              <span className="font-medium" style={{ color: clr[2].text }}>~12h turnaround</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price editor */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                          style={{ background: clr[1].bgSoft, color: clr[1].text, borderColor: clr[1].border }}>
                          ✓ Free revisions
                        </span>

                        <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border"
                          style={{ background: "var(--elevated)", borderColor: isDirty ? mc.border : "var(--border2)" }}>
                          <span className="text-sm font-bold" style={{ color: mc.icon }}>$</span>
                          <input type="number" min="1" step="1"
                            value={prices[t.id] ?? t.price}
                            onChange={e => handleChange(t.id, e.target.value)}
                            onKeyDown={e => e.key === "Enter" && saveTier(t.id)}
                            className="w-[60px] sm:w-[68px] bg-transparent text-center font-syne font-bold text-[16px] sm:text-[18px] outline-none border-none"
                            style={{ color: mc.text }} />
                        </div>

                        {isDirty && (
                          <button onClick={() => saveTier(t.id)} disabled={isSaving}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border-none cursor-pointer transition-all active:scale-95 text-white"
                            style={{ background: mc.icon, opacity: isSaving ? 0.6 : 1 }}>
                            {isSaving ? "…" : "Save"}
                          </button>
                        )}

                        <span className="sm:hidden text-[10px] font-medium px-1.5 py-0.5 rounded border"
                          style={{ background: clr[1].bgSoft, color: clr[1].text, borderColor: clr[1].border }}>
                          ✓ Free
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save all — sticky */}
      {dirty.size > 0 && (
        <div className="sticky bottom-4 flex justify-center z-20 mt-6">
          <button onClick={saveAll} disabled={saving === "all"}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl text-sm font-bold border-none cursor-pointer transition-all active:scale-95 text-white"
            style={{
              background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})`,
              boxShadow: `0 4px 24px ${clr[4].bgSoft}`,
            }}>
            <Save size={14} />
            {saving === "all" ? "Saving…" : `Save All ${dirty.size} Change${dirty.size > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
