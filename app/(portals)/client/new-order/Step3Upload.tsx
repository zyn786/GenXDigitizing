// @ts-nocheck
import { useState, useRef, useCallback } from "react";
import { Upload, FileText, ArrowRight, ArrowLeft, ChevronDown, Settings, X, Image as ImageIcon, AlertTriangle } from "lucide-react";
import Image from "next/image";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
const GREEN = {bgSoft:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",icon:"#059669",text:"#047857"};
const PURPLE = {bg:"#8B5CF6",icon:"#7C3AED",text:"#6D28D9"};
const inp = {width:"100%",background:"var(--elevated)",border:"1px solid var(--border2)",borderRadius:10,padding:"12px 14px",color:txt,fontSize:16,outline:"none",fontFamily:"Inter,sans-serif",boxSizing:"border-box"};

const ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.ai,.eps,.svg,.dst";
const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fileFingerprint(f: File): string { return `${f.name}::${f.size}::${f.lastModified}`; }

export function Step3Upload({files,fileRef,setFiles,w,setW,h,setH,col,setCol,notes,setNotes,stitchCount,setStitchCount,quantity,setQuantity,instructions,setInstructions,setStep}:any){
  const [showAdvanced,setShowAdvanced]=useState(false);
  const [dragOver,setDragOver]=useState(false);
  const [errors,setErrors]=useState<string[]>([]);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = fileRef || localRef;

  const existingPrints = () => new Set(files.map((f:any) => fileFingerprint(f.file || f)));

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const errs: string[] = [];
    const prints = existingPrints();
    const added: File[] = [];
    for (const f of arr) {
      if (f.size > MAX_SIZE) { errs.push(`${f.name} exceeds ${formatSize(MAX_SIZE)}`); continue; }
      const fp = fileFingerprint(f);
      if (prints.has(fp)) { errs.push(`${f.name} already added`); continue; }
      prints.add(fp);
      added.push(f);
    }
    if (added.length) {
      setFiles((p:any) => {
        const combined = [...p, ...added];
        return combined.slice(0, MAX_FILES);
      });
      if (files.length + added.length > MAX_FILES) {
        errs.push(`Max ${MAX_FILES} files; extra skipped`);
      }
    }
    if (errs.length) setErrors(errs);
    else setErrors([]);
  }, [files, setFiles]);

  function removeFile(i: number) {
    setFiles((p:any) => p.filter((_:any,j:number) => j!==i));
    setErrors([]);
  }

  function clearAll() {
    setFiles([]);
    setErrors([]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  const missing: string[] = [];
  if (files.length === 0) missing.push("Upload artwork");
  const canGo = missing.length === 0;

  return(
    <div className="rounded-2xl p-3.5 sm:p-5" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
      <h3 className="font-syne font-bold text-[15px] sm:text-sm mb-1" style={{color:txt}}>Upload artwork & details</h3>
      <p className="text-[12px] sm:text-[11px] mb-3" style={{color:txt3}}>PNG · JPG · PDF · AI · EPS · SVG · DST — Max {formatSize(MAX_SIZE)} each · Up to {MAX_FILES} files</p>

      <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden"
        onChange={e => { const nf = Array.from(e.target.files || []); if (nf.length) { addFiles(nf); e.target.value = ""; } }} />

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl py-8 text-center cursor-pointer mb-3 transition-all"
        style={{
          borderColor: dragOver ? "#2563EB" : files.length ? GREEN.icon : "var(--border2)",
          background: dragOver ? "rgba(37,99,235,0.04)" : files.length ? GREEN.bgSoft : "transparent",
        }}>
        {files.length > 0 ? (
          <>
            <FileText size={28} style={{color:GREEN.icon,margin:"0 auto 8px"}}/>
            <p className="text-sm font-semibold" style={{color:GREEN.text}}>{files.length} file(s) selected</p>
            <p className="text-[11px] mt-1" style={{color:txt3}}>Click or drop to add more</p>
          </>
        ) : (
          <>
            <Upload size={28} style={{color:dragOver?"#2563EB":txt3,margin:"0 auto 8px"}}/>
            <p className="text-sm" style={{color:dragOver?"#2563EB":txt2}}>
              {dragOver ? "Drop files here" : <>Drop files or <span style={{color:PURPLE.text,fontWeight:600}}>browse</span></>}
            </p>
            <p className="text-[11px] mt-1" style={{color:txt3}}>Drag & drop supported</p>
          </>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg border" style={{background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.2)"}}>
          {errors.map((e,i) => (
            <p key={i} className="text-[11px] flex items-center gap-1" style={{color:"#B91C1C"}}>
              <AlertTriangle size={11}/> {e}
            </p>
          ))}
        </div>
      )}

      {/* File list with thumbnails */}
      {files.length > 0 && (
        <div className="mb-3 max-h-[200px] overflow-y-auto space-y-1.5">
          {files.map((f:any,i:number) => {
            const isImage = f.type?.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.name);
            const previewUrl = isImage && f instanceof File ? URL.createObjectURL(f) : null;
            return (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border" style={{background:"var(--elevated)",borderColor:"var(--border)"}}>
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border" style={{background:"var(--bg)",borderColor:"var(--border2)"}}>
                  {previewUrl ? (
                    <Image src={previewUrl} alt={f.name} className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(previewUrl)} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <ImageIcon size={14} style={{color:txt3}} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs truncate block" style={{color:txt2}}>{f.name}</span>
                  <span className="text-[10px]" style={{color:txt3}}>{formatSize(f.size || 0)}</span>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 rounded-lg flex-shrink-0 cursor-pointer border-none bg-transparent hover:bg-red-50 transition-colors" style={{color:"#BE185D"}} title="Remove">
                  <X size={14}/>
                </button>
              </div>
            );
          })}
          {/* Clear all */}
          {files.length > 1 && (
            <button onClick={clearAll} className="w-full py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border-none bg-transparent transition-colors" style={{color:"#B91C1C"}}>Clear all files</button>
          )}
        </div>
      )}

      <div className="border-t pt-3 mt-2" style={{borderColor:"var(--border)"}}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Width (in)</label>
            <input type="number" step="0.1" value={w} onChange={e=>setW(e.target.value)} placeholder="3.5" style={inp}/>
          </div>
          <div>
            <label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Height (in)</label>
            <input type="number" step="0.1" value={h} onChange={e=>setH(e.target.value)} placeholder="3.5" style={inp}/>
          </div>
        </div>
        <div className="mb-3"><label className="block text-[12px] sm:text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Placement / Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="e.g. Left chest, center back…" style={{...inp,resize:"none"}}/></div>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{borderColor:"var(--border)"}}>
        <button onClick={()=>setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-3.5 py-3 bg-transparent border-none cursor-pointer transition-colors text-left" style={{color:txt2}}><span className="flex items-center gap-2 text-[13px] font-semibold"><Settings size={14} style={{color:txt3}}/> Advanced Options</span><ChevronDown size={15} style={{color:txt3,transform:showAdvanced?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}/></button>
        {showAdvanced&&<div className="px-3.5 pb-3.5 pt-1" style={{borderTop:"1px solid var(--border)"}}><div className="grid grid-cols-3 gap-3 mb-3"><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Stitch Count</label><input type="number" value={stitchCount} onChange={e=>setStitchCount(e.target.value)} placeholder="e.g. 4200" style={inp}/></div><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Colors</label><input type="number" value={col} onChange={e=>setCol(e.target.value)} placeholder="1" style={inp}/></div><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Quantity</label><input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="1" style={inp}/></div></div><div><label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{color:txt3}}>Special Instructions</label><textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={2} placeholder="e.g. Mirror image, specific thread colors…" style={{...inp,resize:"none"}}/></div></div>}
      </div>

      {!canGo && <p className="text-[11px] text-center mt-3" style={{color:"#C2410C"}}>Required: {missing.join(" · ")}</p>}
      <div className="flex gap-2 mt-1.5">
        <button onClick={()=>setStep(2)} className="flex-1 py-3 rounded-xl text-[14px] sm:text-[13px] font-medium cursor-pointer border flex items-center justify-center gap-1.5" style={{background:"var(--elevated)",color:txt2,borderColor:"var(--border2)"}}><ArrowLeft size={15}/> Back</button>
        <button disabled={!canGo} onClick={()=>setStep(4)} className="flex-[2] py-3 rounded-xl text-[14px] sm:text-[13px] font-semibold border-none cursor-pointer text-white flex items-center justify-center gap-1.5" style={{background:canGo?"linear-gradient(135deg,"+PURPLE.bg+","+PURPLE.icon+")":"var(--border2)",cursor:canGo?"pointer":"not-allowed"}}>Continue <ArrowRight size={15}/></button>
      </div>
    </div>
  );
}
