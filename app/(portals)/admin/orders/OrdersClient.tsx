// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, FileText, CreditCard, CheckCircle, ChevronRight, Package, TrendingUp, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate, STATUS_CLASS, STATUS_LABEL, TURNAROUND_OPTIONS } from "@/lib/utils";

const STATUSES = ["submitted","assigned","in_progress","review","approved","delivered","revision","refunded","cancelled"];

// Bright palette matching dashboard
const CARD_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D" },
];

const CLR = {
  purple: "#5B21B6", purpleBg: "rgba(91,33,182,0.08)",
  cyan: "#0E7490", cyanBg: "rgba(14,116,144,0.08)",
  amber: "#92400E", amberBg: "rgba(146,64,14,0.08)",
  orange: "#9A3412", orangeBg: "rgba(154,52,18,0.08)",
  green: "#047857", greenBg: "rgba(4,120,87,0.08)",
  blue: "#1E40AF", blueBg: "rgba(30,64,175,0.08)",
  red: "#B91C1C", redBg: "rgba(185,28,28,0.08)",
  gray: "#374151", grayBg: "rgba(55,65,81,0.08)",
  dark: "#1F2937", mid: "#4B5563", light: "#6B7280",
};

// Colorful status tab metadata — brighter for visibility
const STATUS_META: Record<string, { color: string; bg: string; icon: React.ReactNode; ci: number }> = {
  submitted:   { color: "#6D28D9", bg: "rgba(139,92,246,0.10)", icon: <span className="text-xs">📥</span>, ci: 4 },
  assigned:    { color: "#0E7490", bg: "rgba(6,182,212,0.10)",   icon: <span className="text-xs">👤</span>, ci: 3 },
  in_progress: { color: "#C2410C", bg: "rgba(249,115,22,0.10)",  icon: <span className="text-xs">🔧</span>, ci: 2 },
  review:      { color: "#BE185D", bg: "rgba(236,72,153,0.10)",  icon: <span className="text-xs">🔍</span>, ci: 5 },
  approved:    { color: "#047857", bg: "rgba(16,185,129,0.10)",  icon: <span className="text-xs">✅</span>, ci: 1 },
  delivered:   { color: "#1D4ED8", bg: "rgba(59,130,246,0.10)",  icon: <span className="text-xs">📦</span>, ci: 0 },
  revision:    { color: "#B91C1C", bg: "rgba(220,38,38,0.10)",   icon: <span className="text-xs">🔄</span>, ci: 5 },
  refunded:    { color: "#4B5563", bg: "rgba(75,85,99,0.10)",     icon: <span className="text-xs">💸</span>, ci: 0 },
  cancelled:   { color: "#374151", bg: "rgba(55,65,81,0.10)",     icon: <span className="text-xs">❌</span>, ci: 0 },
};

const inpSelect: React.CSSProperties = {
  background: "var(--elevated)", border: "1px solid var(--border2)",
  borderRadius: 8, color: "var(--txt)", fontSize: 13,
  padding: "8px 10px", outline: "none", cursor: "pointer",
};

