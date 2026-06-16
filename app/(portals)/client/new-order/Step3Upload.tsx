// @ts-nocheck
import { useState } from "react";
import { Upload, FileText, ArrowRight, ArrowLeft, ChevronDown, Settings } from "lucide-react";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
const GREEN = {bgSoft:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",icon:"#059669",text:"#047857"};
const PURPLE = {bg:"#8B5CF6",icon:"#7C3AED",text:"#6D28D9"};
const inp = {width:"100%",background:"var(--elevated)",border:"1px solid var(--border2)",borderRadius:10,padding:"12px 14px",color:txt,fontSize:16,outline:"none",fontFamily:"Inter,sans-serif",boxSizing:"border-box"};

export function Step3Upload({files,fileRef,setFiles,w,setW,h,setH,col,setCol,notes,setNotes,stitchCount,setStitchCount,quantity,setQuantity,instructions,setInstructions,setStep}:any){
  const [showAdvanced,setShowAdvanced]=useState(false);
  return(
    <div className="rounded-2xl p-3.5 sm:p-5" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
      <h3 className="font-syne font-bold text-[15px] sm:text-sm mb-1" style={{color:txt}}>Upload artwork & details</h3>
      <p className="text-[12px] sm:text-[11px] mb-3" style={{color:txt3}}>PNG · JPG · Max 50 MB each — reference image required</p>
      <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg" multiple className="hidden" onChange={e=>{const nf=Array.from(e.target.files||[]);if(nf.length){setFiles((p:any)=>[...p,...nf]);e.target.value="";}}}/>
      <div onClick={()=>fileRef.current?.click()} className="border-2 border-dashed rounded-xl py-8 text-center cursor-pointer mb-3 transition-all" style={{borderColor:files.length?GREEN.icon:"var(--border2)",background:files.length?GREEN.bgSoft:"transparent"}}>
        {files.length>0?<><FileText size={28} style={{color:GREEN.icon,margin:"0 auto 8px"}}/><p className="text-sm font-semibold" style={{color:GREEN.text}}>{files.length} file(s) selected</p><p className="text-[11px] mt-1" style={{color:txt3}}>Tap to add more</p></>:<><Upload size={28} style={{color:txt3,margin:"0 auto 8px"}}/><p className="text-sm" style={{color:txt2}}>Drop PNG/JPG or <span style={{color:PURPLE.text,fontWeight:600}}>browse files</span></p><p className="text-[11px] mt-1" style={{color:txt3}}>Click to select artwork</p></>}
      </div>
      {files.length>0&&<div className="mb-3">{files.map((f:any,i:number)=>(<div key={i} className="flex justify-between items-center px-3 py-2.5 mb-1 rounded-lg border" style={{background:"var(--elevated)",borderColor:"var(--border)"}}><span className="text-xs truncate flex-1 mr-2" style={{color:txt2}}>{f.name}</span><button onClick={()=>setFiles((p:any)=>p.filter((_:any,j:number)=>j!==i))} className="text-[11px] font-semibold cursor-pointer border-none bg-transparent flex-shrink-0" style={{color:"#BE185D"}}>Remove</button></div>))}</div>}
      <div className="border-t pt-3 mt-2" style={{borderColor:"var(--border)"}}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Width (in) *</label><input type="number" step="0.1" value={w} onChange={e=>setW(e.target.value)} placeholder="3.5" style={inp}/></div>
          <div><label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Height (in) *</label><input type="number" step="0.1" value={h} onChange={e=>setH(e.target.value)} placeholder="3.5" style={inp}/></div>
        </div>
        <div className="mb-3"><label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Placement / Notes *</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="e.g. Left chest, center back…" style={{...inp,resize:"none"}}/></div>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{borderColor:"var(--border)"}}>
        <button onClick={()=>setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-3.5 py-3 bg-transparent border-none cursor-pointer transition-colors text-left" style={{color:txt2}}><span className="flex items-center gap-2 text-[13px] font-semibold"><Settings size={14} style={{color:txt3}}/> Advanced Options</span><ChevronDown size={15} style={{color:txt3,transform:showAdvanced?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}/></button>
        {showAdvanced&&<div className="px-3.5 pb-3.5 pt-1" style={{borderTop:"1px solid var(--border)"}}><div className="grid grid-cols-3 gap-3 mb-3"><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Stitch Count</label><input type="number" value={stitchCount} onChange={e=>setStitchCount(e.target.value)} placeholder="e.g. 4200" style={inp}/></div><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Colors</label><input type="number" value={col} onChange={e=>setCol(e.target.value)} placeholder="1" style={inp}/></div><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Quantity</label><input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="1" style={inp}/></div></div><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Special Instructions</label><textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={2} placeholder="e.g. Mirror image, specific thread colors…" style={{...inp,resize:"none"}}/></div></div>}
      </div>
      {(()=>{
        const missing:string[]=[];
        if(files.length===0)missing.push("Upload artwork");
        const canGo=missing.length===0;
        return(<>
          {!canGo&&<p className="text-[11px] text-center mt-3" style={{color:"#C2410C"}}>Required: {missing.join(" · ")}</p>}
          <div className="flex gap-2 mt-1.5">
            <button onClick={()=>setStep(2)} className="flex-1 py-3 rounded-xl text-[14px] sm:text-[13px] font-medium cursor-pointer border flex items-center justify-center gap-1.5" style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}><ArrowLeft size={15}/> Back</button>
            <button disabled={!canGo} onClick={()=>setStep(4)} className="flex-[2] py-3 rounded-xl text-[14px] sm:text-[13px] font-semibold border-none cursor-pointer text-white flex items-center justify-center gap-1.5" style={{background:canGo?"linear-gradient(135deg,"+PURPLE.bg+","+PURPLE.icon+")":"var(--border2)",cursor:canGo?"pointer":"not-allowed"}}>Continue <ArrowRight size={15}/></button>
          </div>
        </>);
      })()}
    </div>
  );
}
