// @ts-nocheck
"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, Upload, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCreditCost } from "@/lib/plans";

const txt="var(--txt)",txt2="var(--txt2)",txt3="var(--txt3)";
const GREEN={icon:"#059669",text:"#047857",bgSoft:"rgba(16,185,129,0.08)"};
const PURPLE={icon:"#7C3AED",text:"#6D28D9",bgSoft:"rgba(139,92,246,0.08)"};
const TURNS=[{id:"standard",label:"Standard",time:"12–24h",icon:"🕐"},{id:"rush",label:"Rush",time:"6h",icon:"⚡"},{id:"urgent",label:"Urgent",time:"3h",icon:"🔥"}];

function calcDeadline(turn:any,big:any){const h=big?12:turn==="urgent"?3:turn==="rush"?6:24;return new Date(Date.now()+h*3600000).toISOString();}

interface Props {
  tiers: any[];
  clientId: string;
  userId: string;
  subscription: any;
  creditBalance: number;
}

export function QuickOrder({tiers,clientId,userId,subscription,creditBalance}:Props){
  const router=useRouter();const supabase=createClient();
  const [sel,setSel]=useState<any>(null);
  const [turn,setTurn]=useState("standard");
  const [fmt,setFmt]=useState("DST");
  const [designName,setDesignName]=useState("");
  const [notes,setNotes]=useState("");
  const [w,setW]=useState("");const [h,setH]=useState("");
  const [files,setFiles]=useState<any[]>([]);
  const fileRef=useRef<any>(null);
  const [busy,setBusy]=useState(false);
  const [quantity,setQuantity]=useState("1");
  const [instructions,setInstructions]=useState("");
  const [dragOver,setDragOver]=useState(false);

  const grouped:any={};for(const t of tiers){grouped[t.category]=grouped[t.category]||[];grouped[t.category].push(t);}
  const cats=Object.keys(grouped);
  const [subCat,setSubCat]=useState(cats[0]||"digitizing");
  const isBig=sel?.is_big_design;
  const selTurn=(TURNS||[]).find(t=>t.id===turn)||TURNS[0];
  const qty=parseInt(quantity)||1;
  const creditCost=sel?getCreditCost(subscription.plan,!!isBig,sel.credit_cost):0;
  const subRemaining=subscription.designs_total-subscription.designs_used+(subscription.designs_rolled_over||0);
  const needed=creditCost*qty;
  const displayCredits=needed;
  const displayExtra=subRemaining<needed?Math.min(creditBalance,needed-subRemaining):0;

  async function placeOrder(){
    if(!sel){toast.error("Select a tier");return;}
    if(!designName.trim()){toast.error("Enter a design name");return;}
    if(files.length===0){toast.error("Upload artwork");return;}
    let usePlanCredits=0,useExtraCredits=0;
    if(subRemaining>=needed){usePlanCredits=needed;}
    else{usePlanCredits=Math.max(0,subRemaining);const s=needed-usePlanCredits;if(creditBalance>=s){useExtraCredits=s;}else{toast.error(`Need ${needed} credits. Plan: ${subRemaining}, Extra: ${creditBalance}.`);return;}}
    setBusy(true);
    try{
      const {data:order,error:oErr}=await supabase.from("orders").insert({
        client_id:clientId,service_tier_id:sel.id,output_format:fmt,turnaround:turn,
        price:0,currency:"USD",width_inches:w?parseFloat(w):null,height_inches:h?parseFloat(h):null,
        placement_notes:notes.trim()||null,design_name:designName.trim()||null,
        sla_deadline:calcDeadline(turn,isBig),
      }).select().single();
      if(oErr||!order){toast.error("Failed");setBusy(false);return;}
      const fd=new FormData();fd.append("orderId",order.id);for(const f of files)fd.append("files",f);
      const upRes=await fetch("/api/upload/artwork",{method:"POST",body:fd});
      if(!upRes.ok){await supabase.from("orders").update({status:"cancelled"}).eq("id",order.id);toast.error("Upload failed");setBusy(false);return;}
      if(usePlanCredits>0)await supabase.rpc("increment_sub_usage",{sub_id:subscription.id,amount:usePlanCredits}).catch(()=>{});
      if(useExtraCredits>0)await supabase.rpc("decrement_credit_balance",{p_client_id:clientId,p_amount:useExtraCredits}).catch(()=>{});
      fetch("/api/order-confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,orderNumber:order.order_number,service:sel.label,price:0,turnaround:turn})}).catch(()=>{});
      toast.success("Order placed!");
      router.push(`/client/my-orders/${order.id}`);
    }catch(err:any){toast.error(err?.message||"Error");}
    finally{setBusy(false);}
  }

  const inputCls="w-full rounded-lg px-2.5 py-2 text-[12px] border outline-none";
  const inputStyle={background:"var(--elevated)",borderColor:"var(--border2)",color:txt};

  return(
    <div className="portal-content pb-24" style={{background:"var(--bg)"}}>
      <div className="max-w-[600px] mx-auto">
        {/* Header — stitch-inspired */}
        <div className="rounded-2xl p-3 mb-2 relative overflow-hidden" style={{background:"linear-gradient(135deg, rgba(220,38,38,0.04), rgba(245,158,11,0.04), rgba(37,99,235,0.03))",border:"2px dashed rgba(245,158,11,0.2)"}}>
          <div className="flex items-center gap-1.5 mb-1">
            <Crown size={16} style={{color:"#F59E0B"}}/>
            <h2 className="font-syne font-bold text-base" style={{color:txt}}>Quick Order</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{background:"rgba(124,58,237,0.1)",color:"#7C3AED"}}>{subscription.plan.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]" style={{color:txt3}}>
            <span style={{fontWeight:700,color:GREEN.text,fontSize:20}}>{subRemaining}</span> credits left
            {creditBalance>0&&<span style={{color:"#F59E0B",fontWeight:700}}>+{creditBalance} extra</span>}
            <span className="ml-auto">1 credit = standard · {getCreditCost(subscription.plan,true)} = complex</span>
          </div>
        </div>

        {/* 1. Choose service */}
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{color:txt3}}>1. Choose service</p>
          <div className="flex gap-1 mb-1.5 overflow-x-auto">{cats.map(c=>(<button key={c} onClick={()=>setSubCat(c)} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize border whitespace-nowrap" style={{background:subCat===c?PURPLE.bgSoft:"transparent",borderColor:subCat===c?PURPLE.icon+"44":"var(--border2)",color:subCat===c?PURPLE.text:txt3}}>{c==="digitizing"?"🧵":c==="vector"?"✏️":"🪡"} {c}</button>))}</div>
          <div className="grid grid-cols-3 gap-1.5">{(grouped[subCat]||[]).map((t:any)=>{const tc=getCreditCost(subscription.plan,!!t.is_big_design,t.credit_cost);const s=sel?.id===t.id;return(<div key={t.id} onClick={()=>setSel(t)} className="rounded-lg p-2 cursor-pointer text-center transition-all active:scale-[0.97]" style={{background:s?PURPLE.bgSoft:"var(--elevated)",border:"1.5px solid "+(s?PURPLE.icon:"var(--border2)")}}><div className="font-bold text-[11px] mb-0.5" style={{color:s?PURPLE.text:txt}}>{t.label}</div><div className="text-[10px] mb-0.5" style={{color:txt3}}>{t.size_desc}</div><div className="text-[11px] font-bold" style={{color:tc>1?"#F97316":GREEN.text}}>{tc} credit{tc!==1?"s":""}</div></div>)})}</div>
        </div>

        {/* 2. Name & Upload */}
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{color:txt3}}>2. Design name & artwork</p>
          <input value={designName} onChange={e=>setDesignName(e.target.value)} placeholder="Design name (auto-filled from file)" className={inputCls+" mb-1.5"} style={inputStyle}/>
          <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.eps,.svg,.dst" multiple className="hidden" onChange={e=>{const nf=Array.from(e.target.files||[]);if(nf.length){setFiles((p:any)=>[...p,...nf]);if(!designName.trim()){const name=nf[0].name.replace(/\.[^.]+$/,'').replace(/[_\-]/g,' ').replace(/\s+/g,' ').trim();setDesignName(name.slice(0,50));}e.target.value="";}}}/>
          <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);const nf=Array.from(e.dataTransfer.files||[]).filter((f:any)=>f.size<=25*1024*1024);if(nf.length){setFiles((p:any)=>[...p,...nf]);if(!designName.trim()){const name=nf[0].name.replace(/\.[^.]+$/,'').replace(/[_\-]/g,' ').replace(/\s+/g,' ').trim();setDesignName(name.slice(0,50));}}}} className="border-2 border-dashed rounded-xl py-3 text-center cursor-pointer transition-all" style={{borderColor:dragOver?"#2563EB":files.length?GREEN.icon:"var(--border2)",background:dragOver?"rgba(37,99,235,0.04)":files.length?GREEN.bgSoft:"transparent"}}>
            {files.length>0?<p className="text-[12px] font-semibold" style={{color:GREEN.text}}>✓ {files.length} file(s) — tap or drop more</p>:<><p className="text-[12px] font-semibold mb-0.5" style={{color:dragOver?"#2563EB":txt2}}>{dragOver?"Drop files here":"📤 Upload artwork"}</p><p className="text-[10px]" style={{color:txt3}}>Drag & drop or tap · 25MB max</p></>}
          </div>
          {files.length>0&&<div className="mt-1.5 space-y-1 max-h-[100px] overflow-y-auto">{files.map((f:any,i:number)=>(<div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg border text-[11px]" style={{background:"var(--elevated)",borderColor:"var(--border)"}}><span className="truncate flex-1" style={{color:txt}}>{f.name}</span><span className="text-[10px] flex-shrink-0" style={{color:txt3}}>{(f.size/1024/1024).toFixed(1)}MB</span><button onClick={()=>setFiles((p:any)=>p.filter((_:any,j:number)=>j!==i))} className="text-[#BE185D] font-bold">✕</button></div>))}</div>}
        </div>

        {/* 3. Details */}
        <div className="mb-2">
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{color:txt3}}>3. Details (optional)</p>
          <div className="grid grid-cols-3 gap-1.5 mb-1.5">
            <input value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Qty: 1" type="number" min="1" className={inputCls} style={inputStyle}/>
            <input value={w} onChange={e=>setW(e.target.value)} placeholder='Width (in)' type="number" step="0.1" className={inputCls} style={inputStyle}/>
            <input value={h} onChange={e=>setH(e.target.value)} placeholder='Height (in)' type="number" step="0.1" className={inputCls} style={inputStyle}/>
          </div>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Placement / Notes" className={inputCls+" mb-1.5"} style={inputStyle}/>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-wider font-bold flex-shrink-0" style={{color:txt3}}>Format</span>
            <div className="flex gap-1 overflow-x-auto scrollbar-none flex-nowrap">{["DST","PES","EMB","JEF","EXP","VP3"].map(f=>(<button key={f} onClick={()=>setFmt(f)} className="px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer whitespace-nowrap flex-shrink-0" style={{background:fmt===f?PURPLE.bgSoft:"var(--elevated)",borderColor:fmt===f?PURPLE.icon+"44":"var(--border2)",color:fmt===f?PURPLE.text:txt3}}>{f}</button>))}</div>
          </div>
          <p className="text-[9px] mt-0.5" style={{color:txt3}}>💡 DST works with most machines. We convert to any format free.</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] uppercase tracking-wider font-bold flex-shrink-0" style={{color:"#16A34A"}}>Turnaround FREE</span>
            <div className="flex gap-1">{TURNS.map(t=>(<button key={t.id} onClick={()=>setTurn(t.id)} className="px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer" style={{background:turn===t.id?PURPLE.bgSoft:"var(--elevated)",borderColor:turn===t.id?PURPLE.icon+"44":"var(--border2)",color:turn===t.id?PURPLE.text:txt3}}>{t.icon} {t.time}</button>))}</div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={placeOrder} disabled={busy||!sel||!designName.trim()||files.length===0}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-[14px] border-none cursor-pointer disabled:opacity-40 transition-all active:scale-[0.98]"
          style={{background:sel&&designName.trim()&&files.length>0&&!busy?"linear-gradient(135deg, #2563EB, #7C3AED)":"var(--border2)",boxShadow:sel?"0 6px 24px rgba(37,99,235,0.3)":"none"}}>
          {busy?"Placing…":!sel?"👆 Select a tier":!designName.trim()?"👆 Enter design name":files.length===0?"👆 Upload artwork":`Place Order · ${displayCredits} credit${displayCredits!==1?"s":""}${displayExtra>0?" + "+displayExtra+" extra":""}`}
        </button>
        <div className="text-center mt-1.5 space-y-0.5">
          {sel&&<p className="text-[10px]" style={{color:txt3}}>⏱ Delivery: <strong style={{color:txt}}>{selTurn?.time||"12–24h"}</strong> · Pay only when satisfied</p>}
          <p className="text-[10px]" style={{color:txt3,fontStyle:"italic"}}>🧵 Thread-by-thread precision · 🛡️ Free revisions · ♾️ All formats included</p>
        </div>
      </div>
    </div>
  );
}
