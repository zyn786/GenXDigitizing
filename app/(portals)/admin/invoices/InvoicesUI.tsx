// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, FileText, Copy, ExternalLink, Search, CheckCircle, DollarSign, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { formatDate, formatCurrency, TURNAROUND_OPTIONS } from "@/lib/utils";

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

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  paid:     { bg: clr[1].bgSoft, color: clr[1].text, border: clr[1].border },
  pending:  { bg: clr[2].bgSoft, color: clr[2].text, border: clr[2].border },
  refunded: { bg: "rgba(75,85,99,0.08)", color: "#4B5563", border: "rgba(75,85,99,0.25)" },
  failed:   { bg: clr[5].bgSoft, color: clr[5].text, border: clr[5].border },
};

const FILTER_TABS = [
  { key: "all", label: "All", ci: 0 },
  { key: "pending", label: "Pending", ci: 2 },
  { key: "paid", label: "Paid", ci: 1 },
  { key: "refunded", label: "Refunded", ci: 5 },
];

export function AdminInvoicesUI({ invoices }: { invoices: any[] }) {
  const router = useRouter();
  const [,startTx] = useTransition();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<string | null>(null);
  const [checkoutUrlInput, setCheckoutUrlInput] = useState("");

  const filtered = invoices.filter(i => {
    const q = search.toLowerCase();
    const mq = !q || i.invoice_number?.toLowerCase().includes(q) || i.orders?.order_number?.toLowerCase().includes(q) || i.clients?.company_name?.toLowerCase().includes(q);
    const mf = filter==="all" || i.status===filter;
    return mq && mf;
  });

  const stats = {
    paid: invoices.filter(i=>i.status==="paid"),
    pending: invoices.filter(i=>i.status==="pending"),
  };
  const totalPaid = stats.paid.reduce((s,i)=>s+Number(i.amount),0);
  const totalPending = stats.pending.reduce((s,i)=>s+Number(i.amount),0);

  async function saveCheckoutLink(invoiceId: string) {
    if(!checkoutUrlInput.trim().startsWith("http")){toast.error("Enter a valid URL");return;}
    setLoading(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/checkout`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({checkout_url:checkoutUrlInput.trim()})});
      const data = await res.json();
      if(!res.ok){toast.error(data.error??"Failed");return;}
      toast.success("Payment link saved");
      setCheckoutModal(null);setCheckoutUrlInput("");
      startTx(()=>router.refresh());
    } catch {toast.error("Network error");}
    finally{setLoading(null);}
  }

  async function markPaid(invoiceId: string) {
    setLoading(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"paid",paid_at:new Date().toISOString()})});
      const data = await res.json();
      if(!res.ok){toast.error(data.error??"Failed");return;}
      toast.success("Invoice marked as paid");
      startTx(()=>router.refresh());
    } catch {toast.error("Network error");}
    finally{setLoading(null);}
  }

  function downloadPDF(invoiceId: string){const a=document.createElement("a");a.href=`/api/invoices/${invoiceId}/pdf`;a.download=`invoice-${invoiceId}.pdf`;document.body.appendChild(a);a.click();document.body.removeChild(a);}
  function copyLink(url: string){navigator.clipboard.writeText(url);toast.success("Link copied!");}

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-syne font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Invoices
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>
          ${totalPaid.toFixed(0)} collected · ${totalPending.toFixed(0)} pending
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        {[
          { label: "Total Collected", val: formatCurrency(totalPaid), icon: <DollarSign size={16} />, ci: 1 },
          { label: "Pending Amount", val: formatCurrency(totalPending), icon: <Clock size={16} />, ci: 2 },
          { label: "Paid Invoices", val: stats.paid.length, icon: <CheckCircle size={16} />, ci: 0 },
          { label: "Awaiting Payment", val: stats.pending.length, icon: <AlertCircle size={16} />, ci: 3 },
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
              <div className="font-syne font-bold text-lg sm:text-xl" style={{ color: c.text }}>{s.val}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-2 sm:gap-3 mb-4 items-center">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: txt3 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoice…"
            className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none box-border"
            style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: txt }}/>
        </div>
      </div>

      {/* Colored filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {FILTER_TABS.map(tab => {
          const c = clr[tab.ci];
          const isActive = filter === tab.key;
          const count = tab.key === "all" ? invoices.length : invoices.filter(i => i.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all active:scale-95"
              style={{
                background: isActive ? c.bgSoft : "var(--elevated)",
                color: isActive ? c.text : txt2,
                borderColor: isActive ? c.border : "var(--border2)",
              }}>
              {tab.label}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length===0 ? (
        <div className="text-center py-16 text-sm font-medium" style={{ color: txt3 }}>No invoices match</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-2.5">
            {filtered.map(inv=>{
              const s = STATUS_STYLE[inv.status]??STATUS_STYLE.pending;
              const t = TURNAROUND_OPTIONS[inv.orders?.turnaround??"standard"]??TURNAROUND_OPTIONS.standard;
              const isLoading = loading===inv.id;
              return (
                <div key={inv.id} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[14px] font-bold" style={{ color: clr[3].text }}>{inv.invoice_number}</span>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{inv.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] mb-3">
                    <span className="font-medium" style={{ color: txt }}>{inv.clients?.company_name??"—"}</span>
                    <span className="text-right font-mono font-semibold" style={{ color: clr[4].text }}>{inv.orders?.order_number || ((inv.notes||"").toLowerCase().includes("subscription")?"Subscription":(inv.notes||"").toLowerCase().includes("extra credits")?"Credits":"—")}</span>
                    <span style={{ color: txt3 }}>{formatDate(inv.created_at,{month:"short",day:"numeric"})}</span>
                    <span className="text-right" style={{ color: txt2 }}>{inv.orders?.service_tiers?.label || ((n=>{if(n.toLowerCase().includes("subscription"))return n.split("—")[0]?.replace("Subscription:","").trim()||"Plan";if(n.toLowerCase().includes("extra credits")){const m=n.match(/Extra credits:\s*(\d+)\s*design/i);return m?`+${m[1]} Credits`:"Credits"}return"—"})(inv.notes||""))}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-syne font-bold text-base" style={{ color: clr[1].text }}>{formatCurrency(inv.amount)}</span>
                    <span style={{padding:"2px 6px",borderRadius:3,background:`${t.color}18`,color:t.color,fontSize:10,fontWeight:500}}>{t.icon} {t.label}</span>
                  </div>
                  <div className="flex gap-1.5 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    {inv.status==="pending"&&!inv.payoneer_checkout_url&&(
                      <button onClick={()=>{setCheckoutModal(inv.id);setCheckoutUrlInput("");}}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95"
                        style={{background:clr[4].bgSoft,borderColor:clr[4].border,color:clr[4].text}}>
                        <CreditCard size={11}/> Create Link
                      </button>
                    )}
                    {inv.status==="pending"&&(
                      <button onClick={()=>markPaid(inv.id)} disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95"
                        style={{background:clr[1].bgSoft,borderColor:clr[1].border,color:clr[1].text}}>
                        <CheckCircle size={11}/> Mark Paid
                      </button>
                    )}
                    <button onClick={()=>downloadPDF(inv.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-medium border cursor-pointer active:scale-95"
                      style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt2}}>
                      <FileText size={11}/> PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--elevated)" }}>
                  {["Invoice","Order","Client","Service","Amount","Status","Paid At","Actions"].map(h=>(
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: txt3, borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv=>{
                  const s = STATUS_STYLE[inv.status]??STATUS_STYLE.pending;
                  const t = TURNAROUND_OPTIONS[inv.orders?.turnaround??"standard"]??TURNAROUND_OPTIONS.standard;
                  const isLoading = loading===inv.id;
                  return (
                    <tr key={inv.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border)", opacity:isLoading?0.6:1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--elevated)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <td className="p-3">
                        <div className="font-mono text-xs font-bold" style={{ color: clr[3].text }}>{inv.invoice_number}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: txt3 }}>{formatDate(inv.created_at,{month:"short",day:"numeric"})}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-xs font-bold" style={{ color: clr[4].text }}>{inv.orders?.order_number || ((inv.notes||"").toLowerCase().includes("subscription")?"Subscription":(inv.notes||"").toLowerCase().includes("extra credits")?"Credits":"—")}</div>
                        <span className="text-[10px]" style={{color:t.color}}>{t.icon} {t.label}</span>
                      </td>
                      <td className="p-3 text-sm font-medium" style={{ color: txt }}>{inv.clients?.company_name??"—"}</td>
                      <td className="p-3 text-xs" style={{ color: txt2 }}>{inv.orders?.service_tiers?.label || ((n=>{if(n.toLowerCase().includes("subscription"))return n.split("—")[0]?.replace("Subscription:","").trim()||"Plan";if(n.toLowerCase().includes("extra credits")){const m=n.match(/Extra credits:\s*(\d+)\s*design/i);return m?`+${m[1]} Credits`:"Credits"}return"—"})(inv.notes||""))}</td>
                      <td className="p-3 font-syne font-bold text-sm" style={{ color: clr[1].text }}>{formatCurrency(inv.amount)}</td>
                      <td className="p-3">
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{inv.status}</span>
                      </td>
                      <td className="p-3 text-[11px]" style={{ color: txt2 }}>{inv.paid_at?formatDate(inv.paid_at,{month:"short",day:"numeric"}):"—"}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {inv.status==="pending"&&!inv.payoneer_checkout_url&&(
                            <button onClick={()=>{setCheckoutModal(inv.id);setCheckoutUrlInput("");}}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95"
                              style={{background:clr[4].bgSoft,borderColor:clr[4].border,color:clr[4].text}}>
                              <CreditCard size={10}/> Create Link
                            </button>
                          )}
                          {inv.payoneer_checkout_url&&inv.status==="pending"&&(
                            <button onClick={()=>copyLink(inv.payoneer_checkout_url)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95"
                              style={{background:clr[3].bgSoft,borderColor:clr[3].border,color:clr[3].text}}>
                              <Copy size={10}/> Copy
                            </button>
                          )}
                          {inv.status==="pending"&&(
                            <button onClick={()=>markPaid(inv.id)} disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer active:scale-95"
                              style={{background:clr[1].bgSoft,borderColor:clr[1].border,color:clr[1].text}}>
                              <CheckCircle size={10}/> Mark Paid
                            </button>
                          )}
                          <button onClick={()=>downloadPDF(inv.id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-medium border cursor-pointer active:scale-95"
                            style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt2}}>
                            <FileText size={10}/> PDF
                          </button>
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
