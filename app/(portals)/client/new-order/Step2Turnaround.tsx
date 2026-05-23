// @ts-nocheck
import { ArrowRight, ArrowLeft } from "lucide-react";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
const GREEN = {bgSoft:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",text:"#047857"};
const PURPLE = {bg:"#8B5CF6",icon:"#7C3AED"};
const TURNS = [
  {id:"standard",label:"Standard",time:"12–24h",icon:"🕐",desc:"Default for all orders"},
  {id:"rush",label:"Rush",time:"6h",icon:"⚡",desc:"Most designs eligible"},
  {id:"urgent",label:"Urgent",time:"3h",icon:"🔥",desc:"Standard & vector only"},
];
const TURN_COLORS = [
  {bg:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",text:"#047857"},
  {bg:"rgba(249,115,22,0.08)",border:"rgba(249,115,22,0.25)",text:"#C2410C"},
  {bg:"rgba(139,92,246,0.08)",border:"rgba(139,92,246,0.25)",text:"#6D28D9"},
];

export function Step2Turnaround({turn,setTurn,isBig,setStep}:any){
  return(
    <div className="rounded-2xl p-4 sm:p-5" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
      <h3 className="font-syne font-bold text-sm mb-1" style={{color:txt}}>Choose turnaround speed</h3>
      <p className="text-[13px] mb-3" style={{color:txt2}}>All speeds are <strong style={{color:GREEN.text}}>100% free</strong> — no rush surcharges ever.</p>
      {TURNS.map((t,i)=>{
        const c=TURN_COLORS[i];const s=turn===t.id;
        return(
          <div key={t.id} onClick={()=>setTurn(t.id)} className="rounded-xl p-3.5 sm:p-4 cursor-pointer transition-all active:scale-[0.98] mb-2"
            style={{background:s?c.bg:"var(--elevated)",border:"1.5px solid "+(s?c.text:"var(--border2)"),boxShadow:s?"0 0 0 1px "+c.text+"22":""}}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:s?c.bg:"var(--elevated)"}}>{t.icon}</div>
                <div><div className="font-semibold text-[14px]" style={{color:s?c.text:txt}}>{t.label}</div><div className="text-[11px] mt-0.5" style={{color:txt3}}>{t.desc}</div></div>
              </div>
              <div className="text-right flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{background:GREEN.bgSoft,color:GREEN.text,borderColor:GREEN.border}}>FREE</span>
                <div className="font-syne font-bold text-sm" style={{color:c.text}}>{t.time}</div>
              </div>
            </div>
          </div>
        );
      })}
      {isBig&&<div className="p-2.5 rounded-xl text-xs font-medium border" style={{background:"rgba(249,115,22,0.08)",color:"#C2410C",borderColor:"rgba(249,115,22,0.25)"}}>⚠️ Big design — actual turnaround ~12 hours.</div>}
      <div className="flex gap-2 mt-4">
        <button onClick={()=>setStep(1)} className="flex-1 py-3 rounded-xl text-[14px] sm:text-[13px] font-medium cursor-pointer border flex items-center justify-center gap-1.5" style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}><ArrowLeft size={15}/> Back</button>
        <button onClick={()=>setStep(3)} className="flex-[2] py-3 rounded-xl text-[14px] sm:text-[13px] font-semibold border-none cursor-pointer text-white flex items-center justify-center gap-1.5" style={{background:"linear-gradient(135deg,"+PURPLE.bg+","+PURPLE.icon+")"}}>Continue <ArrowRight size={15}/></button>
      </div>
    </div>
  );
}
