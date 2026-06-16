// @ts-nocheck
"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { QuickOrder } from "./QuickOrder";
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

  // Load subscription
  useEffect(()=>{(async()=>{if(!clientId)return;const{data:sub}=await supabase.from("client_subscriptions").select("*").eq("client_id",clientId).eq("status","active").maybeSingle();setSubscription(sub);const{data:c}=await supabase.from("clients").select("credit_balance").eq("id",clientId).single();setCreditBalance(c?.credit_balance||0);})();},[]);

  // Smart routing: subscribers get QuickOrder
  if(subscription){return <QuickOrder tiers={tiers} clientId={clientId} userId={userId} subscription={subscription} creditBalance={creditBalance}/>;}

  const catLabel = sel? (sel.category==="digitizing"?"Embroidery Digitizing":sel.category==="vector"?"Vector Redraw":sel.category==="sewout"?"Patch Design":"") : "";
  const serviceName = catLabel && sel ? catLabel+" — "+sel.label : sel?.label||"";

  const grouped:any = {};
  for(const t of tiers){grouped[t.category]=grouped[t.category]||[];grouped[t.category].push(t);}
  const isBig=sel?.is_big_design;
  const selTurn=(TURNS||[]).find(t=>t.id===turn)||TURNS[0];
  const qty = parseInt(quantity)||1;
  const totalPrice = Number(sel?.price||0)*qty;

  async function placeOrder(){
    if(!sel){toast.error("Select a tier");return;}
    if(!designName.trim()){toast.error("Enter a design name");return;}
    if(files.length===0){toast.error("Upload at least one reference image");return;}
    if((w&&!h)||(!w&&h)){toast.error("Enter both width and height, or leave both");return;}
    setBusy(true);
    try{
      const {data:order,error:oErr}=await supabase.from("orders").insert({
        client_id:clientId,service_tier_id:sel.id,output_format:fmt,
        additional_formats:extras.length?extras:null,turnaround:turn,
        price:totalPrice,currency:"USD",
        width_inches:w?parseFloat(w):null,height_inches:h?parseFloat(h):null,
        color_count:col?parseInt(col):null,placement_notes:notes.trim()||null,
        design_name:designName.trim()||null,sla_deadline:calcDeadline(turn,isBig),
      }).select().single();
      if(oErr||!order){toast.error("Failed: "+(oErr?.message||"error"));setBusy(false);return;}
      const fd=new FormData();fd.append("orderId",order.id);for(const f of files)fd.append("files",f);
      const upRes=await fetch("/api/upload/artwork",{method:"POST",body:fd});
      if(!upRes.ok){await supabase.from("orders").update({status:"cancelled"}).eq("id",order.id);const e=await upRes.json().catch(()=>({}));toast.error(e.error||"Upload failed");setBusy(false);return;}
      fetch("/api/order-confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,orderNumber:order.order_number,service:sel.label,price:totalPrice,turnaround:turn})}).catch(()=>{});
      toast.success("Order placed! Redirecting...");
      router.push(`/client/my-orders/${order.id}`);
    }catch(err:any){toast.error(err?.message||"Error");}
    finally{setBusy(false);}
  }

  if(done) return <DoneScreen done={done} totalPrice={totalPrice} qty={qty} sel={sel} serviceName={serviceName} selTurn={selTurn} router={router} setDone={setDone} setStep={setStep} setSel={setSel} setFiles={setFiles} setNotes={setNotes} setDesignName={setDesignName} setW={setW} setH={setH} setCol={setCol} setQuantity={setQuantity} setStitchCount={setStitchCount} setInstructions={setInstructions}/>;

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
        {step===1&&<Step1Tier grouped={grouped} sel={sel} serviceName={serviceName} setSel={setSel} designName={designName} setDesignName={setDesignName} fmt={fmt} setFmt={setFmt} extras={extras} setExtras={setExtras} qty={qty} totalPrice={totalPrice} setStep={setStep}/>}
        {step===2&&<Step2Turnaround turn={turn} setTurn={setTurn} isBig={isBig} setStep={setStep}/>}
        {step===3&&<Step3Upload files={files} fileRef={fileRef} setFiles={setFiles} w={w} setW={setW} h={h} setH={setH} col={col} setCol={setCol} notes={notes} setNotes={setNotes} stitchCount={stitchCount} setStitchCount={setStitchCount} quantity={quantity} setQuantity={setQuantity} instructions={instructions} setInstructions={setInstructions} setStep={setStep}/>}
        {step===4&&<Step4Confirm sel={sel} serviceName={serviceName} selTurn={selTurn} fmt={fmt} extras={extras} designName={designName} files={files} w={w} h={h} col={col} notes={notes} qty={qty} stitchCount={stitchCount} instructions={instructions} totalPrice={totalPrice} busy={busy} placeOrder={placeOrder} setStep={setStep}/>}
      </div>
    </div>
  );
}
