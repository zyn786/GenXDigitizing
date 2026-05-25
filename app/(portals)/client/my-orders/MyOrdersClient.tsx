// @ts-nocheck
"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Download, RefreshCw, Star, ChevronRight, CheckCircle, Clock, Package } from "lucide-react";
import { formatDate, formatCurrency, STATUS_CLASS, STATUS_LABEL, TURNAROUND_OPTIONS } from "@/lib/utils";

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

function StarRating({ value, onChange }: any) {
  const [hover, setHover] = useState(0);
  const LABELS = ["","Poor","Fair","Good","Great","Excellent!"];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i=>(
          <span key={i} onClick={()=>onChange(i)} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}
            className="text-[26px] sm:text-[28px] cursor-pointer select-none transition-all"
            style={{color:(hover||value)>=i?"#F59E0B":"#D1D5DB"}}>★</span>
        ))}
      </div>
      {(hover||value)>0&&<span className="text-[13px] font-semibold" style={{color:"#F59E0B"}}>{LABELS[hover||value]}</span>}
    </div>
  );
}

function StatusTimeline({ status }: any) {
  const steps = ["submitted","assigned","in_progress","review","delivered"];
  const labels = ["Submitted","Assigned","Working","QA","Delivered"];
  const idx = steps.indexOf(status);
  if (!steps.includes(status)) return null;
  return (
    <div className="flex items-start mt-3 overflow-x-auto scrollbar-none">
      {steps.map((s,i)=>(
        <div key={s} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center min-w-[48px] sm:min-w-[56px]">
            <div className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{background:i<=idx?"linear-gradient(135deg,"+clr[4].icon+","+clr[3].icon+")":"var(--border2)"}}>
              {i<idx?<CheckCircle size={10}/>:i===idx?<Clock size={10}/>:<span>○</span>}
            </div>
            <span className="text-[9px] mt-1 text-center whitespace-nowrap" style={{color:i<=idx?txt2:"var(--txt3)"}}>{labels[i]}</span>
          </div>
          {i<steps.length-1&&<div className="flex-1 h-0.5 mt-[-14px]" style={{background:i<idx?clr[4].icon:"var(--border)"}}/>}
        </div>
      ))}
    </div>
  );
}

