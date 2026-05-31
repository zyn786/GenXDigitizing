// @ts-nocheck
"use client";
import { useState, useRef, useTransition } from "react";
import { useRouter }    from "next/navigation";
import { toast }        from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, CheckCircle, X, ClipboardList } from "lucide-react";

const OUTPUT_FORMATS = ["DST","PES","EMB","JEF","XXX","VIP","HUS","EXP","VP3","SEW","AI","SVG","EPS","PDF"];

const ALLOWED_ACCEPT = ".dst,.pes,.emb,.jef,.xxx,.vip,.hus,.exp,.vp3,.cnd,.tap,.png,.jpg,.jpeg,.webp,.pdf,.svg,.ai,.eps,.zip";

const txt  = "var(--txt)";
const txt2 = "var(--txt2)";
const txt3 = "var(--txt3)";

const TURNAROUND_STYLE: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  urgent:   { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   text: "#B91C1C", icon: "🔥" },
  rush:     { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  text: "#92400E", icon: "⚡" },
  standard: { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  text: "#047857", icon: "🕐" },
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  assigned:    { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  text: "#1D4ED8", icon: "📋" },
  in_progress: { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  text: "#92400E", icon: "⚙️" },
  revision:    { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   text: "#B91C1C", icon: "↩️" },
};

