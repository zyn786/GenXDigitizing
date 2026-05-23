// @ts-nocheck
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, ExternalLink, CreditCard, CheckCircle, X, Clock, DollarSign, Receipt } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";

function getStatusStyle(status) {
  if (status === "paid") return { bg: "rgba(16,185,129,0.08)", color: "#047857", border: "rgba(16,185,129,0.25)" };
  if (status === "pending") return { bg: "rgba(249,115,22,0.08)", color: "#C2410C", border: "rgba(249,115,22,0.25)" };
  if (status === "failed") return { bg: "rgba(244,63,94,0.12)", color: "#FB7185", border: "rgba(244,63,94,0.25)" };
  return { bg: "rgba(148,163,184,0.12)", color: "var(--txt2)", border: "rgba(148,163,184,0.25)" };
}

export function ClientInvoicesUI({ invoices, paymentStatus, demoInvoiceId }) {
  const router = useRouter();
  const [,startTx] = useTransition();
  const [loading, setLoading] = useState(null);
  const [banner, setBanner] = useState(paymentStatus);

  useEffect(function(){
    if (paymentStatus === "success") toast.success("Payment received!", { duration: 6000 });
    else if (paymentStatus === "cancelled") toast.error("Payment cancelled. Link still active.");
    if (paymentStatus) {
      var url = new URL(window.location.href);
      url.searchParams.delete("payment"); url.searchParams.delete("invoice"); url.searchParams.delete("checkout"); url.searchParams.delete("amount");
      window.history.replaceState({}, "", url.toString());
    }
  }, [paymentStatus]);

  async function getCheckoutLink(invoiceId) {
    setLoading(invoiceId);
    try { var res = await fetch("/api/invoices/"+invoiceId+"/checkout", { method: "POST" }); var data = await res.json(); if (!res.ok) { toast.error(data.error || "Failed"); return; } window.open(data.checkout_url, "_blank"); }
    catch { toast.error("Network error"); }
    finally { setLoading(null); }
  }

  function downloadPDF(invoiceId) { window.open("/api/invoices/"+invoiceId+"/pdf", "_blank"); }

  var totalPaid = invoices.filter(function(i){ return i.status === "paid"; }).reduce(function(s,i){ return s + Number(i.amount); }, 0);
  var totalPending = invoices.filter(function(i){ return i.status === "pending"; }).reduce(function(s,i){ return s + Number(i.amount); }, 0);

  var green = { bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" };
  var orange = { bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" };
  var purple = { bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" };
  var cyan = { bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" };

  return (
    <div className="portal-content" style={{background:"var(--bg)"}}>
      <div className="mb-4 sm:mb-5">
        <h2 className="font-syne font-bold text-xl sm:text-2xl"
          style={{background:"linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
          Invoices
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{color:txt3}}>{invoices.length} invoices · {formatCurrency(totalPaid,"USD",true)} paid · {formatCurrency(totalPending,"USD",true)} pending</p>
      </div>

      {banner === "success" && (
        <div className="rounded-xl p-3 sm:p-4 mb-4 flex items-center justify-between gap-3 border" style={{background:green.bgSoft,borderColor:green.border}}>
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} style={{color:green.icon}}/>
            <div><div className="text-[13px] font-semibold" style={{color:green.text}}>Payment confirmed!</div><div className="text-[11px] mt-0.5" style={{color:txt2}}>Your order is active — team notified.</div></div>
          </div>
          <button onClick={function(){ setBanner(null); }} className="bg-transparent border-none cursor-pointer" style={{color:txt3}}><X size={14}/></button>
        </div>
      )}
      {banner === "cancelled" && (
        <div className="rounded-xl p-3 sm:p-4 mb-4 flex items-center justify-between gap-3 border" style={{background:orange.bgSoft,borderColor:orange.border}}>
          <div className="flex items-center gap-2.5"><span className="text-lg">⚠️</span><span className="text-[13px] font-medium" style={{color:orange.text}}>Payment not completed. Link still valid.</span></div>
          <button onClick={function(){ setBanner(null); }} className="bg-transparent border-none cursor-pointer" style={{color:txt3}}><X size={14}/></button>
        </div>
      )}

      <div className="flex gap-2 sm:grid sm:grid-cols-3 sm:gap-3 mb-5 overflow-x-auto scrollbar-none flex-nowrap">
        {[
          { label:"Total Paid", val:formatCurrency(totalPaid), icon:<DollarSign size={16}/>, c:green },
          { label:"Pending", val:formatCurrency(totalPending), icon:<Clock size={16}/>, c:orange },
          { label:"Invoices", val:invoices.length, icon:<Receipt size={16}/>, c:purple },
        ].map(function(s){
          return (
            <div key={s.label} className="flex-1 sm:flex-shrink rounded-2xl p-3 sm:p-3.5 transition-all duration-200 hover:translate-y-[-2px]"
              style={{background:s.c.bgSoft,border:"1px solid "+s.c.border}}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:s.c.bgSoft,color:s.c.icon}}>{s.icon}</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold" style={{color:txt2}}>{s.label}</div>
              </div>
              <div className="font-syne font-bold text-lg sm:text-xl" style={{color:s.c.text}}>{s.val}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl p-3 mb-4 flex gap-3 flex-wrap text-[11px] sm:text-xs font-semibold border" style={{background:green.bgSoft,color:green.text,borderColor:green.border}}>
        <span>♾️ Unlimited revisions — FREE</span><span>·</span><span>🔄 All format conversions — FREE</span><span>·</span><span>⚡ Rush & urgent turnaround — FREE</span>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{background:purple.bgSoft}}><Receipt size={22} style={{color:purple.icon}}/></div>
          <p className="font-syne font-bold text-base mb-1" style={{color:txt}}>No invoices yet</p>
          <p className="text-sm" style={{color:txt3}}>Invoices are created when you place an order</p>
        </div>
      ) : (
        <div>
        <div className="sm:hidden flex flex-col gap-2">
          {invoices.map(function(inv){
            var s = getStatusStyle(inv.status);
            return (
              <div key={inv.id} className="rounded-xl p-3.5 border" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-bold" style={{color:cyan.text}}>{inv.invoice_number}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border" style={{background:s.bg,color:s.color,borderColor:s.border}}>{inv.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] mb-2.5">
                  <span className="font-medium" style={{color:txt}}>{inv.orders?.service_tiers?.label||"—"}</span>
                  <span className="font-syne font-extrabold text-right" style={{color:green.text}}>{formatCurrency(inv.amount)}</span>
                  <span className="font-mono text-[11px]" style={{color:purple.text}}>{inv.orders?.order_number||"—"}</span>
                  <span className="text-right" style={{color:txt3}}>{formatDate(inv.created_at)}</span>
                </div>
                <div className="flex gap-2 pt-2" style={{borderTop:"1px solid var(--border)"}}>
                  {inv.status==="pending"&&(inv.payoneer_checkout_url?
                    <a href={inv.payoneer_checkout_url} target="_blank" rel="noreferrer" className="flex-1"><button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border-none cursor-pointer text-white" style={{background:"linear-gradient(135deg,"+purple.icon+","+"#DB2777)"}}><ExternalLink size={12}/> Pay Now</button></a>
                    :<button onClick={function(){ getCheckoutLink(inv.id); }} disabled={loading===inv.id} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border-none cursor-pointer text-white" style={{background:"linear-gradient(135deg,"+purple.icon+","+"#DB2777)"}}><CreditCard size={12}/> {loading===inv.id?"Loading…":"Pay via Payoneer"}</button>
                  )}
                  <button onClick={function(){ downloadPDF(inv.id); }} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium cursor-pointer border" style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}><Download size={12}/> PDF</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:block rounded-2xl overflow-hidden" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{background:"var(--elevated)"}}>
                {["Invoice","Order","Service","Amount","Status","Date","Actions"].map(function(h){
                  return (<th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{color:txt3,borderBottom:"1px solid var(--border)"}}>{h}</th>);
                })}
              </tr>
            </thead>
            <tbody>
              {invoices.map(function(inv){
                var s = getStatusStyle(inv.status);
                var isLoading = loading === inv.id;
                return (
                  <tr key={inv.id} className="transition-colors" style={{borderBottom:"1px solid var(--border)",opacity:isLoading?0.6:1}}
                    onMouseEnter={function(e){ e.currentTarget.style.background="var(--elevated)"; }}
                    onMouseLeave={function(e){ e.currentTarget.style.background="transparent"; }}>
                    <td className="p-3 font-mono text-xs font-bold" style={{color:cyan.text}}>{inv.invoice_number}</td>
                    <td className="p-3 font-mono text-[11px] font-bold" style={{color:purple.text}}>{inv.orders?.order_number||"—"}</td>
                    <td className="p-3 text-xs" style={{color:txt2}}>{inv.orders?.service_tiers?.label||"—"}</td>
                    <td className="p-3 font-syne font-bold text-sm" style={{color:green.text}}>{formatCurrency(inv.amount)}</td>
                    <td className="p-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border" style={{background:s.bg,color:s.color,borderColor:s.border}}>{inv.status}</span></td>
                    <td className="p-3 text-[11px]" style={{color:txt3}}>{formatDate(inv.created_at)}</td>
                    <td className="p-3"><div className="flex gap-1.5">
                      {inv.status==="pending"&&(inv.payoneer_checkout_url?
                        <a href={inv.payoneer_checkout_url} target="_blank" rel="noreferrer"><button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border-none cursor-pointer text-white" style={{background:"linear-gradient(135deg,"+purple.icon+","+"#DB2777)"}}><ExternalLink size={11}/> Pay Now</button></a>
                        :<button onClick={function(){ getCheckoutLink(inv.id); }} disabled={isLoading} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border-none cursor-pointer text-white" style={{background:"linear-gradient(135deg,"+purple.icon+","+"#DB2777)"}}><CreditCard size={11}/> {isLoading?"Loading…":"Pay"}</button>
                      )}
                      <button onClick={function(){ downloadPDF(inv.id); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium cursor-pointer border" style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}><Download size={11}/> PDF</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}