export function MyOrdersClient({ orders, userId }: any) {
  const router = useRouter();
  const supabase = createClient();
  const [,startTx] = useTransition();
  const [filter, setFilter] = useState("all");
  const [reviewing, setReviewing] = useState<any>(null);
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittingRev, setSubmittingRev] = useState(false);
  const [reviewed, setReviewed] = useState<any>(new Set());
  // Re-add localStorage persistence for reviews
  useEffect(() => {
    try { const saved = localStorage.getItem("reviewedOrders"); if (saved) setReviewed(new Set(JSON.parse(saved))); } catch {}
  }, []);

  const filtered = orders.filter((o:any) => {
    if (filter==="all") return true;
    if (filter==="active") return ["submitted","assigned","in_progress","review","approved"].includes(o.status);
    if (filter==="delivered") return o.status==="delivered";
    if (filter==="revision") return o.status==="revision";
    return true;
  });

  async function submitReview(orderId: string, clientId: string) {
    if (!stars) { toast.error("Select a star rating"); return; }
    if (!clientId) { toast.error("Cannot submit review — client record missing"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        order_id:orderId, client_id:clientId, stars, text:reviewText.trim()||null, is_published:true,
      });
      if (error) { toast.error("Failed: "+error.message); return; }
      setReviewed((s:any)=>{const n=new Set(s);n.add(orderId);try{localStorage.setItem("reviewedOrders",JSON.stringify([...n]));}catch{}return n;});
      setReviewing(null); setStars(0); setReviewText("");
      // Notify admin
      fetch("/api/review-notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId,orderNumber:orders.find((o:any)=>o.id===orderId)?.order_number,stars,clientName:orders.find((o:any)=>o.id===orderId)?.clients?.users?.full_name})}).catch(()=>{});
      toast.success("Review submitted! ⭐");
      startTx(()=>router.refresh());
    } finally { setSubmitting(false); }
  }

  function requestRevision(orderId: string) {
    const order = orders.find((o:any) => o.id === orderId);
    if (!order) return;
    setReviewText(""); // Clear any previous review text
    setReviewing(orderId+"-rev");
  }

  async function submitRevision(orderId: string) {
    const order = orders.find((o:any) => o.id === orderId);
    if (!order || !reviewText.trim()) { toast.error("Describe what changes you need"); return; }
    setSubmittingRev(true);
    try {
      const res = await fetch("/api/orders/revision", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderNumber: order.order_number, clientName: order.clients?.users?.full_name || "Client", revisionNotes: reviewText.trim() }),
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); toast.error(err.error || "Failed to request revision"); return; }
      toast.success("Revision requested — our team will be in touch");
      setReviewing(null); setReviewText("");
      startTx(()=>router.refresh());
    } catch { toast.error("Network error"); }
    finally { setSubmittingRev(false); }
  }

  const activeCount = orders.filter((o:any)=>["submitted","assigned","in_progress","review","approved"].includes(o.status)).length;
  const deliveredCount = orders.filter((o:any)=>o.status==="delivered").length;
  const revisionCount = orders.filter((o:any)=>o.status==="revision").length;

  const tabs = [
    { k:"all", label:"All", count:orders.length, ci: 0 },
    { k:"active", label:"Active", count:activeCount, ci: 4 },
    { k:"delivered", label:"Delivered", count:deliveredCount, ci: 1 },
    { k:"revision", label:"Revision", count:revisionCount, ci: 2 },
  ];

  return (
    <div className="portal-content" style={{background:"var(--bg)"}}>
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h2 className="font-jakarta font-bold text-xl sm:text-2xl"
          style={{background:"linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
          My Orders
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{color:txt3}}>{orders.length} orders · {activeCount} active · Reviews earn free priority</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none flex-nowrap">
        {tabs.map(f=>{
          const c = clr[f.ci];
          const active = filter===f.k;
          return(
            <button key={f.k} onClick={()=>setFilter(f.k)}
              className="flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-[12px] font-semibold border cursor-pointer transition-all active:scale-95"
              style={{background:active?c.bgSoft:"var(--surface)",color:active?c.text:txt2,borderColor:active?c.border:"var(--border)"}}>
              {f.label} <span className="text-[10px] opacity-70">({f.count})</span>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filtered.length===0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{background:clr[0].bgSoft}}>
            <Package size={22} style={{color:clr[0].icon}}/>
          </div>
          <p className="font-jakarta font-bold text-base mb-1" style={{color:txt}}>No orders here</p>
          <p className="text-sm" style={{color:txt3}}>Orders will appear once placed</p>
        </div>
      ) : filtered.map((o:any)=>{
        const t = TURNAROUND_OPTIONS[o.turnaround]??TURNAROUND_OPTIONS.standard;
        const outputFiles = (o.order_files??[]).filter((f:any)=>f.file_type==="output");
        const hasReview = o.reviews?.length>0||reviewed.has(o.id);
        const canReview = o.status==="delivered"&&!hasReview;
        const isReviewing = reviewing===o.id;
        const invoice = Array.isArray(o.invoices) ? o.invoices[0] : o.invoices;

        return (
          <div key={o.id} onClick={()=>router.push(`/client/my-orders/${o.id}`)}
            className="rounded-2xl p-3.5 sm:p-5 mb-2.5 cursor-pointer border transition-all active:scale-[0.99]"
            style={{background:"var(--surface)",borderColor:"var(--border)"}}>
            {/* Row 1: Order# + price + badges */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[13px] sm:text-sm font-bold" style={{color:clr[4].text}}>{o.order_number}</span>
                <span className={STATUS_CLASS[o.status]} style={{padding:"3px 8px",borderRadius:20,fontSize:10,fontWeight:600,border:"1px solid"}}>{STATUS_LABEL[o.status]}</span>
                <span style={{padding:"3px 8px",borderRadius:20,fontSize:10,fontWeight:500,background:`${t.color}18`,color:t.color,border:`1px solid ${t.color}35`}}>{t.icon} {t.label}</span>
              </div>
              <span className="font-jakarta font-extrabold text-base sm:text-lg flex-shrink-0" style={{color:clr[1].text}}>${Number(o.price).toFixed(0)}</span>
            </div>
            {/* Row 2: Service info */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
              <span className="text-[12px] sm:text-[13px] font-semibold" style={{color:txt}}>{o.service_tiers?.label??"—"}</span>
              <span className="text-[11px]" style={{color:txt3}}>{o.service_tiers?.size_desc}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border" style={{background:"var(--elevated)",borderColor:"var(--border2)"}}>{o.output_format}</span>
              {o.stitch_count&&<span className="text-[10px]" style={{color:txt3}}>{o.stitch_count.toLocaleString()} st</span>}
            </div>
            {/* Row 3: Date + invoice + review */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px]" style={{color:txt3}}>{formatDate(o.created_at)}</span>
                {invoice&&(<span className="text-[9px] px-2 py-0.5 rounded-full font-medium border" style={{background:invoice.status==="paid"?clr[1].bgSoft:clr[2].bgSoft,color:invoice.status==="paid"?clr[1].text:clr[2].text,border:`1px solid ${invoice.status==="paid"?clr[1].border:clr[2].border}`}}>{invoice.status==="paid"?"Paid":"Pending"}</span>)}
                {reviewed.has(o.id)&&<span className="text-[10px]">⭐</span>}
              </div>
            </div>

            {/* Timeline — compact */}
            <StatusTimeline status={o.status}/>

            {/* Actions */}
            {o.status==="delivered" && invoice?.status === "paid" && (
              <div className="flex gap-2 mt-3 flex-wrap" onClick={e=>e.stopPropagation()}>
                {outputFiles.length>0 ? outputFiles.map((f:any)=>(
                  <a key={f.id} href={f.signed_url || f.file_url} download={f.file_name} target="_blank" rel="noreferrer">
                    <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium cursor-pointer border transition-all active:scale-95"
                      style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}>
                      <Download size={12}/> {f.format??f.file_name}
                    </button>
                  </a>
                )) : <span className="text-xs self-center" style={{color:txt3}}>Files being prepared…</span>}
                <button onClick={()=>requestRevision(o.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium cursor-pointer border transition-all active:scale-95"
                  style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}>
                  <RefreshCw size={12}/> Revision <span className="text-[10px]" style={{color:clr[1].text}}>FREE</span>
                </button>
                {reviewing===o.id+"-rev"&&(
                  <div className="w-full mt-2 flex flex-col gap-2" onClick={e=>e.stopPropagation()}>
                    <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} rows={2} placeholder="Describe what changes you need…" className="w-full rounded-xl p-2.5 text-xs outline-none resize-none border box-border" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,fontFamily:"Inter,sans-serif"}}/>
                    <div className="flex gap-2">
                      <button onClick={()=>{setReviewing(null);setReviewText("");}} className="flex-1 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border" style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}>Cancel</button>
                      <button onClick={()=>submitRevision(o.id)} disabled={submittingRev} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border-none cursor-pointer text-white" style={{background:`linear-gradient(135deg,${clr[4].bg},${clr[4].icon})`}}>{submittingRev?"Sending…":"Submit"}</button>
                    </div>
                  </div>
                )}
                {canReview&&!isReviewing&&(
                  <button onClick={()=>setReviewing(o.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold cursor-pointer border transition-all active:scale-95"
                    style={{background:clr[3].bgSoft,color:clr[3].text,borderColor:clr[3].border}}>
                    <Star size={12}/> Leave Review
                  </button>
                )}
              </div>
            )}

            {/* Pay button */}
            {invoice?.status==="pending"&&invoice.payoneer_checkout_url&&(
              <div className="mt-3" onClick={e=>e.stopPropagation()}>
                <a href={invoice.payoneer_checkout_url} target="_blank" rel="noreferrer">
                  <button className="px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer text-white"
                    style={{background:`linear-gradient(135deg,${clr[4].bg},${clr[4].icon})`}}>
                    Pay ${Number(invoice.amount).toFixed(0)} via Payoneer →
                  </button>
                </a>
              </div>
            )}

            {/* Review form */}
            {isReviewing&&(
              <div className="mt-4 pt-4" style={{borderTop:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
                <p className="text-[13px] sm:text-sm font-semibold mb-3" style={{color:txt}}>How was your experience?</p>
                <div className="mb-3"><StarRating value={stars} onChange={setStars}/></div>
                <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} rows={3}
                  placeholder="Stitch quality, turnaround, communication…"
                  className="w-full rounded-xl p-3 text-[13px] sm:text-sm outline-none resize-none mb-3 box-border border"
                  style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,fontFamily:"Inter,sans-serif"}}/>
                <div className="flex gap-2">
                  <button onClick={()=>{setReviewing(null);setStars(0);setReviewText("");}}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer border"
                    style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}>Cancel</button>
                  <button onClick={()=>submitReview(o.id, o.client_id)} disabled={!stars||submitting}
                    className="flex-[2] py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white"
                    style={{background:!stars?"var(--border2)":`linear-gradient(135deg,${clr[4].bg},${clr[4].icon})`,cursor:!stars?"not-allowed":"pointer"}}>
                    {submitting?"Submitting…":"Submit Review ⭐"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