const inpBase: React.CSSProperties = {
  width: "100%", background: "var(--elevated)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "10px 14px", color: "var(--txt)", fontSize: 13,
  outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

type FileEntry = {
  id: string;
  file: File;
  format: string;
};

export function DesignerUploadUI({ tasks, userId, designerId, designerName, designerAvatar }: {
  tasks: any[];
  userId: string;
  designerId: string;
  designerName: string;
  designerAvatar?: string;
}) {
  const router     = useRouter();
  const supabase   = createClient();
  const [,startTx] = useTransition();

  const [selOrder,  setSelOrder]  = useState(tasks[0]?.id ?? "");
  const [notes,     setNotes]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [done,      setDone]      = useState(false);

  const fileRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const [entries, setEntries] = useState<FileEntry[]>([]);

  const selTask = tasks.find((t: any) => t.id === selOrder);

  function addFiles(files: FileList | File[]) {
    const newEntries: FileEntry[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      format: getFormatFromName(f.name),
    }));
    setEntries(prev => [...prev, ...newEntries]);
  }

  function getFormatFromName(name: string): string {
    const ext = name.split(".").pop()?.toUpperCase();
    return ext && OUTPUT_FORMATS.includes(ext) ? ext : "DST";
  }

  function removeEntry(id: string) {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  async function submit() {
    if (entries.length === 0) {
      toast.error("Add at least one file");
      return;
    }
    if (!selOrder) { toast.error("Select an order"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("orderId", selOrder);
      fd.append("notes", notes);
      for (let i = 0; i < entries.length; i++) {
        fd.append("files", entries[i].file);
        fd.append("formats", entries[i].format);
      }
      const res = await fetch("/api/upload/output", { method: "POST", body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.error(e.error || "Upload failed");
        return;
      }

      toast.success(`${entries.length} file(s) uploaded — submitted for QA review`);
      startTx(() => { router.push("/designer/tasks"); router.refresh(); });

      const supabase = createClient();
      const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a: any) => ({
            user_id: a.id, type: "order_update",
            title: `Files submitted — ${selTask?.order_number}`,
            body: `${validEntries.length} file(s) · ready for QA`,
            action_url: "/admin/orders",
          }))
        );
      }

      const { data: orderInfo } = await supabase.from("orders")
        .select("clients ( user_id )")
        .eq("id", selOrder).single();
      const clientUserId = (orderInfo as any)?.clients?.user_id;
      if (clientUserId) {
        await supabase.from("notifications").insert({
          user_id: clientUserId,
          type: "order_update",
          title: `Revision ready — ${selTask?.order_number}`,
          body: "Your revision is ready and under review. You'll be notified once it's approved.",
          action_url: `/client/my-orders/${selOrder}`,
        });
      }

      setDone(true);
    } finally { setUploading(false); }
  }

  const counts = {
    total: tasks.length,
    assigned: tasks.filter((t: any) => t.status === "assigned").length,
    inProgress: tasks.filter((t: any) => t.status === "in_progress").length,
    revision: tasks.filter((t: any) => t.status === "revision").length,
  };

  // ── Done state ──
  if (done) return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center rounded-2xl p-8 sm:p-10" style={{ background: "var(--surface)", border: "1px solid rgba(16,185,129,0.25)", maxWidth: 440 }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(16,185,129,0.10)" }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <h2 className="font-syne font-bold text-xl sm:text-2xl mb-2"
            style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Submitted!
          </h2>
          <p className="text-[13px] leading-relaxed mb-5" style={{ color: txt2 }}>
            <strong className="font-mono" style={{ background: "linear-gradient(90deg, #10B981, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {selTask?.order_number}
            </strong>{" "}
            files now in QA review. Admin will approve and deliver to the client.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button onClick={() => router.push("/designer/tasks")}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}>
              Back to Tasks
            </button>
            <button onClick={() => { setDone(false); setEntries([]); setNotes(""); }}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer active:scale-[0.98] transition-all"
              style={{ background: "var(--elevated)", color: txt2, border: "1px solid var(--border2)" }}>
              Upload Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Empty state ──
  if (tasks.length === 0) return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center rounded-2xl p-8 sm:p-10" style={{ background: "var(--surface)", border: "1px solid var(--border)", maxWidth: 400 }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-syne font-bold text-lg" style={{ color: txt }}>No tasks to upload</p>
          <p className="text-sm mt-1.5 mb-5" style={{ color: txt2 }}>Start working on an assigned task first</p>
          <button onClick={() => router.push("/designer/tasks")}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}>
            Go to My Tasks
          </button>
        </div>
      </div>
    </div>
  );

  // ── Upload form ──
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* ── Profile strip ── */}
      <div className="px-4 py-3 rounded-2xl mb-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}>
            {designerAvatar
              ? <img src={designerAvatar} alt={designerName} className="w-full h-full rounded-full object-cover" />
              : designerName?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-syne font-bold text-[14px]" style={{ color: txt }}>{designerName}</span>
            <span className="text-[11px] ml-2 px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(124,58,237,0.10)", color: "#6D28D9", border: "1px solid rgba(124,58,237,0.25)" }}>Uploading</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: txt3 }}>
            <ClipboardList size={13} /> {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Title ── */}
      <h2 className="font-syne font-bold text-xl sm:text-2xl leading-tight mb-1"
        style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        Upload Files
      </h2>
      <p className="text-[12px] mb-5 font-medium" style={{ color: txt3 }}>
        Submit completed digitizing files for QA review · {counts.inProgress} in progress · {counts.revision} need revision
      </p>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {[
          { label: "Available", val: counts.total, sub: "orders", ci: 0 },
          { label: "In Progress", val: counts.inProgress, sub: "working", ci: 1 },
          { label: "Revisions", val: counts.revision, sub: "to fix", ci: 2 },
        ].map((s, i) => {
          const colors = [
            { bgSoft: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.20)", icon: "#4338CA", text: "#4338CA" },
            { bgSoft: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.20)", icon: "#D97706", text: "#92400E" },
            { bgSoft: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.20)",   icon: "#DC2626", text: "#B91C1C" },
          ][i];
          return (
            <div key={s.label} className="rounded-2xl p-3 sm:p-3.5 transition-all hover:translate-y-[-2px]"
              style={{ background: colors.bgSoft, border: `1px solid ${colors.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold block mb-1.5" style={{ color: txt3 }}>{s.label}</span>
              <div className="font-syne font-bold text-lg sm:text-xl" style={{ color: colors.text }}>{s.val}</div>
              <div className="text-[10px] mt-0.5" style={{ color: txt3 }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Form card ── */}
      <div className="rounded-2xl p-4 sm:p-6 mb-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h3 className="font-syne font-bold text-[15px] sm:text-[16px] mb-5 flex items-center gap-2"
          style={{ color: txt }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.10)", color: "#7C3AED" }}>
            <Upload size={13} />
          </span>
          Submit completed files
        </h3>

        {/* ── Order selector ── */}
        <div className="mb-4">
          <label className="block text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: txt3 }}>
            Select order
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {tasks.map((t: any) => {
              const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.assigned;
              const tc = TURNAROUND_STYLE[t.turnaround] ?? TURNAROUND_STYLE.standard;
              const isActive = selOrder === t.id;
              return (
                <button key={t.id} onClick={() => setSelOrder(t.id)}
                  className="text-left rounded-xl p-3 border transition-all active:scale-[0.98] cursor-pointer"
                  style={{
                    background: isActive ? "var(--elevated)" : "var(--surface)",
                    borderColor: isActive ? "#7C3AED" : "var(--border2)",
                    borderWidth: isActive ? "2px" : "1px",
                    boxShadow: isActive ? "0 0 0 3px rgba(124,58,237,0.10)" : "none",
                  }}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-mono text-[12px] font-bold tracking-tight"
                      style={{ background: isActive ? "linear-gradient(90deg, #7C3AED, #D946EF)" : "linear-gradient(90deg, var(--txt2), var(--txt3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {t.order_number}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                      {sc.icon} {t.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: txt }}>{t.clients?.company_name ?? "—"}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] flex-wrap" style={{ color: txt3 }}>
                    <span>{t.service_tiers?.label}</span>
                    <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--elevated)", color: txt3 }}>{t.output_format}</span>
                    <span className="px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
                      {tc.icon} {t.turnaround}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected order detail ── */}
        {selTask && (
          <div className="rounded-xl p-4 mb-4" style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(217,70,239,0.04))",
            border: "1px solid rgba(124,58,237,0.18)",
          }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Client</span>
                <span className="font-medium" style={{ color: txt }}>{selTask.clients?.company_name}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Service</span>
                <span className="font-medium" style={{ color: txt }}>{selTask.service_tiers?.label}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Format</span>
                <span className="font-mono font-semibold" style={{ color: "#06B6D4" }}>{selTask.output_format}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Size</span>
                <span className="font-medium" style={{ color: txt }}>{selTask.service_tiers?.size_desc ?? "—"}</span>
              </div>
            </div>
            {selTask.placement_notes && (
              <div className="mt-3 pt-3 text-[11px] leading-relaxed" style={{ borderTop: "1px solid var(--border)", color: txt2 }}>
                📝 {selTask.placement_notes}
              </div>
            )}
          </div>
        )}

        {/* ── Main drop zone ── */}
        <input
          type="file"
          multiple
          accept={ALLOWED_ACCEPT}
          style={{ display: "none" }}
          ref={el => { if (el) fileRefs.current.set("batch", el); }}
          onChange={e => { if (e.target.files?.length) addFiles(e.target.files); }}
        />
        <div
          onClick={() => fileRefs.current.get("batch")?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDragEnter={e => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            e.preventDefault(); e.stopPropagation();
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          className="rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all mb-4"
          style={{
            border: `2px dashed ${entries.length > 0 ? "#10B981" : "var(--border2)"}`,
            background: entries.length > 0 ? "rgba(16,185,129,0.03)" : "var(--surface)",
          }}>
          <Upload size={24} style={{ color: entries.length > 0 ? "#10B981" : "var(--txt3)", margin: "0 auto 8px" }} />
          <p className="text-[13px] font-semibold mb-1" style={{ color: entries.length > 0 ? "#10B981" : txt2 }}>
            {entries.length > 0 ? `${entries.length} file(s) added` : "Click or drag & drop files here"}
          </p>
          <p className="text-[11px]" style={{ color: txt3 }}>
            All image & digitizing formats · drop multiple files at once
          </p>
        </div>

        {/* ── File list ── */}
        {entries.length > 0 && (
          <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}>{idx + 1}</span>
                <FileText size={14} style={{ color: txt3, flexShrink: 0 }} />
                <span className="text-[12px] font-medium flex-1 min-w-0 truncate" style={{ color: txt }}>{entry.file.name}</span>
                <span className="text-[10px] flex-shrink-0" style={{ color: txt3 }}>{(entry.file.size / 1024).toFixed(0)} KB</span>
                <select
                  value={entry.format}
                  onChange={e => updateEntry(entry.id, { format: e.target.value })}
                  className="text-[11px] font-semibold rounded-lg px-2 py-1 flex-shrink-0"
                  style={{ ...inpBase, width: "auto", cursor: "pointer", padding: "4px 8px", background: "var(--surface)" }}>
                  {OUTPUT_FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
                <button onClick={() => removeEntry(entry.id)}
                  className="p-1 rounded-lg flex-shrink-0 cursor-pointer border-none"
                  style={{ background: "transparent", color: txt3 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Clear all */}
        {entries.length > 0 && (
          <button onClick={() => setEntries([])}
            className="w-full py-2 mb-4 rounded-xl text-[11px] font-medium cursor-pointer transition-all inline-flex items-center justify-center gap-1"
            style={{ background: "rgba(239,68,68,0.06)", color: "#B91C1C", border: "1px solid rgba(239,68,68,0.15)" }}>
            <X size={12} /> Remove all files
          </button>
        )}

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: txt3 }}>
            QA notes <span className="font-normal normal-case text-[10px]" style={{ color: txt3 }}>(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Thread colours, density adjustments, test run notes…"
            style={{ ...inpBase, resize: "none", background: "var(--elevated)" }}
          />
        </div>

        {/* Submit button */}
        <button onClick={submit}
          disabled={uploading || entries.length === 0}
          className="w-full py-3 rounded-xl text-[13px] font-semibold border-none cursor-pointer active:scale-[0.98] transition-all"
          style={{
            background: uploading || entries.length === 0
              ? "var(--elevated)"
              : "linear-gradient(135deg, #7C3AED, #D946EF)",
            color: entries.length === 0 ? txt3 : "#fff",
            cursor: entries.length === 0 ? "not-allowed" : "pointer",
          }}>
          {uploading ? "Uploading…" : "Submit for QA Review ⬆"}
        </button>
      </div>
    </div>
  );
}
