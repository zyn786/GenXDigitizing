// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, ArrowRight, ArrowLeft, Crown } from "lucide-react";
import { getCreditCost } from "@/lib/plans";
import { Step1Tier } from "./Step1Tier";
import { Step2Turnaround } from "./Step2Turnaround";
import { Step3Upload } from "./Step3Upload";
import { Step4Confirm } from "./Step4Confirm";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
const GREEN = {bg:"#10B981",bgSoft:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",icon:"#059669",text:"#047857"};
const PURPLE = {bg:"#8B5CF6",bgSoft:"rgba(139,92,246,0.08)",icon:"#7C3AED",text:"#6D28D9"};
const TURNS = [
  {id:"standard",label:"Standard",time:"12–24h",icon:"🕐"},
  {id:"rush",label:"Rush",time:"6h",icon:"⚡"},
  {id:"urgent",label:"Urgent",time:"3h",icon:"🔥"},
];

function calcDeadline(turn:any, big:any){const h=big?12:turn==="urgent"?3:turn==="rush"?6:24;return new Date(Date.now()+h*3600000).toISOString();}

function DoneScreen({done,totalPrice,qty,sel,serviceName,selTurn,router,setDone,setStep,setSel,setFiles,setNotes,setDesignName,setW,setH,setCol,setQuantity,setStitchCount,setInstructions}:any){
  return(
    <div className="portal-content flex items-center justify-center p-4" style={{background:"var(--bg)"}}>
      <div className="rounded-2xl p-6 sm:p-8 max-w-[420px] w-full text-center border" style={{background:"var(--surface)",borderColor:GREEN.border}}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:GREEN.bgSoft}}>
          <CheckCircle size={28} style={{color:GREEN.icon}}/>
        </div>
        <h2 className="font-syne font-bold text-xl mb-2" style={{color:GREEN.text}}>Order Placed!</h2>
        <p className="text-[13px] leading-relaxed mb-4" style={{color:txt2}}>
          <strong className="font-mono text-base" style={{color:PURPLE.text}}>{done.order_number}</strong>
          <br/>submitted — our team is on it.
        </p>
        <div className="rounded-xl p-3 mb-4 text-left" style={{background:"var(--elevated)",border:"1px solid var(--border)"}}>
          <Row k="Service" v={serviceName}/>
          <Row k="Price" v={"$"+totalPrice.toFixed(0)+(qty>1?" ("+qty+"x)":"")} c={GREEN.text}/>
          <Row k="Turnaround" v={selTurn?.icon+" "+selTurn?.label}/>
          <Row k="Revisions" v="♾️ FREE"/>
          <Row k="Conversions" v="🔄 FREE"/>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>router.push("/client/my-orders")} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white"
            style={{background:"linear-gradient(135deg,"+PURPLE.bg+","+PURPLE.icon+")"}}>My Orders</button>
          <button onClick={()=>{setDone(null);setStep(1);setSel(null);setFiles([]);setNotes("");setDesignName("");setW("");setH("");setCol("");setQuantity("1");setStitchCount("");setInstructions("");}}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer border"
            style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}>New Order</button>
        </div>
      </div>
    </div>
  );
}

function Row({k,v,c}:{k:string;v:string;c?:string}){return(<div className="flex justify-between py-1.5 text-[13px]" style={{borderBottom:"1px solid var(--border)"}}><span style={{color:"var(--txt3)"}}>{k}</span><span className="font-bold" style={{color:c||"var(--txt)"}}>{v}</span></div>)}

