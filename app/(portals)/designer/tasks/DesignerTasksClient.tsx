// @ts-nocheck
"use client";
import { useState, useTransition } from "react";
import { useRouter }               from "next/navigation";
import { toast }                   from "sonner";
import { createClient }            from "@/lib/supabase/client";
import { Download, ChevronDown, ChevronUp, Trash2, Clock, AlertTriangle, CheckCircle2, ClipboardList, Star, DollarSign, RotateCcw, ChevronRight, Upload, FileText, X } from "lucide-react";
import { formatDate, formatCurrency, hoursUntilDeadline, TURNAROUND_OPTIONS } from "@/lib/utils";
import Image from "next/image";

const PC = {
  urgent:   { bg: "#EF4444", bgSoft: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: "#DC2626", text: "#B91C1C", glow: "rgba(239,68,68,0.20)" },
  rush:     { bg: "#F59E0B", bgSoft: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: "#D97706", text: "#92400E", glow: "rgba(245,158,11,0.20)" },
  standard: { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857", glow: "rgba(16,185,129,0.20)" },
};

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";

function SLABadge({ deadline, turnaround }: { deadline: string; turnaround: string }) {
  const h    = hoursUntilDeadline(deadline);
  const t    = TURNAROUND_OPTIONS[turnaround] ?? TURNAROUND_OPTIONS.standard;
  const col  = h === null ? "#94A3B8" : h <= 0 ? "#EF4444" : h <= 2 ? "#EF4444" : h <= 6 ? "#F59E0B" : "#10B981";
  const text = h === null ? t.time : h <= 0 ? "OVERDUE" : `${h}h left`;
  return (
    <span style={{ padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:`${col}18`,color:col,border:`1px solid ${col}40`,whiteSpace:"nowrap" }}>
      {t.icon} {text}
    </span>
  );
}

const STAT_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.20)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.20)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.20)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.20)", icon: "#7C3AED", text: "#6D28D9" },
];

