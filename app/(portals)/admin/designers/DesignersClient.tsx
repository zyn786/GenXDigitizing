// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, Plus, Star, TrendingUp, CheckCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";

// Bright palette matching dashboard
const CARD_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D" },
];

export function AdminDesignersClient({ designers }: { designers: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [,startTx] = useTransition();
  const [detail, setDetail] = useState<any | null>(null);
  const [dOrders, setDOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [adding, setAdding] = useState(false);

  async function openDetail(d: any) {
    setDetail(d);
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, turnaround, created_at, clients(company_name), service_tiers(label)")
      .eq("designer_id", d.id)
      .order("created_at", { ascending: false })
      .limit(15);
    setDOrders(data ?? []);
    setLoading(false);
  }

  async function toggleActive(d: any) {
    const { error } = await supabase.from("users").update({ is_active: !d.users?.is_active } as any).eq("id", d.users?.id);
    if (error) { toast.error("Failed"); return; }
    toast.success(d.users?.is_active ? "Deactivated" : "Activated");
    startTx(() => router.refresh());
  }

  async function addDesigner() {
    if (!newEmail || !newName || !newPass) { toast.error("All fields are required"); return; }
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/create-designer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), full_name: newName.trim(), password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success(`${newName.trim()} added as designer`);
      setShowAddForm(false);
      setNewEmail(""); setNewName(""); setNewPass("");
      startTx(() => router.refresh());
    } catch { toast.error("Network error"); }
    finally { setAdding(false); }
  }

  const stars = (n: number) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < Math.round(n) ? "#F59E0B" : "#D1D5DB", fontSize: 13 }}>★</span>
  ));

  const inpStyle: React.CSSProperties = {
    width: "100%", background: "var(--elevated)", border: "1px solid var(--border2)",
    borderRadius: 10, padding: "9px 13px", color: "var(--txt)", fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };

  // Stats
  const totalActive = designers.filter(d => d.users?.is_active).length;
  const avgRating = designers.length > 0 ? designers.reduce((s,d) => s + Number(d.avg_rating ?? 0), 0) / designers.length : 0;
  const totalCompleted = designers.reduce((s,d) => s + (d.completed_orders ?? 0), 0);

  /* ── Payout Form ─────────────────────────────────────── */
  function PayoutForm({ designerId, designerName }: { designerId: string; designerName: string }) {
    const [amount, setAmount] = useState("");
    const [desc, setDesc] = useState("");
    const [paying, setPaying] = useState(false);

    async function send() {
      if (!amount || parseFloat(amount) <= 0) { toast.error("Enter a valid amount"); return; }
      setPaying(true);
      try {
        const res = await fetch(`/api/designers/${designerId}/payout`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parseFloat(amount), currency: "USD", description: desc || `Payout to ${designerName}` }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error ?? "Payout failed"); return; }
        toast.success(`$${amount} sent to ${designerName} via Payoneer`);
        setAmount(""); setDesc("");
      } catch { toast.error("Network error"); }
      finally { setPaying(false); }
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (USD)" style={{ ...inpStyle, flex: 1 }}/>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" style={{ ...inpStyle, flex: 2 }}/>
        </div>
        <button onClick={send} disabled={paying || !amount}
          className="py-2.5 rounded-xl text-xs font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
          style={{ background: paying || !amount ? "var(--border2)" : `linear-gradient(135deg,${CARD_COLORS[1].bg},${CARD_COLORS[3].bg})`, cursor: paying || !amount ? "not-allowed" : "pointer" }}>
          {paying ? "Sending…" : "Send Payout via Payoneer →"}
        </button>
      </div>
    );
  }

  /* ── Detail view ──────────────────────────────────────────── */
  if (detail) {
    const u = detail.users;
    const isActive = u?.is_active;
    return (
      <div className="portal-content" style={{ background: "var(--bg)" }}>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
          <button onClick={() => setDetail(null)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer active:scale-95 transition-all"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>
            <ArrowLeft size={12} /> Back
          </button>
          <h2 className="font-syne font-bold text-base sm:text-lg" style={{ color: "var(--txt)" }}>{u?.full_name}</h2>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
            style={{
              background: isActive ? CARD_COLORS[1].bgSoft : CARD_COLORS[5].bgSoft,
              color: isActive ? CARD_COLORS[1].text : CARD_COLORS[5].text,
              border: `1px solid ${isActive ? CARD_COLORS[1].border : CARD_COLORS[5].border}`,
            }}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5">
          {/* Profile card */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-13 h-13 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${CARD_COLORS[2].bg},${CARD_COLORS[5].bg})`, width: 52, height: 52 }}>
                {getInitials(u?.full_name ?? "")}
              </div>
              <div>
                <div className="font-syne font-bold text-base" style={{ color: "var(--txt)" }}>{u?.full_name}</div>
                <div className="text-xs mt-0.5" style={{ color: CARD_COLORS[3].text }}>{u?.email}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stars(detail.avg_rating)}
                  <span className="text-xs ml-1" style={{ color: "var(--txt2)" }}>{Number(detail.avg_rating).toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              {[
                ["Joined", formatDate(u?.created_at)],
                ["Total Orders", detail.total_orders],
                ["Completed", detail.completed_orders],
                ["Active Now", detail.active_orders],
                ["Avg Turnaround", `${Number(detail.avg_turnaround_h).toFixed(1)}h`],
                ["Revision Rate", `${Number(detail.revision_rate).toFixed(1)}%`],
                ["Rating", `${Number(detail.avg_rating).toFixed(2)} ⭐`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--txt2)" }}>{l}</span>
                  <span className="font-medium" style={{ color: "var(--txt)" }}>{String(v)}</span>
                </div>
              ))}
            </div>

            {detail.specialties?.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--txt3)" }}>Specialties</div>
                <div className="flex gap-1.5 flex-wrap">
                  {detail.specialties.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: CARD_COLORS[4].bgSoft, color: CARD_COLORS[4].text, border: `1px solid ${CARD_COLORS[4].border}` }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => toggleActive(detail)}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all active:scale-95"
              style={{ background: isActive ? CARD_COLORS[5].bgSoft : CARD_COLORS[1].bgSoft, color: isActive ? CARD_COLORS[5].text : CARD_COLORS[1].text }}>
              {isActive ? "Deactivate Account" : "Activate Account"}
            </button>

            {/* Payout */}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-[11px] uppercase tracking-wider font-semibold mb-3" style={{ color: "var(--txt3)" }}>Send Payout (Payoneer)</div>
              {!detail.payoneer_id && (
                <p className="text-[11px] font-medium mb-2" style={{ color: CARD_COLORS[2].text }}>⚠️ No Payoneer ID set for this designer yet.</p>
              )}
              <PayoutForm designerId={detail.id} designerName={u?.full_name ?? ""} />
            </div>
          </div>

          {/* Recent jobs */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h3 className="font-syne font-bold text-sm mb-3" style={{ color: "var(--txt)" }}>Recent Jobs</h3>
            {loading ? (
              <p className="text-sm text-center py-5" style={{ color: "var(--txt3)" }}>Loading…</p>
            ) : dOrders.length === 0 ? (
              <p className="text-sm text-center py-5" style={{ color: "var(--txt3)" }}>No orders assigned yet</p>
            ) : dOrders.map(o => (
              <div key={o.id} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div className="font-mono text-[11px] font-bold" style={{ color: CARD_COLORS[0].text }}>{o.order_number}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--txt2)" }}>{(o.clients as any)?.company_name} · {(o.service_tiers as any)?.label}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: "var(--elevated)", color: "var(--txt2)", border: "1px solid var(--border2)" }}>
                  {o.status?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Grid view ────────────────────────────────────────── */
  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2
          className="font-syne font-bold text-xl sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Designer Team
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: "var(--txt3)" }}>
          {designers.length} designers · {totalActive} active · {totalCompleted} completed orders
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        {[
          { label: "Designers", val: designers.length, icon: <Users size={16} />, ci: 0 },
          { label: "Active", val: totalActive, icon: <CheckCircle size={16} />, ci: 1 },
          { label: "Avg Rating", val: avgRating > 0 ? `${avgRating.toFixed(1)} ⭐` : "—", icon: <Star size={16} />, ci: 2 },
          { label: "Completed", val: totalCompleted, icon: <TrendingUp size={16} />, ci: 3 },
        ].map(s => {
          const clr = CARD_COLORS[s.ci];
          return (
            <div key={s.label} className="rounded-2xl p-3 sm:p-3.5 transition-all duration-200 hover:translate-y-[-2px]"
              style={{ background: clr.bgSoft, border: `1px solid ${clr.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: clr.bgSoft, color: clr.icon }}>
                  {s.icon}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--txt2)" }}>{s.label}</div>
              </div>
              <div className="font-syne font-bold text-lg sm:text-xl" style={{ color: clr.text }}>{s.val}</div>
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-semibold border-none cursor-pointer transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})` }}>
          <Plus size={13} /> Add Designer
        </button>
      </div>

      {/* Add Designer Modal */}
      {showAddForm && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--surface)", border: `1px solid ${CARD_COLORS[4].border}` }}>
          <h3 className="font-syne font-bold text-sm mb-4" style={{ color: "var(--txt)" }}>Add New Designer</h3>
          <div className="flex flex-col gap-2.5">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" style={inpStyle} />
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address" type="email" style={inpStyle} />
            <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Password (min 6 characters)" type="password" style={inpStyle} />
            <div className="flex gap-2 mt-1">
              <button onClick={() => { setShowAddForm(false); setNewEmail(""); setNewName(""); setNewPass(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer border transition-all active:scale-95"
                style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>Cancel</button>
              <button onClick={addDesigner} disabled={adding}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-all active:scale-95"
                style={{ background: adding ? "var(--border2)" : `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})`, cursor: adding ? "not-allowed" : "pointer" }}>
                {adding ? "Creating…" : "Create Designer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Designer grid */}
      {designers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[40px] mb-2">🎨</p>
          <p className="font-syne font-bold text-base" style={{ color: "var(--txt)" }}>No designers yet</p>
          <p className="text-sm mt-1.5" style={{ color: "var(--txt3)" }}>Add your first designer to start assigning orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {designers.map(d => {
            const u = d.users;
            return (
              <div key={d.id} onClick={() => openDetail(d)}
                className="p-4 sm:p-5 cursor-pointer rounded-2xl transition-all duration-200 hover:translate-y-[-2px]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = CARD_COLORS[4].border; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${CARD_COLORS[4].bgSoft}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                {/* Top: avatar + name + stars */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${CARD_COLORS[2].bg},${CARD_COLORS[5].bg})` }}>
                    {getInitials(u?.full_name ?? "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm" style={{ color: "var(--txt)" }}>{u?.full_name ?? "—"}</div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {stars(d.avg_rating)}
                      <span className="text-[11px] ml-1" style={{ color: "var(--txt2)" }}>{Number(d.avg_rating).toFixed(1)}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--txt3)" }} />
                </div>

                {/* Stats grid */}
                <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Done", d.completed_orders, 1],
                      ["Active", d.active_orders, 0],
                      ["Avg Turn", `${Number(d.avg_turnaround_h ?? 0).toFixed(1)}h`, 4],
                      ["Rev %", `${Number(d.revision_rate ?? 0).toFixed(0)}%`, 2],
                    ].map(([l, v, ci]) => {
                      const clr = CARD_COLORS[ci as number];
                      return (
                        <div key={l as string} className="rounded-xl p-2.5" style={{ background: "var(--elevated)" }}>
                          <div className="text-[10px] font-semibold" style={{ color: "var(--txt3)" }}>{l}</div>
                          <div className="font-syne font-bold text-lg mt-0.5" style={{ color: clr.text }}>{v}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Specialties */}
                {d.specialties?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2.5">
                    {d.specialties.slice(0, 3).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: "var(--elevated)", color: "var(--txt2)", border: "1px solid var(--border2)" }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