export function NewOrderWizard({tiers,clientId,userId}:any){
  const router=useRouter(); const supabase=createClient();
  const [step,setStep]=useState(1);
  const [sel,setSel]=useState<any>(null);
  const [turn,setTurn]=useState("standard");
  const [fmt,setFmt]=useState("DST");
  const [extras,setExtras]=useState<any[]>([]);
  const [designName,setDesignName]=useState("");
  const [notes,setNotes]=useState("");
  const [w,setW]=useState(""); const [h,setH]=useState(""); const [col,setCol]=useState("");
  const [files,setFiles]=useState<any[]>([]);
  const fileRef = useRef<any>(null);
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState<any>(null);
  const [stitchCount,setStitchCount]=useState("");
  const [quantity,setQuantity]=useState("1");
  const [instructions,setInstructions]=useState("");
  const [subscription,setSubscription]=useState<any>(null);
  const [creditBalance,setCreditBalance]=useState(0);
  const [dragOver,setDragOver]=useState(false);

  const catLabel = sel? (sel.category==="digitizing"?"Embroidery Digitizing":sel.category==="vector"?"Vector Redraw":sel.category==="sewout"?"Patch Design":"") : "";
  const serviceName = catLabel && sel ? catLabel+" — "+sel.label : sel?.label||"";

  const grouped:any = {};
  for(const t of tiers){grouped[t.category]=grouped[t.category]||[];grouped[t.category].push(t);}
  const isBig=sel?.is_big_design;
  const selTurn=TURNS.find(t=>t.id===turn);
  const qty = parseInt(quantity)||1;

  // Subscription credit logic
  const isSub = !!subscription;
  const creditCost = isSub ? getCreditCost(subscription?.plan||"starter",!!isBig,sel?.credit_cost) : 0;
  const subRemaining = subscription ? subscription.designs_total - subscription.designs_used + (subscription.designs_rolled_over||0) : 0;
  const orderPrice = isSub ? 0 : Number(sel?.price||0)*qty;
  const totalPrice = Number(sel?.price||0)*qty;
  const totalCredits = creditCost * qty;

  // Load subscription on mount
  useEffect(()=>{
    (async()=>{
      if(!clientId)return;
      const {data:sub}=await supabase.from("client_subscriptions").select("*").eq("client_id",clientId).eq("status","active").maybeSingle();
      setSubscription(sub);
      const {data:client}=await supabase.from("clients").select("credit_balance").eq("id",clientId).single();
      setCreditBalance(client?.credit_balance||0);
    })();
  },[]);

  async function placeOrder(){
    if(!sel){toast.error("Select a tier");return;}
    if(!designName.trim()){toast.error("Enter a design name");return;}
    if(files.length===0){toast.error("Upload at least one reference image");return;}
    if(!w||parseFloat(w)<=0){toast.error("Enter a valid width");return;}
    if(!h||parseFloat(h)<=0){toast.error("Enter a valid height");return;}
    if(!notes.trim()){toast.error("Enter placement notes");return;}

    // Subscription credit check
    const needed = creditCost * qty;
    let usePlanCredits=0, useExtraCredits=0;
    if(isSub){
      if(subRemaining>=needed){usePlanCredits=needed;}
      else{
        usePlanCredits=Math.max(0,subRemaining);
        const shortage=needed-usePlanCredits;
        if(creditBalance>=shortage){useExtraCredits=shortage;}
        else{toast.error(`Need ${needed} credits (${qty}×${creditCost}). Plan: ${subRemaining}, Extra: ${creditBalance}. Short ${shortage-creditBalance}.`);return;}
      }
    }
    setBusy(true);
    try{
      const {data:order,error:oErr}=await supabase.from("orders").insert({
        client_id:clientId,service_tier_id:sel.id,output_format:fmt,
        additional_formats:extras.length?extras:null,turnaround:turn,
        price:orderPrice,currency:"USD",
        width_inches:w?parseFloat(w):null,height_inches:h?parseFloat(h):null,
        color_count:col?parseInt(col):null,placement_notes:notes.trim()||null,
        design_name:designName.trim()||null,sla_deadline:calcDeadline(turn,isBig),
      }).select().single();
      if(oErr||!order){toast.error("Failed: "+(oErr?.message||"error"));setBusy(false);return;}

      const fd=new FormData();fd.append("orderId",order.id);
      for(const f of files)fd.append("files",f);
      const upRes=await fetch("/api/upload/artwork",{method:"POST",body:fd});
      if(!upRes.ok){
        await supabase.from("orders").update({status:"cancelled"}).eq("id",order.id).then(()=>{}).catch(()=>{});
        const e=await upRes.json().catch(()=>({}));toast.error(e.error||"Upload failed");setBusy(false);return;
      }

      // Deduct credits after upload success
      if(isSub&&usePlanCredits>0){
        await supabase.rpc("increment_sub_usage",{sub_id:subscription.id,amount:usePlanCredits}).then(()=>{
          setSubscription((p:any)=>p?{...p,designs_used:(p.designs_used||0)+usePlanCredits}:p);
        }).catch(()=>{});
      }
      if(isSub&&useExtraCredits>0){
        await supabase.rpc("decrement_credit_balance",{p_client_id:clientId,p_amount:useExtraCredits}).then(()=>{
          setCreditBalance(p=>Math.max(0,p-useExtraCredits));
        }).catch(()=>{});
      }

      toast.success("Order placed! Redirecting...");
      router.push(`/client/my-orders/${order.id}`);
    }catch(err:any){toast.error(err?.message||"Error");}
    finally{setBusy(false);}
  }

  const cats=Object.keys(grouped);
  const [subCat,setSubCat]=useState(cats[0]||"digitizing");
  const displayCredits = isSub ? totalCredits : 0;
  const displayExtra = isSub && subRemaining<totalCredits ? Math.min(creditBalance,totalCredits-subRemaining) : 0;

  if(done) return <DoneScreen done={done} totalPrice={totalPrice} qty={qty} sel={sel} serviceName={serviceName} selTurn={selTurn} router={router} setDone={setDone} setStep={setStep} setSel={setSel} setFiles={setFiles} setNotes={setNotes} setDesignName={setDesignName} setW={setW} setH={setH} setCol={setCol} setQuantity={setQuantity} setStitchCount={setStitchCount} setInstructions={setInstructions}/>;

  // ── QuickOrder for subscribers ──────────────────
  if(isSub){
    return (
      <div className="portal-content pb-24" style={{background:"var(--bg)"}}>
        <div className="max-w-[600px] mx-auto">
          {/* Header */}
          <div className="rounded-2xl p-4 mb-3" style={{background:"linear-gradient(135deg, rgba(245,158,11,0.08), rgba(139,92,246,0.06))",border:"1px solid rgba(245,158,11,0.2)"}}>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={18} style={{color:"#F59E0B"}}/>
              <h2 className="font-syne font-bold text-base" style={{color:txt}}>Quick Order</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{background:"rgba(124,58,237,0.1)",color:"#7C3AED"}}>{subscription.plan.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="font-syne font-bold text-2xl" style={{color:GREEN.text}}>{subRemaining}</span>
                <span className="text-[11px]" style={{color:txt3}}>credits left</span>
              </div>
              {creditBalance>0&&<div className="flex items-baseline gap-1"><span className="font-syne font-bold text-lg" style={{color:"#F59E0B"}}>+{creditBalance}</span><span className="text-[10px]" style={{color:txt3}}>extra</span></div>}
              <div className="text-[10px] ml-auto" style={{color:txt3}}>1 credit = standard · {getCreditCost(subscription?.plan||"starter",true)} = complex</div>
            </div>
          </div>

          {/* Tier selection */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{color:txt3}}>1. Choose service</p>
            <div className="flex gap-1 mb-2 overflow-x-auto">
              {cats.map(c=>(<button key={c} onClick={()=>setSubCat(c)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize border whitespace-nowrap transition-all" style={{background:subCat===c?PURPLE.bgSoft:"transparent",borderColor:subCat===c?PURPLE.icon+"44":"var(--border2)",color:subCat===c?PURPLE.text:txt3}}>{c==="digitizing"?"🧵":c==="vector"?"✏️":"🪡"} {c}</button>))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(grouped[subCat]||[]).map((t:any)=>{
                const tc=getCreditCost(subscription?.plan||"starter",!!t.is_big_design,t.credit_cost);
                const s=sel?.id===t.id;
                return(
                <div key={t.id} onClick={()=>setSel(t)} className="rounded-xl p-2.5 cursor-pointer text-center transition-all active:scale-[0.97]"
                  style={{background:s?PURPLE.bgSoft:"var(--elevated)",border:"1.5px solid "+(s?PURPLE.icon:"var(--border2)"),boxShadow:s?"0 0 0 1px "+PURPLE.icon+"33":""}}>
                  <div className="font-bold text-[11px] mb-0.5" style={{color:s?PURPLE.text:txt}}>{t.label}</div>
                  <div className="text-[10px] mb-0.5" style={{color:txt3}}>{t.size_desc}</div>
                  <div className="text-[11px] font-bold" style={{color:tc>1?"#F97316":GREEN.text}}>{tc} credit{tc!==1?"s":""}</div>
                </div>
              )})}
            </div>
          </div>

          <div className="border-t mb-3" style={{borderColor:"var(--border2)"}}/>

          {/* Design name + Upload */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{color:txt3}}>2. Name & artwork</p>
            <input value={designName} onChange={e=>setDesignName(e.target.value)} placeholder="Design name * e.g. School Logo, Team Jersey" className="w-full rounded-lg px-3 py-2.5 text-sm border mb-2" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,outline:"none"}}/>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.eps,.svg,.dst" multiple className="hidden" onChange={e=>{const nf=Array.from(e.target.files||[]);if(nf.length){setFiles((p:any)=>[...p,...nf]);e.target.value="";}}}/>
            <div onClick={()=>fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);const nf=Array.from(e.dataTransfer.files||[]).filter((f:any)=>f.size<=25*1024*1024);if(nf.length){setFiles((p:any)=>[...p,...nf]);}}}
              className="border-2 border-dashed rounded-xl py-3 text-center cursor-pointer transition-all"
              style={{borderColor: dragOver?"#2563EB":files.length?GREEN.icon:"var(--border2)",background: dragOver?"rgba(37,99,235,0.04)":files.length?GREEN.bgSoft:"transparent"}}>
              {files.length>0
                ?<p className="text-[12px] font-semibold" style={{color:GREEN.text}}>✓ {files.length} file(s) — tap or drop more</p>
                :<><p className="text-[12px] font-semibold mb-0.5" style={{color:dragOver?"#2563EB":txt2}}>{dragOver?"Drop files here":"📤 Upload artwork"}</p><p className="text-[10px]" style={{color:txt3}}>Drag & drop or tap · 25MB max</p></>}
            </div>
            {files.length>0&&<div className="mt-1.5 space-y-1 max-h-[120px] overflow-y-auto">{files.map((f:any,i:number)=>(<div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg border text-[11px]" style={{background:"var(--elevated)",borderColor:"var(--border)"}}><span className="truncate flex-1" style={{color:txt}}>{f.name}</span><span className="text-[10px] flex-shrink-0" style={{color:txt3}}>{(f.size/1024/1024).toFixed(1)}MB</span><button onClick={()=>setFiles((p:any)=>p.filter((_:any,j:number)=>j!==i))} className="text-[#BE185D] font-bold">✕</button></div>))}</div>}
          </div>

          <div className="border-t mb-3" style={{borderColor:"var(--border2)"}}/>

          {/* Details */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{color:txt3}}>3. Details</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><input value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Qty: 1" type="number" min="1" className="w-full rounded-lg px-2.5 py-2 text-[12px] border" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,outline:"none"}}/></div>
              <div><input value={w} onChange={e=>setW(e.target.value)} placeholder='Width (in)' type="number" step="0.1" className="w-full rounded-lg px-2.5 py-2 text-[12px] border" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,outline:"none"}}/></div>
              <div><input value={h} onChange={e=>setH(e.target.value)} placeholder='Height (in)' type="number" step="0.1" className="w-full rounded-lg px-2.5 py-2 text-[12px] border" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,outline:"none"}}/></div>
            </div>
            <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none flex-nowrap">{["Left Chest","Right Chest","Center","Full Front","Full Back","Sleeve","Cap"].map(p=>(<button key={p} onClick={()=>setNotes(p)} className="px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer transition-all whitespace-nowrap flex-shrink-0" style={{background:notes===p?PURPLE.bgSoft:"var(--elevated)",borderColor:notes===p?PURPLE.icon+"44":"var(--border2)",color:notes===p?PURPLE.text:txt3}}>{p}</button>))}</div>
            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Placement / Notes" className="w-full rounded-lg px-2.5 py-2 text-[11px] border mb-2" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,outline:"none"}}/>
            <textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={2} placeholder="Special instructions (optional)" className="w-full rounded-lg px-2.5 py-2 text-[11px] border resize-none mb-2" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt,outline:"none"}}/>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] uppercase tracking-wider font-bold flex-shrink-0" style={{color:txt3}}>Format</span>
              <div className="flex gap-1 overflow-x-auto scrollbar-none flex-nowrap">{["DST","PES","EMB","JEF","EXP","VP3","XXX","HUS","SEW"].map(f=>(<button key={f} onClick={()=>setFmt(f)} className="px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer transition-all whitespace-nowrap flex-shrink-0" style={{background:fmt===f?PURPLE.bgSoft:"var(--elevated)",borderColor:fmt===f?PURPLE.icon+"44":"var(--border2)",color:fmt===f?PURPLE.text:txt3}}>{f}</button>))}</div>
            </div>
            {extras.length>0&&<div className="flex items-center gap-2 mt-1.5"><span className="text-[9px] font-bold flex-shrink-0" style={{color:GREEN.text}}>+ Extra</span><div className="flex gap-1">{extras.map((f:string)=>(<span key={f} className="px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1" style={{background:PURPLE.bgSoft,borderColor:PURPLE.icon+"44",color:PURPLE.text}}>{f}<button onClick={()=>setExtras((p:any)=>p.filter((x:string)=>x!==f))} style={{color:PURPLE.text,fontWeight:"bold",marginLeft:2}}>×</button></span>))}</div></div>}
            <button onClick={()=>{const available=["PES","EMB","JEF","EXP","VP3","XXX","HUS","SEW","AI","SVG","EPS","PDF"].filter(f=>f!==fmt&&!extras.includes(f));if(available.length){setExtras((p:any)=>[...p,available[0]]);}}} className="text-[10px] font-semibold mt-1.5 underline cursor-pointer border-none bg-transparent" style={{color:PURPLE.text}}>+ Add format</button>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] uppercase tracking-wider font-bold flex-shrink-0" style={{color:GREEN.text}}>Turnaround FREE</span>
              <div className="flex gap-1">{TURNS.map(t=>(<button key={t.id} onClick={()=>setTurn(t.id)} className="px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer transition-all" style={{background:turn===t.id?PURPLE.bgSoft:"var(--elevated)",borderColor:turn===t.id?PURPLE.icon+"44":"var(--border2)",color:turn===t.id?PURPLE.text:txt3}}>{t.icon} {t.time}</button>))}</div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={placeOrder} disabled={busy||!sel||!designName.trim()||files.length===0}
            className="w-full py-4 rounded-2xl text-white font-bold text-[14px] border-none cursor-pointer disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{background:sel&&designName.trim()&&files.length>0&&!busy?"linear-gradient(135deg, #2563EB, #7C3AED)":"var(--border2)",boxShadow:sel&&!busy?"0 6px 24px rgba(37,99,235,0.3)":"none"}}>
            {busy?"Placing order…"
              :!sel?"👆 Select a service tier"
              :!designName.trim()?"👆 Enter a design name"
              :files.length===0?"👆 Upload artwork"
              :`Place Order · ${displayCredits} credit${displayCredits!==1?"s":""}${displayExtra>0?" + "+displayExtra+" extra":""}`}
          </button>
        </div>
      </div>
    );
  }

  // ── Stepper for non-subscribers ──────────────────
  const steps=["Service & Tier","Turnaround","Artwork","Confirm"];
  return (
    <div className="portal-content" style={{background:"var(--bg)"}}>
      <div className="mb-4 sm:mb-5">
        <h2 className="font-syne font-bold text-xl sm:text-2xl"
          style={{background:"linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
          New Order
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{color:txt3}}>Starts from $5 · All turnaround speeds free</p>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {step>1&&<button onClick={()=>setStep(step-1)} className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer active:scale-95" style={{background:"var(--elevated)",borderColor:"var(--border2)",color:txt2}}><ArrowLeft size={16}/></button>}
        <div className="flex-1 flex items-center justify-center gap-1.5 px-2">
          {steps.map((l,i)=>(
            <div key={l} className="flex items-center gap-1.5">
              <button onClick={()=>i+1<step&&setStep(i+1)} className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0" style={{cursor:i+1<step?"pointer":"default"}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{background:step>i+1?"linear-gradient(135deg,"+GREEN.bg+",#06B6D4)":step===i+1?"linear-gradient(135deg,"+PURPLE.bg+","+PURPLE.icon+")":"var(--border2)"}}>
                  {step>i+1?<CheckCircle size={15}/>:i+1}
                </div>
                <span className="hidden sm:inline text-xs font-semibold" style={{color:step===i+1?txt:step>i+1?GREEN.text:txt3}}>{l}</span>
              </button>
              {i<3&&<div className="w-5 sm:w-8 h-px" style={{background:step>i+1?GREEN.icon:"var(--border2)"}}/>}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[720px] mx-auto">
        {step===1&&<Step1Tier grouped={grouped} sel={sel} serviceName={serviceName} setSel={setSel} designName={designName} setDesignName={setDesignName} fmt={fmt} setFmt={setFmt} extras={extras} setExtras={setExtras} qty={qty} totalPrice={totalPrice} setStep={setStep} isSub={isSub} subPlan={subscription?.plan}/>}
        {step===2&&<Step2Turnaround turn={turn} setTurn={setTurn} isBig={isBig} setStep={setStep}/>}
        {step===3&&<Step3Upload files={files} fileRef={fileRef} setFiles={setFiles} w={w} setW={setW} h={h} setH={setH} col={col} setCol={setCol} notes={notes} setNotes={setNotes} stitchCount={stitchCount} setStitchCount={setStitchCount} quantity={quantity} setQuantity={setQuantity} instructions={instructions} setInstructions={setInstructions} setStep={setStep}/>}
        {step===4&&<Step4Confirm sel={sel} serviceName={serviceName} selTurn={selTurn} fmt={fmt} extras={extras} designName={designName} files={files} w={w} h={h} col={col} notes={notes} qty={qty} stitchCount={stitchCount} instructions={instructions} totalPrice={totalPrice} busy={busy} placeOrder={placeOrder} setStep={setStep}/>}
      </div>
    </div>
  );
}