export function AdminOrdersClient({ orders, designers, unreviewedEdits = {} as Record<string, number> }) {
  const router = useRouter();
  const [,startTx] = useTransition();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<string | null>(null);
  const [checkoutUrlInput, setCheckoutUrlInput] = useState("");

  const filtered = orders.filter(o => {
    const mq = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.clients?.company_name?.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || o.status===filter;
    return mq && mf;
  });

  async function updateStatus(orderId: string, newStatus: string) {
    setLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ status:newStatus }),
      });
      const data = await res.json();
      if(!res.ok) { toast.error(data.error??"Failed"); return; }
      toast.success(`Status → ${STATUS_LABEL[newStatus]??newStatus}`);
      startTx(()=>router.refresh());
    } catch { toast.error("Network error"); }
    finally { setLoading(null); }
  }

  async function assignDesigner(orderId: string, designerId: string) {
    setLoading(orderId+"-d");
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ designer_id:designerId||null, status:designerId?"assigned":"submitted" }),
      });
      const data = await res.json();
      if(!res.ok) { toast.error(data.error??"Failed"); return; }
      toast.success(designerId?"Designer assigned":"Designer unassigned");
      startTx(()=>router.refresh());
    } catch { toast.error("Network error"); }
    finally { setLoading(null); }
  }

  async function saveCheckoutLink(invoiceId: string, orderId: string) {
    if(!checkoutUrlInput.trim().startsWith("http")) { toast.error("Enter a valid URL"); return; }
    setLoading(orderId+"-pay");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/checkout`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ checkout_url:checkoutUrlInput.trim() }),
      });
      const data = await res.json();
      if(!res.ok) { toast.error(data.error??"Failed"); return; }
      toast.success("Payment link saved");
      setCheckoutModal(null); setCheckoutUrlInput("");
      startTx(()=>router.refresh());
    } catch { toast.error("Network error"); }
    finally { setLoading(null); }
  }

  const activeOrders = orders.filter(o=>["submitted","assigned","in_progress","review","approved"].includes(o.status)).length;
  const delivered = orders.filter(o=>o.status==="delivered").length;
  const totalRevenue = orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.price||0),0);
  const pendingPay = orders.filter(o=>o.invoices?.status==="pending").length;
  const pendingReview = orders.filter(o=>o.status==="submitted").length;

  const stats = [
    { label: "Total Orders", val: orders.length, icon: <Package size={16} />, ci: 0 },
    { label: "Active", val: activeOrders, icon: <TrendingUp size={16} />, ci: 2 },
    { label: "Pending Review", val: pendingReview, icon: <AlertTriangle size={16} />, ci: 4 },
    { label: "Delivered", val: delivered, icon: <CheckCircle size={16} />, ci: 1 },
    { label: "Revenue", val: formatCurrency(totalRevenue,"USD",true), icon: <DollarSign size={16} />, ci: 3 },
    { label: "Pending Pay", val: pendingPay, icon: <Clock size={16} />, ci: 5 },
  ];

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
          Order Management
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: "var(--txt3)" }}>
          {orders.length} total · {activeOrders} active · {delivered} delivered
        </p>
      </div>

      {/* Stat cards — 2-col mobile, 3-col tablet, 6-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5">
        {stats.map(s => {
          const clr = CARD_COLORS[s.ci];
          return (
            <div key={s.label}
              className="rounded-2xl p-3 sm:p-3.5 transition-all duration-200 hover:translate-y-[-2px]"
              style={{ background: clr.bgSoft, border: `1px solid ${clr.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: clr.bgSoft, color: clr.icon }}>
                  {s.icon}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--txt2)" }}>
                  {s.label}
                </div>
              </div>
              <div className="font-syne font-bold text-lg sm:text-xl" style={{ color: clr.text }}>{s.val}</div>
            </div>
          );
        })}
      </div>

      {/* Search + desktop filter tabs */}
      <div className="flex gap-2 sm:gap-3 mb-4 items-center">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--txt3)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search order # or client…"
            className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none box-border transition-all"
            style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--txt)" }}/>
        </div>
        {/* Desktop status tabs */}
        <div className="hidden sm:flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button onClick={()=>setFilter("all")}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all active:scale-95"
            style={{
              background: filter==="all" ? "var(--elevated2)" : "var(--elevated)",
              color: filter==="all" ? "#1F2937" : "var(--txt2)",
              borderColor: filter==="all" ? "var(--border3)" : "var(--border2)",
            }}>
            All
          </button>
          {["submitted","in_progress","review","approved","delivered","revision"].map(s => {
            const meta = STATUS_META[s];
            const active = filter === s;
            return (
              <button key={s} onClick={()=>setFilter(active?"all":s)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all active:scale-95"
                style={{
                  background: active ? meta.bg : "var(--elevated)",
                  color: active ? meta.color : "var(--txt2)",
                  borderColor: active ? `${meta.color}40` : "var(--border2)",
                }}>
                {meta.icon} {STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: colored status chips */}
      <div className="sm:hidden flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        <button onClick={()=>setFilter("all")}
          className="flex-shrink-0 px-3.5 py-2 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
          style={{
            background: filter==="all" ? "var(--elevated2)" : "var(--elevated)",
            color: filter==="all" ? "#1F2937" : "var(--txt2)",
            borderColor: filter==="all" ? "var(--border3)" : "var(--border2)",
          }}>
          All
        </button>
        {["submitted","assigned","in_progress","review","approved","delivered"].map(s => {
          const meta = STATUS_META[s];
          const active = filter === s;
          return (
            <button key={s} onClick={()=>setFilter(active?"all":s)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
              style={{
                background: active ? meta.bg : "var(--elevated)",
                color: active ? meta.color : "var(--txt2)",
                borderColor: active ? `${meta.color}40` : "var(--border2)",
              }}>
              {meta.icon} {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      {filtered.length===0 ? (
        <div className="text-center py-16 text-sm" style={{ color: "var(--txt3)" }}>No orders match</div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="sm:hidden flex flex-col gap-2.5">
            {filtered.map(o=>{
              const t = TURNAROUND_OPTIONS[o.turnaround]??TURNAROUND_OPTIONS.standard;
              const inv = Array.isArray(o.invoices) ? o.invoices[0] : o.invoices;
              const isLoading = loading===o.id||loading===o.id+"-d"||loading===o.id+"-pay";
              return (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="no-underline">
                  <div className="rounded-xl p-4 active:opacity-80 transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: isLoading ? 0.7 : 1 }}>
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[14px] font-bold" style={{ color: "var(--txt)" }}>{o.order_number}</span>
                      <span className={STATUS_CLASS[o.status]} style={{ padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:600, border:"1px solid" }}>{STATUS_LABEL[o.status]}</span>
                    </div>
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] mb-3">
                      <span className="font-medium" style={{ color: "var(--txt)" }}>{o.clients?.company_name??"—"}</span>
                      <span className="text-right" style={{ color: "var(--txt2)" }}>{o.service_tiers?.label??"—"}</span>
                      <span style={{ color: "var(--txt3)" }}>{formatDate(o.created_at,{month:"short",day:"numeric"})}</span>
                      <span className="text-right font-mono text-[12px]" style={{ color: "var(--txt2)" }}>{o.output_format}</span>
                    </div>
                    {/* Price row — always visible */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-syne font-bold text-lg" style={{ color: "var(--txt)" }}>
                        {formatCurrency(o.price, "USD", true)}
                      </span>
                      {inv && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: inv.status==="paid" ? CARD_COLORS[1].bgSoft : CARD_COLORS[2].bgSoft,
                            color: inv.status==="paid" ? CARD_COLORS[1].text : CARD_COLORS[2].text,
                            border: `1px solid ${inv.status==="paid" ? CARD_COLORS[1].border : CARD_COLORS[2].border}`,
                          }}>
                          {inv.status}
                        </span>
                      )}
                    </div>
                    {/* Bottom */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:500, background:`${t.color}18`, color:t.color, border:`1px solid ${t.color}30` }}>{t.icon} {t.label}</span>
                        {unreviewedEdits[o.id]>0 && <span className="text-xs">⚠️</span>}
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--txt3)" }}/>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--elevated)" }}>
                  {["Order","Client","Service","Turnaround","Designer","Status","Invoice","Actions"].map(h=>(
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--txt3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o=>{
                  const t = TURNAROUND_OPTIONS[o.turnaround]??TURNAROUND_OPTIONS.standard;
                  const inv = Array.isArray(o.invoices) ? o.invoices[0] : o.invoices;
                  const isLoading = loading===o.id||loading===o.id+"-d"||loading===o.id+"-pay";
                  return (
                    <tr key={o.id} onClick={()=>router.push(`/admin/orders/${o.id}`)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--border)", opacity: isLoading ? 0.7 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--elevated)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <td className="p-3">
                        <Link href={`/admin/orders/${o.id}`} onClick={e=>e.stopPropagation()} className="no-underline">
                          <span className="font-mono text-xs font-bold" style={{ color: CARD_COLORS[0].text }}>{o.order_number}</span>
                        </Link>
                        {unreviewedEdits[o.id]>0 && <span className="ml-1.5 text-xs">⚠️</span>}
                        <div className="text-[10px] mt-0.5" style={{ color: "var(--txt3)" }}>{formatDate(o.created_at,{month:"short",day:"numeric"})}</div>
                      </td>
                      <td className="p-3 text-sm font-medium" style={{ color: "var(--txt)" }}>{o.clients?.company_name??"—"}</td>
                      <td className="p-3">
                        <div className="text-sm" style={{ color: "var(--txt2)" }}>{o.service_tiers?.label??"—"}</div>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                          style={{ background: "var(--elevated)", color: "var(--txt2)", borderColor: "var(--border2)" }}>{o.output_format}</span>
                      </td>
                      <td className="p-3">
                        <span style={{ padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:500, background:`${t.color}18`, color:t.color, border:`1px solid ${t.color}30` }}>{t.icon} {t.label}</span>
                      </td>
                      <td className="p-3" onClick={e=>e.stopPropagation()}>
                        <select value={o.designers?.id??""} onChange={e=>assignDesigner(o.id,e.target.value)} disabled={!!loading}
                          style={{ ...inpSelect, minWidth:120 }}>
                          <option value="">Unassigned</option>
                          {designers.map(d=><option key={d.id} value={d.id}>{d.users?.full_name??d.id}</option>)}
                        </select>
                      </td>
                      <td className="p-3" onClick={e=>e.stopPropagation()}>
                        <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} disabled={!!loading}
                          style={{ ...inpSelect, minWidth:110 }} className={STATUS_CLASS[o.status]}>
                          {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABEL[s]??s}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        {inv ? (
                          <div>
                            <div className="font-syne font-bold text-sm" style={{ color: inv.status==="paid" ? CARD_COLORS[1].text : CARD_COLORS[2].text }}>${Number(o.price).toFixed(0)}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full inline-block mt-0.5 font-medium"
                              style={{
                                background: inv.status==="paid" ? CARD_COLORS[1].bgSoft : CARD_COLORS[2].bgSoft,
                                color: inv.status==="paid" ? CARD_COLORS[1].text : CARD_COLORS[2].text,
                                border: `1px solid ${inv.status==="paid" ? CARD_COLORS[1].border : CARD_COLORS[2].border}`,
                              }}>
                              {inv.status}
                            </span>
                          </div>
                        ) : <span className="text-xs" style={{ color: "var(--txt3)" }}>—</span>}
                      </td>
                      <td className="p-3" onClick={e=>e.stopPropagation()}>
                        <div className="flex gap-1.5 flex-wrap">
                          {inv?.status==="pending"&&!inv?.payoneer_checkout_url&&(
                            checkoutModal===o.id ? (
                              <div className="flex flex-col gap-1.5 rounded-xl p-2.5 min-w-[200px]"
                                style={{ background: "var(--elevated)", border: `1px solid ${CARD_COLORS[4].border}` }}>
                                <input value={checkoutUrlInput} onChange={e=>setCheckoutUrlInput(e.target.value)} placeholder="Payoneer link…"
                                  className="w-full rounded-lg py-1.5 px-2 text-[11px] outline-none box-border"
                                  style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--txt)" }}/>
                                <div className="flex gap-1">
                                  <button onClick={()=>{setCheckoutModal(null);setCheckoutUrlInput("")}}
                                    className="flex-1 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer border"
                                    style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>Cancel</button>
                                  <button onClick={()=>saveCheckoutLink(inv.id,o.id)} disabled={!!loading}
                                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-white border-none cursor-pointer"
                                    style={{ background: `linear-gradient(135deg,${CARD_COLORS[4].bg},${CARD_COLORS[4].icon})` }}>Save</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={()=>{setCheckoutModal(o.id);setCheckoutUrlInput("")}}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95 transition-all"
                                style={{ background: CARD_COLORS[4].bgSoft, borderColor: CARD_COLORS[4].border, color: CARD_COLORS[4].text }}>
                                <CreditCard size={11}/> Checkout
                              </button>
                            )
                          )}
                          {inv?.payoneer_checkout_url&&inv.status==="pending"&&(
                            <button onClick={()=>{navigator.clipboard.writeText(inv.payoneer_checkout_url);toast.success("Copied!")}}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95 transition-all"
                              style={{ background: CARD_COLORS[3].bgSoft, borderColor: CARD_COLORS[3].border, color: CARD_COLORS[3].text }}>
                              <CreditCard size={11}/> Copy
                            </button>
                          )}
                          {inv&&(
                            <button onClick={()=>window.open(`/api/invoices/${inv.id}/pdf`,"_blank")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium cursor-pointer active:scale-95 transition-all border"
                              style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt2)" }}>
                              <FileText size={11}/> PDF
                            </button>
                          )}
                          {o.status==="review"&&(
                            <button onClick={()=>updateStatus(o.id,"delivered")} disabled={!!loading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95 transition-all"
                              style={{ background: CARD_COLORS[1].bgSoft, borderColor: CARD_COLORS[1].border, color: CARD_COLORS[1].text }}>
                              <CheckCircle size={11}/> Deliver
                            </button>
                          )}
                        </div>
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
  );
}
