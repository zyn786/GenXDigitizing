// @ts-nocheck
import { CheckCircle, ArrowRight } from "lucide-react";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
const GREEN = {bgSoft:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",text:"#047857"};
const PURPLE = {bg:"#8B5CF6",icon:"#7C3AED"};

const FMTS = ["DST","PES","EMB","JEF","XXX","VIP","HUS","EXP","VP3","SEW","AI","SVG","EPS","PDF"];
const CATS = {
  digitizing:{emoji:"🧵",label:"Embroidery Digitizing",color:"#7C3AED",bg:"rgba(139,92,246,0.08)",border:"rgba(139,92,246,0.25)",text:"#6D28D9"},
  vector:{emoji:"✏️",label:"Vector Redraw",color:"#0891B2",bg:"rgba(6,182,212,0.08)",border:"rgba(6,182,212,0.25)",text:"#0E7490"},
  sewout:{emoji:"🪡",label:"Patch Design",color:"#059669",bg:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",text:"#047857"},
};
const inp = {width:"100%",background:"var(--elevated)",border:"1px solid var(--border2)",borderRadius:10,padding:"12px 14px",color:txt,fontSize:16,outline:"none",fontFamily:"Inter,sans-serif",boxSizing:"border-box"};

export function Step1Tier({grouped,sel,serviceName,setSel,designName,setDesignName,fmt,setFmt,extras,setExtras,qty,totalPrice,setStep}:any){
  return(
    <div className="rounded-2xl p-3.5 sm:p-5" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
      <div className="mb-4">
        <label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Design name *</label>
        <input value={designName} onChange={e=>setDesignName(e.target.value)} placeholder="e.g. School Logo, Team Jersey…" style={inp}/>
      </div>
      <div className="border-t pt-4 mb-4" style={{borderColor:"var(--border)"}}>
        <h3 className="font-syne font-bold text-[15px] sm:text-sm mb-1" style={{color:txt}}>Choose service & tier</h3>
        <p className="text-[12px] sm:text-[11px] mb-3" style={{color:txt3}}>Select a category and tier to continue</p>
        <div className="flex flex-col gap-2.5">
          {Object.entries(grouped).map(([cat,catTiers]:any)=>{
            const m=CATS[cat]||{emoji:"📋",label:cat,color:"#7C3AED",bg:"rgba(139,92,246,0.08)",border:"rgba(139,92,246,0.25)",text:"#6D28D9"};
            return(
              <div key={cat}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-sm">{m.emoji}</span>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{color:m.text}}>{m.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {catTiers.map((t:any)=>{
                    const s=sel?.id===t.id;
                    return(
                      <div key={t.id} onClick={()=>setSel(t)} className="rounded-lg p-2.5 sm:p-3 cursor-pointer transition-all active:scale-[0.97] relative"
                        style={{background:s?m.bg:"var(--elevated)",border:"1.5px solid "+(s?m.color:"var(--border2)"),boxShadow:s?"0 0 0 1px "+m.color+"22":""}}>
                        {s&&<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{background:m.color}}><CheckCircle size={11} className="text-white"/></div>}
                        <div className="font-semibold text-[11px] sm:text-[13px] mb-0.5 pr-4 leading-tight" style={{color:s?m.text:txt}}>{t.label}</div>
                        <div className="text-[9px] sm:text-[10px] mb-1" style={{color:txt3}}>{t.size_desc}</div>
                        <div className="font-syne font-bold text-base sm:text-lg" style={{color:m.text}}>${Number(t.price).toFixed(0)}</div>
                        <div className="text-[9px] sm:text-[10px] mt-0.5 flex items-center gap-1" style={{color:txt3}}><span>{t.est_hours}</span>{t.is_big_design&&<span className="font-medium" style={{color:"#C2410C"}}>⚠️~12h</span>}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t pt-3 mt-2" style={{borderColor:"var(--border)"}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Primary Format</label>
            <select value={fmt} onChange={e=>setFmt(e.target.value)} style={{...inp,cursor:"pointer"}}>{FMTS.map(f=><option key={f}>{f}</option>)}</select>
          </div>
          <div>
            <label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Extra Formats <span style={{color:GREEN.text}}>FREE</span></label>
            <select onChange={e=>{const v=e.target.value;if(v&&!extras.includes(v))setExtras((p:any)=>[...p,v]);e.target.value="";}} style={{...inp,cursor:"pointer"}}><option value="">+ Add format</option>{FMTS.filter(f=>f!==fmt&&!extras.includes(f)).map(f=><option key={f}>{f}</option>)}</select>
            {extras.length>0&&<div className="flex gap-1 flex-wrap mt-1.5">{extras.map((f:any)=><span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border" style={{background:GREEN.bgSoft,color:GREEN.text,borderColor:GREEN.border}}>{f}<span onClick={()=>setExtras((p:any)=>p.filter((x:any)=>x!==f))} className="cursor-pointer opacity-70 ml-0.5">×</span></span>)}</div>}
          </div>
        </div>
      </div>
      {sel&&<div className="mt-3 p-3 rounded-xl flex items-center justify-between" style={{background:GREEN.bgSoft,border:"1px solid "+GREEN.border}}><span className="text-[13px] font-semibold" style={{color:txt}}>{serviceName||sel.label}{qty>1?" × "+qty:""}</span><span className="font-syne font-bold text-xl" style={{color:GREEN.text}}>${totalPrice.toFixed(0)}</span></div>}
      {(!designName.trim() || !sel) && <p className="text-[11px] text-center mt-3" style={{color:"#C2410C"}}>{!designName.trim()?"Enter a design name":!sel?"Select a service tier":""}</p>}
      <button disabled={!sel||!designName.trim()} onClick={()=>setStep(2)} className="w-full mt-1.5 py-3.5 rounded-xl text-[14px] sm:text-[13px] font-semibold border-none cursor-pointer text-white active:scale-[0.98] transition-all" style={{background:sel&&designName.trim()?"linear-gradient(135deg,"+PURPLE.bg+","+PURPLE.icon+")":"var(--border2)",cursor:sel&&designName.trim()?"pointer":"not-allowed"}}>Continue {sel&&designName.trim()?"— $"+totalPrice.toFixed(0):""} <ArrowRight size={15} className="inline ml-1"/></button>
    </div>
  );
}