export function DesignerTasksClient({ tasks, completedOrders, userId, designerId, designerName, designerAvatar, stats }: {
  tasks: any[]; completedOrders: any[]; userId: string; designerId: string;
  designerName: string; designerAvatar?: string;
  stats: { active: number; urgent: number; completed: number; totalOrders: number; earnings: number; avgRating: number; revisionRate: number };
}) {
  const router     = useRouter();
  const supabase   = createClient();
  const [,startTx] = useTransition();
  const [expanded, setExpanded] = useState(new Set());
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedModal, setCompletedModal] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<any>(null); // { orderId, orderNumber }
  const [uploadFiles, setUploadFiles] = useState<{ id: string; file: File; format: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const OUTPUT_FORMATS = ["DST","PES","EMB","JEF","XXX","VIP","HUS","EXP","VP3","SEW","AI","SVG","EPS","PDF"];
  const ALLOWED_ACCEPT = ".dst,.pes,.emb,.jef,.xxx,.vip,.hus,.exp,.vp3,.cnd,.tap,.png,.jpg,.jpeg,.webp,.pdf,.svg,.ai,.eps";

  function addUploadFiles(files: FileList | File[]) {
    const newFiles = Array.from(files).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      format: f.name.split(".").pop()?.toUpperCase() || "DST",
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  }

  async function submitUpload() {
    if (!uploadFiles.length || !uploadModal) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("orderId", uploadModal.orderId);
      uploadFiles.forEach(f => {
        fd.append("files", f.file);
        fd.append("formats", f.format);
      });
      const res = await fetch("/api/upload/output", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Upload failed"); }
      toast.success(`${uploadFiles.length} file(s) submitted for QA`);
      setUploadModal(null);
      setUploadFiles([]);
      router.refresh();
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
    finally { setUploading(false); }
  }

  async function downloadFile(url: string, name: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 200);
    } catch {
      window.open(url, "_blank");
    }
  }

  function toggle(id: string) {
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const updates: any = { status };
      if (status === "in_progress") updates.in_progress_at = new Date().toISOString();
      const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
      if (error) { toast.error("Failed: " + error.message); return; }
      toast.success(status === "in_progress" ? "Marked as In Progress" : "Status updated");
      startTx(() => router.refresh());
    } finally { setUpdating(null); }
  }

  async function deleteFile(fileId: string, orderId: string) {
    if (!confirm("Delete this output file? This cannot be undone.")) return;
    setDeleting(fileId);
    try {
      const res = await fetch("/api/upload/output/delete", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ file_id:fileId, order_id:orderId }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error ?? "Delete failed"); return; }
      toast.success("File deleted");
      startTx(() => router.refresh());
    } catch (err: any) { toast.error(err.message ?? "Delete failed"); }
    finally { setDeleting(null); }
  }

  const PRIORITY_ORDER = { urgent:0, rush:1, standard:2 };
  const sorted = [...tasks].sort((a,b) => (PRIORITY_ORDER[a.turnaround]??2) - (PRIORITY_ORDER[b.turnaround]??2));
  const filtered = filter==="all" ? sorted : sorted.filter(t => t.turnaround===filter);
  const counts = {
    all: tasks.length,
    urgent: tasks.filter(t => t.turnaround==="urgent").length,
    rush: tasks.filter(t => t.turnaround==="rush").length,
    standard: tasks.filter(t => t.turnaround==="standard").length,
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5" style={{ maxWidth:900, margin:"0 auto", width:"100%" }}>
      {/* ── Profile strip (top) ── */}
      <div className="px-4 py-3 rounded-2xl mb-5"
        style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background:"linear-gradient(135deg, #7C3AED, #D946EF)" }}>
            {designerAvatar
              ? <Image fill src={designerAvatar} alt={designerName} className="rounded-full object-cover"  sizes="(max-width: 768px) 100vw, 800px" />
              : designerName?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-syne font-bold text-[14px]" style={{ color:txt }}>{designerName}</span>
            <span className="text-[11px] ml-2" style={{ color:txt3 }}>Designer</span>
          </div>
          {stats.avgRating > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color:"#D97706" }}>
              <Star size={13} fill="#D97706" /> {stats.avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* ── Title ── */}
      <h2 className="font-syne font-bold text-xl sm:text-2xl leading-tight mb-1"
        style={{ background:"linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
        My Tasks
      </h2>
      <p className="text-[12px] mb-5 font-medium" style={{ color:txt3 }}>
        {tasks.length} active · {counts.urgent} urgent · {counts.rush} rush · {stats.completed} completed
      </p>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {[
          { label:"Active Tasks", val:stats.active, sub:`${stats.urgent} urgent`, icon:<ClipboardList size={15}/>, ci:0 },
          { label:"Completed", val:stats.completed, sub:`${stats.totalOrders} total`, icon:<CheckCircle2 size={15}/>, ci:1 },
          { label:"Revision Rate", val:`${stats.revisionRate}%`, sub:null, icon:<RotateCcw size={15}/>, ci:3 },
        ].map(s => {
          const c = STAT_COLORS[s.ci];
          return (
            <div key={s.label} className="rounded-2xl p-3 sm:p-3.5 transition-all hover:translate-y-[-2px]"
              style={{ background:c.bgSoft, border:`1px solid ${c.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.03)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:c.bgSoft, color:c.icon }}>
                  {s.icon}
                </div>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold" style={{ color:txt3 }}>{s.label}</span>
              </div>
              <div className="font-syne font-bold text-lg sm:text-xl" style={{ color:c.text }}>{s.val}</div>
              {s.sub && <div className="text-[10px] mt-0.5" style={{ color:txt3 }}>{s.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none flex-nowrap pb-1 -mx-0.5 px-0.5" style={{ WebkitOverflowScrolling:"touch" }}>
        <button onClick={()=>setFilter("all")}
          className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all active:scale-95"
          style={{
            background: filter==="all" ? "linear-gradient(135deg, #6366F1, #3B82F6)" : "var(--elevated)",
            color: filter==="all" ? "#fff" : txt2,
            borderColor: filter==="all" ? "transparent" : "var(--border2)",
            boxShadow: filter==="all" ? "0 2px 12px rgba(99,102,241,0.20)" : "none",
          }}>📋 All <span className="text-[10px] opacity-75">({counts.all})</span></button>
        {[{ key:"urgent",label:"Urgent",icon:"🔥",c:PC.urgent },{ key:"rush",label:"Rush",icon:"⚡",c:PC.rush },{ key:"standard",label:"Standard",icon:"🕐",c:PC.standard }].map(tab=>{
          const isActive = filter===tab.key;
          return (
            <button key={tab.key} onClick={()=>setFilter(isActive?"all":tab.key)}
              className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all active:scale-95"
              style={{
                background: isActive ? tab.c.bg : tab.c.bgSoft,
                color: isActive ? "#fff" : tab.c.text,
                borderColor: isActive ? tab.c.bg : tab.c.border,
                boxShadow: isActive ? `0 2px 12px ${tab.c.glow}` : "none",
              }}>{tab.icon} {tab.label} <span className="text-[10px] opacity-80">({counts[tab.key]})</span></button>
          );
        })}
      </div>

      {/* ── Active task list ── */}
      {tasks.length===0 ? (
        <div className="text-center py-14 rounded-2xl border mb-5" style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-syne font-bold text-lg" style={{ color:txt }}>No active tasks</p>
          <p className="text-sm" style={{ color:txt2 }}>New assignments will appear here</p>
        </div>
      ) : filtered.length===0 ? (
        <div className="text-center py-14 rounded-2xl border mb-5" style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-syne font-bold text-lg" style={{ color:txt }}>No matching tasks</p>
          <p className="text-sm" style={{ color:txt2 }}>Try a different filter</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-5">
          {filtered.map(o => {
            const artwork = (o.order_files??[]).filter((f:any)=>f.file_type==="artwork");
            const isOpen  = expanded.has(o.id);
            const isUpd   = updating===o.id;
            const pr      = PC[o.turnaround]??PC.standard;

            return (
              <div key={o.id} className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background:"var(--surface)",
                  border:`1px solid var(--border)`,
                  borderLeft:`3px solid ${pr.bg}`,
                  boxShadow: isOpen ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                  opacity: isUpd ? 0.6 : 1,
                }}>
                {/* Header */}
                <div className="px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer select-none"
                  style={{ WebkitTapHighlightColor:"transparent" }}
                  onClick={()=>toggle(o.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-[13px] sm:text-[14px] font-bold tracking-tight"
                          style={{ background:"linear-gradient(90deg, #7C3AED, #06B6D4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                          {o.order_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background:pr.bgSoft, color:pr.text, border:`1px solid ${pr.border}` }}>
                          {o.turnaround}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background:"var(--elevated)", color:txt2, border:"1px solid var(--border2)" }}>
                          {o.status?.replace(/_/g," ")}
                        </span>
                        <SLABadge deadline={o.sla_deadline} turnaround={o.turnaround}/>
                      </div>
                      <h3 className="font-semibold text-[14px] sm:text-[15px] mb-1" style={{ color:txt }}>
                        {o.clients?.company_name??"—"}
                      </h3>
                      <div className="flex items-center gap-3 text-[12px] flex-wrap" style={{ color:txt2 }}>
                        <span>{o.service_tiers?.label??""}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background:"var(--elevated)", color:txt3 }}>
                          {o.output_format}
                        </span>
                        {o.design_name && <span className="hidden sm:inline">{o.design_name}</span>}
                      </div>
                      {!isOpen && o.placement_notes && (
                        <p className="text-[11px] mt-1.5 truncate max-w-[280px]" style={{ color:txt3 }}>📝 {o.placement_notes}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isOpen ? <ChevronUp size={16} style={{ color:txt3 }}/> : <ChevronDown size={16} style={{ color:txt3 }}/>}
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-4 sm:px-5 py-4" style={{ borderTop:"1px solid var(--border)" }}>
                    {o.placement_notes && (
                      <div className="mb-3 p-3 rounded-xl text-[12px]" style={{ background:"var(--elevated)", color:txt2, lineHeight:1.5 }}>
                        📝 {o.placement_notes}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color:txt3 }}>Order Details</p>
                        {[["Service",o.service_tiers?.label],["Size",o.service_tiers?.size_desc],["Output",o.output_format],["Colors",o.color_count??"—"],["Assigned",o.assigned_at?new Date(o.assigned_at).toLocaleString():"—"]].map(([l,v])=>(
                          <div key={l} className="flex justify-between py-1.5 text-[12px]" style={{ borderBottom:"1px solid var(--border)" }}>
                            <span style={{ color:txt3 }}>{l}</span><span style={{ color:txt }}>{v??"—"}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color:txt3 }}>Artwork Files</p>
                        {artwork.length===0
                          ? <p className="text-[12px]" style={{ color:txt3 }}>No artwork — client may send via email</p>
                          : artwork.map((f:any)=>(
                            <div key={f.id} className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl mb-2"
                              style={{ background:"var(--elevated)", border:"1px solid var(--border)" }}>
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" style={{ background:"var(--elevated2)" }}
                                  onClick={(e)=>{ e.stopPropagation(); setPreviewImage(f.signed_url||f.file_url); }}>
                                  <Image fill src={f.signed_url||f.file_url} alt={f.file_name} className="object-cover"
                                    onError={(e:any)=>{ e.target.style.display="none"; }} sizes="(max-width: 768px) 100vw, 800px" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[12px] truncate font-medium" style={{ color:txt }}>{f.file_name}</p>
                                  <p className="text-[10px]" style={{ color:txt3 }}>Artwork</p>
                                </div>
                              </div>
                              <button onClick={()=>downloadFile(f.signed_url||f.file_url, f.file_name)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium flex-shrink-0"
                                style={{ background:"var(--surface)", border:"1px solid var(--border2)", color:txt2, cursor:"pointer" }}>
                                <Download size={12}/> Download
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Output files */}
                    {(()=>{
                      const outputs=(o.order_files??[]).filter((f:any)=>f.file_type==="output");
                      return outputs.length>0 && (
                        <div className="mb-4 pt-3" style={{ borderTop:"1px solid var(--border)" }}>
                          <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color:txt3 }}>Your Output Files</p>
                          {outputs.map((f:any)=>(
                            <div key={f.id} className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl mb-1.5"
                              style={{ background:"var(--elevated)", border:"1px solid var(--border)" }}>
                              <div className="flex items-center gap-3 min-w-0">
                                {f.format && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ background:"var(--elevated2)", color:txt3 }}>{f.format}</span>}
                                <div className="min-w-0">
                                  <p className="text-[12px] truncate font-medium" style={{ color:txt }}>{f.file_name}</p>
                                  <p className="text-[10px]" style={{ color:txt3 }}>Output file</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button onClick={()=>downloadFile(f.signed_url||f.file_url, f.file_name)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                                  style={{ background:"var(--surface)", border:"1px solid var(--border2)", color:txt2, cursor:"pointer" }}>
                                  <Download size={12}/> Download
                                </button>
                                <button onClick={()=>deleteFile(f.id,o.id)} disabled={deleting===f.id}
                                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
                                  style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.20)", color:"#B91C1C", cursor:deleting===f.id?"not-allowed":"pointer" }}><Trash2 size={12}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Status actions */}
                    <div className="flex flex-col gap-2">
                      {o.status==="assigned" && (
                        <button onClick={()=>updateStatus(o.id,"in_progress")} disabled={isUpd}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold text-white border-none cursor-pointer active:scale-[0.98] transition-all"
                          style={{ background:"linear-gradient(135deg, #06B6D4, #10B981)", width:"fit-content" }}>▶ Start Working</button>
                      )}
                      {o.status==="in_progress" && (
                        <button onClick={() => { setUploadModal({ orderId: o.id, orderNumber: o.order_number }); setUploadFiles([]); }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold text-white border-none cursor-pointer active:scale-[0.98] transition-all"
                          style={{ background:"linear-gradient(135deg, #7C3AED, #D946EF)" }}>⬆ Upload Completed File</button>
                      )}
                      {o.status==="review" && (
                        <div className="p-3.5 rounded-xl flex items-start gap-3" style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.20)" }}>
                          <span className="text-lg flex-shrink-0">🔍</span>
                          <div><div className="font-semibold text-[13px] mb-1" style={{ color:"#92400E" }}>QA Review — Pending</div><div className="text-[11px]" style={{ color:"#92400E", opacity:.8 }}>Admin is reviewing your work.</div></div>
                        </div>
                      )}
                      {o.status==="approved" && (
                        <div className="p-3.5 rounded-xl flex items-start gap-3" style={{ background:"rgba(6,182,212,0.08)", border:"1px solid rgba(6,182,212,0.20)" }}>
                          <span className="text-lg flex-shrink-0">✅</span>
                          <div><div className="font-semibold text-[13px] mb-1" style={{ color:"#0E7490" }}>Design Approved</div><div className="text-[11px]" style={{ color:"#0E7490", opacity:.8 }}>Pending client release by admin.</div></div>
                        </div>
                      )}
                      {o.status==="revision" && (
                        <div className="p-3.5 rounded-xl flex flex-col gap-3" style={{ background:"rgba(220,38,38,0.06)", border:"1px solid rgba(220,38,38,0.18)" }}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">↩️</span>
                            <div>
                              <div className="font-semibold text-[13px] mb-1" style={{ color:"#B91C1C" }}>Revision Requested</div>
                              {o.admin_notes && <div className="text-[11px] p-2.5 rounded-lg mt-2" style={{ background:"rgba(220,38,38,0.06)", color:"#B91C1C", lineHeight:1.5 }}>📝 {o.admin_notes}</div>}
                            </div>
                          </div>
                          <button onClick={() => { setUploadModal({ orderId: o.id, orderNumber: o.order_number }); setUploadFiles([]); }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white border-none cursor-pointer active:scale-[0.98] transition-all"
                            style={{ background:"linear-gradient(135deg, #E76F2E, #EF4444)" }}>⬆ Re-upload Fixed File</button>
                        </div>
                      )}
                      {o.status==="delivered" && (
                        <div className="p-3.5 rounded-xl flex items-start gap-3" style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.20)" }}>
                          <span className="text-lg flex-shrink-0">🚀</span>
                          <div><div className="font-semibold text-[13px] mb-1" style={{ color:"#047857" }}>Released to Client</div><div className="text-[11px]" style={{ color:"#047857", opacity:.8 }}>Your work has been delivered.</div></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Completed Orders ── */}
      {completedOrders && completedOrders.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-lg">✅</span>
            <span className="font-syne font-bold text-[14px]" style={{ color:txt }}>Completed Orders</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background:"rgba(16,185,129,0.10)", color:"#047857", border:"1px solid rgba(16,185,129,0.25)" }}>
              {completedOrders.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {(showCompleted ? completedOrders : completedOrders.slice(0, 5)).map((o:any)=>(
                <div key={o.id} className="rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.99] hover:shadow-sm"
                  style={{ background:"var(--surface)", border:"1px solid var(--border)", borderLeft:"3px solid #10B981" }}
                  onClick={() => setCompletedModal(o)}>
                  <div className="px-4 sm:px-5 py-3.5 sm:py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono text-[13px] font-bold tracking-tight"
                            style={{ background:"linear-gradient(90deg, #7C3AED, #06B6D4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                            {o.order_number}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background:"rgba(16,185,129,0.10)", color:"#047857", border:"1px solid rgba(16,185,129,0.25)" }}>Completed</span>
                        </div>
                        <h3 className="font-semibold text-[14px] mb-1" style={{ color:txt }}>{o.clients?.company_name??"—"}</h3>
                        <div className="flex items-center gap-3 text-[12px] flex-wrap" style={{ color:txt2 }}>
                          <span>{o.service_tiers?.label??""}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background:"var(--elevated)", color:txt3 }}>{o.output_format}</span>
                          {o.reviews?.length>0 && (
                            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color:"#D97706" }}>
                              <Star size={10} fill="#D97706"/> {o.reviews[0]?.stars||"—"}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] flex-shrink-0" style={{ color:txt3 }}>
                        {o.delivered_at ? formatDate(o.delivered_at,{month:"short",day:"numeric"}) : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {completedOrders.length > 5 && (
            <button onClick={() => setShowCompleted(!showCompleted)}
              className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.99]"
              style={{ background:"var(--elevated)", color:"var(--txt2)", border:"1px solid var(--border2)", cursor:"pointer" }}>
              {showCompleted ? "Show less" : `See all ${completedOrders.length} completed orders`}
            </button>
          )}
        </div>
      )}

      {/* ── Completed order detail modal ── */}
      {completedModal && (
        <div className="fixed inset-0 z-50 overflow-hidden"
          style={{ background:"rgba(0,0,0,0.5)" }}
          onClick={() => setCompletedModal(null)}>
          <div className="h-full flex items-center justify-center p-4">
            <div className="w-full sm:max-w-xl rounded-2xl shadow-2xl border border-[var(--border)]"
              style={{ background:"var(--bg)", maxHeight:"90vh", overflowY:"auto", overscrollBehavior:"contain" }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 z-10 px-5 pt-4 pb-3"
                style={{ background:"var(--bg)", borderBottom:"1px solid var(--border)" }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-lg sm:text-xl font-bold tracking-tight truncate"
                      style={{ background:"linear-gradient(90deg, #7C3AED, #06B6D4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                      {completedModal.order_number}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ background:"rgba(16,185,129,0.10)", color:"#047857", border:"1px solid rgba(16,185,129,0.25)" }}>
                        {completedModal.status?.replace(/_/g, " ")}
                      </span>
                      {(() => {
                        const tt = TURNAROUND_OPTIONS[completedModal.turnaround] ?? TURNAROUND_OPTIONS.standard;
                        return (
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                            style={{ background:`${tt.color}18`, color:tt.color, border:`1px solid ${tt.color}40` }}>
                            {tt.icon} {tt.label}
                          </span>
                        );
                      })()}
                      {completedModal.delivered_at && (
                        <span className="text-[10px]" style={{ color:txt3 }}>
                          {formatDate(completedModal.delivered_at, { month:"short", day:"numeric", year:"numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setCompletedModal(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ml-2"
                    style={{ background:"var(--elevated)", color:txt3, border:"none", cursor:"pointer" }}>×</button>
                </div>
              </div>

            <div className="px-5 py-4 flex flex-col gap-4">

              {/* Order details */}
              <div className="rounded-xl p-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color:txt3 }}>Order Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    ["Service", completedModal.service_tiers?.label],
                    ["Size", completedModal.service_tiers?.size_desc],
                    ["Output", completedModal.output_format],
                    ["Colors", completedModal.color_count ?? "—"],
                    ["Stitch Count", completedModal.stitch_count ?? "—"],
                    ["Design Name", completedModal.design_name ?? "—"],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[10px]" style={{ color:txt3 }}>{l}</p>
                      <p className="text-[13px] font-medium" style={{ color:txt }}>{v ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files */}
              {(() => {
                const allFiles = completedModal.order_files ?? [];
                if (allFiles.length === 0) return null;
                const artwork = allFiles.filter((f: any) => f.file_type === "artwork");
                const outputs = allFiles.filter((f: any) => f.file_type === "output");
                return (
                  <div className="rounded-xl p-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color:txt3 }}>Files ({allFiles.length})</p>
                    {artwork.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold mb-1.5" style={{ color:txt3 }}>Artwork</p>
                        {artwork.map((f: any) => (
                          <div key={f.id} className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl mb-2"
                            style={{ background:"var(--elevated)", border:"1px solid var(--border)" }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" style={{ background:"var(--elevated2)" }}
                                onClick={() => setPreviewImage(f.signed_url||f.file_url)}>
                                <Image fill src={f.signed_url||f.file_url} alt={f.file_name} className="object-cover"
                                  onError={(e:any)=>{ e.target.style.display="none"; }} sizes="(max-width: 768px) 100vw, 800px" />
                              </div>
                              <p className="text-[12px] truncate font-medium" style={{ color:txt }}>{f.file_name}</p>
                            </div>
                            <button onClick={()=>downloadFile(f.signed_url||f.file_url, f.file_name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium flex-shrink-0"
                              style={{ background:"var(--surface)", border:"1px solid var(--border2)", color:txt2, cursor:"pointer" }}>
                              <Download size={12}/> Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {outputs.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold mb-1.5" style={{ color:txt3 }}>Output Files</p>
                        {outputs.map((f: any) => (
                          <div key={f.id} className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl mb-2"
                            style={{ background:"var(--elevated)", border:"1px solid var(--border)" }}>
                            <div className="flex items-center gap-3 min-w-0">
                              {f.format && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono flex-shrink-0" style={{ background:"var(--elevated2)", color:txt3 }}>{f.format}</span>}
                              <p className="text-[12px] truncate font-medium" style={{ color:txt }}>{f.file_name}</p>
                            </div>
                            <button onClick={()=>downloadFile(f.signed_url||f.file_url, f.file_name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium flex-shrink-0"
                              style={{ background:"var(--surface)", border:"1px solid var(--border2)", color:txt2, cursor:"pointer" }}>
                              <Download size={12}/> Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Client review */}
              {completedModal.reviews?.length > 0 && (
                <div className="rounded-xl p-4" style={{ background:"var(--surface)", border:"1px solid var(--border)" }}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color:txt3 }}>Client Review</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={18} fill={i <= (completedModal.reviews[0]?.stars || 0) ? "#D97706" : "none"}
                        style={{ color: i <= (completedModal.reviews[0]?.stars || 0) ? "#D97706" : "var(--border2)" }} />
                    ))}
                    <span className="ml-2 font-syne font-bold text-lg" style={{ color:"#D97706" }}>
                      {completedModal.reviews[0]?.stars}/5
                    </span>
                  </div>
                  {completedModal.reviews[0]?.text && (
                    <p className="text-[13px] mt-2 leading-relaxed" style={{ color:txt2 }}>
                      "{completedModal.reviews[0]?.text}"
                    </p>
                  )}
                  {completedModal.reviews[0]?.created_at && (
                    <p className="text-[10px] mt-2" style={{ color:txt3 }}>
                      Reviewed {formatDate(completedModal.reviews[0].created_at, { month:"long", day:"numeric", year:"numeric" })}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Image preview overlay ── */}
      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.85)" }}
          onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl z-10"
            style={{ background:"rgba(255,255,255,0.1)", border:"none", cursor:"pointer" }}>×</button>
          <Image src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}/>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {uploadModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
          style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }}
          onClick={() => { if (!uploading) { setUploadModal(null); setUploadFiles([]); } }}>
          <div className="w-full max-w-[520px] max-h-[85vh] overflow-y-auto rounded-2xl p-5 sm:p-6"
            style={{ background:"var(--bg)", border:"1px solid var(--border2)" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-syne font-bold text-lg" style={{ color:txt }}>Upload Files</h3>
                <p className="text-[11px] mt-0.5" style={{ color:txt3 }}>Order {uploadModal.orderNumber}</p>
              </div>
              <button onClick={() => { setUploadModal(null); setUploadFiles([]); }} disabled={uploading}
                className="p-2 rounded-lg cursor-pointer border-none" style={{ background:"var(--elevated)", color:txt3 }}>
                <X size={16} />
              </button>
            </div>

            {/* Drop zone */}
            <input type="file" multiple accept={ALLOWED_ACCEPT} id="task-upload-input" className="hidden"
              onChange={e => { if (e.target.files?.length) addUploadFiles(e.target.files); }} />
            <div
              onClick={() => document.getElementById("task-upload-input")?.click()}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) addUploadFiles(e.dataTransfer.files); }}
              className="rounded-xl p-5 text-center cursor-pointer transition-all mb-4"
              style={{ border:`2px dashed ${uploadFiles.length>0?"#10B981":"var(--border2)"}`, background:uploadFiles.length>0?"rgba(16,185,129,0.03)":"var(--elevated)" }}>
              <Upload size={22} style={{ color:uploadFiles.length>0?"#10B981":"var(--txt3)", margin:"0 auto 6px" }} />
              <p className="text-[13px] font-semibold mb-0.5" style={{ color:uploadFiles.length>0?"#10B981":txt2 }}>
                {uploadFiles.length>0 ? `${uploadFiles.length} file(s) selected` : "Click or drag & drop"}
              </p>
              <p className="text-[11px]" style={{ color:txt3 }}>All image & digitizing formats</p>
            </div>

            {/* File list */}
            {uploadFiles.length>0 && (
              <div className="space-y-1.5 mb-4 max-h-[200px] overflow-y-auto">
                {uploadFiles.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2.5 rounded-lg p-2.5"
                    style={{ background:"var(--elevated)", border:"1px solid var(--border)" }}>
                    <FileText size={13} style={{ color:txt3, flexShrink:0 }} />
                    <span className="text-[12px] font-medium flex-1 min-w-0 truncate" style={{ color:txt }}>{f.file.name}</span>
                    <span className="text-[10px] flex-shrink-0" style={{ color:txt3 }}>{(f.file.size/1024).toFixed(0)}KB</span>
                    <select value={f.format} onChange={e => {
                      setUploadFiles(prev => prev.map(x => x.id===f.id ? {...x, format:e.target.value} : x));
                    }} className="text-[11px] font-semibold rounded-lg px-2 py-1 flex-shrink-0"
                      style={{ background:"var(--surface)", border:"1px solid var(--border2)", color:txt, cursor:"pointer", fontSize:11 }}>
                      {OUTPUT_FORMATS.map(fmt => <option key={fmt}>{fmt}</option>)}
                    </select>
                    <button onClick={() => setUploadFiles(prev => prev.filter(x => x.id!==f.id))}
                      className="p-1 rounded flex-shrink-0 border-none cursor-pointer" style={{ background:"transparent", color:txt3 }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button onClick={submitUpload}
              disabled={uploading || uploadFiles.length===0}
              className="w-full py-3 rounded-xl text-[13px] font-semibold border-none cursor-pointer active:scale-[0.98] transition-all text-white"
              style={{ background:uploading||uploadFiles.length===0?"var(--border2)":"linear-gradient(135deg, #7C3AED, #D946EF)" }}>
              {uploading ? "Uploading…" : `Submit ${uploadFiles.length>0 ? uploadFiles.length : ""} File(s) for QA`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
