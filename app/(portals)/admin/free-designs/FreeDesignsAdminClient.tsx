"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, Star, Eye, EyeOff,
  X, Save, Loader2, Upload, Download, ImagePlus, Database
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { FreeDesign, FreeDesignImage } from "@/types";

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

const FILTER_TABS = [
  { key: "all", label: "All", ci: 0 },
  { key: "featured", label: "Featured", ci: 2 },
  { key: "hidden", label: "Hidden", ci: 5 },
];

const DEFAULT_FORM = {
  title: "", slug: "", description: "", stitchCount: 0, colors: 1, designSize: "",
  formats: [] as string[], machines: [] as string[], downloadUrl: "",
  featured: false, visible: true, sortOrder: 0, images: [] as FreeDesignImage[],
};

const FORMAT_OPTIONS = ["DST", "PES", "EMB", "JEF", "XXX", "VIP", "HUS", "EXP", "VP3", "SEW"];
const MACHINE_OPTIONS = ["Brother", "Tajima", "Janome", "Barudan", "Happy", "Melco", "Ricoma", "SWF", "ZSK", "Toyota", "Singer"];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatNumber(n: number) { return n.toLocaleString(); }

// ── Image Uploader ──────────────────────────────────────────
function ImageUploader({ images, onAdd, onRemove, uploading }: {
  images: FreeDesignImage[]; onAdd: (img: FreeDesignImage) => void; onRemove: (index: number) => void; uploading: boolean;
}) {
  const handleUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const res = await fetch("/api/admin/upload-free-design-image", { method: "POST", body: formData });
    if (!res.ok) { toast.error("Image upload failed"); return; }
    const results = await res.json();
    results.forEach((r: any, i: number) => {
      onAdd({ url: r.url, thumbnailUrl: r.thumbnailUrl, blurhash: r.blurhash, alt: "", width: r.width, height: r.height, sortOrder: images.length + i });
    });
    toast.success(`${results.length} image(s) uploaded`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload, accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif"] }, maxSize: 10 * 1024 * 1024, disabled: uploading,
  });

  return (
    <div>
      <label className="block text-xs font-semibold mb-2" style={{ color: txt2 }}>
        Preview Images ({images.length} / 4)
      </label>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group/img" style={{ background: "var(--elevated)" }}>
            <img src={img.thumbnailUrl || img.url} alt={img.alt || `Preview ${i + 1}`} className="w-full h-full object-cover" />
            <button onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < 4 && (
          <div {...getRootProps()}
            className={cn("aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all",
              isDragActive ? "border-[#3B82F6] bg-[#3B82F6]/5" : "hover:border-[#3B82F6]/50 hover:bg-[var(--elevated)]")}
            style={{ borderColor: isDragActive ? clr[0].bg : "var(--border2)" }}>
            <input {...getInputProps()} />
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: txt2 }} /> : (
              <>
                <ImagePlus className="w-5 h-5" style={{ color: txt3 }} />
                <span className="text-[9px]" style={{ color: txt3 }}>Upload</span>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px]" style={{ color: txt3 }}>Upload up to 4 preview images. First image is the cover.</p>
    </div>
  );
}

// ── File Uploader (S3) ──────────────────────────────────────
function FileUploader({ url, onUpload, uploading }: {
  url: string; onUpload: (url: string, fileName: string) => void; uploading: boolean;
}) {
  const handleUpload = async (files: File[]) => {
    const file = files[0]; if (!file) return;
    const formData = new FormData(); formData.append("file", file);
    const res = await fetch("/api/admin/upload-free-design-file", { method: "POST", body: formData });
    if (!res.ok) { toast.error("File upload failed"); return; }
    const result = await res.json();
    onUpload(result.url, result.fileName);
    toast.success("Design file uploaded");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: handleUpload, maxFiles: 1, disabled: uploading });

  return (
    <div>
      <label className="block text-xs font-semibold mb-2" style={{ color: txt2 }}>Downloadable Design File</label>
      {url ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
          <Download className="w-4 h-4 flex-shrink-0" style={{ color: clr[1].icon }} />
          <span className="text-xs truncate flex-1" style={{ color: txt2 }}>{url}</span>
          <button onClick={() => onUpload("", "")} className="text-[10px] hover:underline font-medium flex-shrink-0" style={{ color: clr[5].text }}>Remove</button>
        </div>
      ) : (
        <div {...getRootProps()}
          className={cn("p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all",
            isDragActive ? "border-[#3B82F6] bg-[#3B82F6]/5" : "hover:border-[#3B82F6]/50")}
          style={{ borderColor: isDragActive ? clr[0].bg : "var(--border2)" }}>
          <input {...getInputProps()} />
          {uploading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: txt2 }} /> : (
            <>
              <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: txt3 }} />
              <span className="text-xs" style={{ color: txt2 }}>Drop ZIP, DST, PES or design file here</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tag Input ───────────────────────────────────────────────
function TagInput({ label, tags, options, onAdd, onRemove }: {
  label: string; tags: string[]; options: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const available = options.filter((o) => !tags.includes(o));

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold mb-1.5" style={{ color: txt2 }}>{label}</label>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
            style={{ background: clr[0].bgSoft, color: clr[0].text, borderColor: clr[0].border }}>
            {t}
            <button onClick={() => onRemove(t)}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = clr[5].text}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = clr[0].text}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <button type="button" onClick={() => setOpen(!open)} className="text-[11px] font-medium hover:underline" style={{ color: clr[0].text }}>
        + Add {label.toLowerCase()}
      </button>
      {open && available.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 w-48 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {available.map((opt) => (
            <button key={opt} onClick={() => { onAdd(opt); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--elevated)] transition-colors" style={{ color: txt }}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Component ────────────────────────────────────
export function FreeDesignsAdminClient() {
  const [designs, setDesigns] = useState<FreeDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchDesigns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/free-designs");
      if (res.ok) { const data = await res.json(); setDesigns(data.designs || []); setSetupNeeded(false); }
      else {
        const err = await res.json().catch(() => ({}));
        if (err.error?.includes("does not exist")) setSetupNeeded(true);
        else toast.error(err.error || "Failed to fetch designs");
      }
    } catch (e: any) { toast.error(e.message || "Failed to fetch designs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDesigns(); }, [fetchDesigns]);

  const openCreate = () => { setEditingId(null); setForm(DEFAULT_FORM); setShowModal(true); };
  const openEdit = (design: FreeDesign) => {
    setEditingId(design.id);
    setForm({
      title: design.title, slug: design.slug, description: design.description,
      stitchCount: design.stitchCount, colors: design.colors, designSize: design.designSize,
      formats: design.formats || [], machines: design.machines || [], downloadUrl: design.downloadUrl || "",
      featured: design.featured, visible: design.visible, sortOrder: design.sortOrder,
      images: design.images || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) { toast.error("Title and slug are required"); return; }
    setSaving(true);
    try {
      let res: Response;
      if (editingId) {
        const existingIds = designs.find((d) => d.id === editingId)?.images.map((i) => i.id) || [];
        const currentIds = form.images.filter((i) => i.id).map((i) => i.id);
        const imageIdsToRemove = existingIds.filter((id) => !currentIds.includes(id));
        const imagesToAdd = form.images.filter((i) => !i.id);
        res = await fetch(`/api/admin/free-designs/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, imagesToAdd, imageIdsToRemove }) });
      } else {
        res = await fetch("/api/admin/free-designs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Request failed (${res.status})`); }
      toast.success(editingId ? "Design updated" : "Design created");
      setShowModal(false); fetchDesigns();
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this design permanently?")) return;
    const res = await fetch(`/api/admin/free-designs/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Design deleted"); fetchDesigns(); } else { toast.error("Delete failed"); }
  };

  const filtered = filter === "all" ? designs : filter === "featured" ? designs.filter(d => d.featured) : designs.filter(d => !d.visible);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: clr[0].icon }} />
        <p className="text-sm" style={{ color: txt3 }}>Loading designs...</p>
      </div>
    );
  }

  if (setupNeeded) {
    return (
      <div className="portal-content" style={{ background: "var(--bg)" }}>
        <div className="text-center py-16 rounded-2xl border max-w-lg mx-auto" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: clr[2].bgSoft }}>
            <Database className="w-7 h-7" style={{ color: clr[2].icon }} />
          </div>
          <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: txt }}>Database Setup Required</h3>
          <p className="text-sm mb-6 max-w-[380px] mx-auto leading-relaxed" style={{ color: txt2 }}>
            The free designs tables haven&apos;t been created yet. Run the migration SQL in your Supabase SQL Editor.
          </p>
          <div className="rounded-xl p-4 text-left mb-6 mx-4 border" style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: txt3 }}>Migration file</p>
            <code className="text-xs font-mono break-all" style={{ color: txt }}>supabase/migrations/009_free_designs.sql</code>
          </div>
          <Button variant="grad" size="sm" onClick={() => { setSetupNeeded(false); fetchDesigns(); }}>I&apos;ve Run the Migration — Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-jakarta font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Free Designs
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>
          {designs.length} design{designs.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        {/* Colored filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {FILTER_TABS.map(tab => {
            const tc = clr[tab.ci];
            const isActive = filter === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all active:scale-95"
                style={{
                  background: isActive ? tc.bgSoft : "var(--elevated)",
                  color: isActive ? tc.text : txt2,
                  borderColor: isActive ? tc.border : "var(--border2)",
                }}>
                {tab.key === "featured" && <Star className="w-3 h-3" />}
                {tab.key === "hidden" && <EyeOff className="w-3 h-3" />}
                {tab.label}
                {tab.key === "all" && <span className="text-[10px] ml-0.5">({designs.length})</span>}
              </button>
            );
          })}
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-semibold border-none cursor-pointer transition-all active:scale-95 flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}>
          <Plus className="w-4 h-4" /> Add Design
        </button>
      </div>

      {/* Designs grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🧵</div>
          <h3 className="font-jakarta font-bold text-lg mb-1" style={{ color: txt }}>No designs found</h3>
          <p className="text-sm mb-4" style={{ color: txt2 }}>
            {filter !== "all" ? "No designs match the selected filter." : "Add your first free design to start sharing samples."}
          </p>
          <Button variant="grad" size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Design</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((design) => (
            <div key={design.id} className="rounded-2xl border overflow-hidden transition-all hover:translate-y-[-2px]"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {/* Thumbnail */}
              <div className="aspect-[4/3] flex items-center justify-center relative" style={{ background: "var(--elevated)" }}>
                {design.images?.[0] ? (
                  <img src={design.images[0].thumbnailUrl || design.images[0].url} alt={design.title} className="w-full h-full object-cover" />
                ) : <span className="text-3xl">🧵</span>}
                <div className="absolute top-2 left-2 flex gap-1">
                  {design.featured && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border"
                      style={{ background: clr[2].bgSoft, color: clr[2].text, borderColor: clr[2].border }}>
                      <Star className="w-2.5 h-2.5 inline mr-0.5" /> Featured
                    </span>
                  )}
                  {!design.visible && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border"
                      style={{ background: clr[5].bgSoft, color: clr[5].text, borderColor: clr[5].border }}>
                      <EyeOff className="w-2.5 h-2.5 inline mr-0.5" /> Hidden
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4">
                <h3 className="font-jakarta font-bold text-sm mb-1.5" style={{ color: txt }}>{design.title}</h3>
                <div className="flex flex-wrap gap-1 text-[10px] font-medium mb-2.5" style={{ color: txt2 }}>
                  <span>{formatNumber(design.stitchCount)} stitches</span><span>·</span>
                  <span>{design.colors} colors</span><span>·</span>
                  <span>{design.designSize}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {(design.formats || []).slice(0, 4).map((f) => (
                    <span key={f} className="font-mono text-[9px] px-1.5 py-0.5 rounded border font-medium"
                      style={{ background: clr[4].bgSoft, color: clr[4].text, borderColor: clr[4].border }}>{f}</span>
                  ))}
                  {(design.formats || []).length > 4 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: txt3 }}>+{design.formats.length - 4}</span>
                  )}
                </div>
                <div className="text-[10px] font-medium mb-3" style={{ color: txt2 }}>
                  <Download className="w-3 h-3 inline mr-1" />{formatNumber(design.downloadCount)} downloads
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(design)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(design.id)}
                    style={{ color: clr[5].text }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = clr[5].bgSoft}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[8vh] sm:pt-[10vh] p-2 sm:p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 rounded-t-2xl"
              style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-jakarta font-bold text-lg" style={{ color: txt }}>
                {editingId ? "Edit Design" : "Add Free Design"}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--elevated)] flex items-center justify-center transition-colors" style={{ color: txt3 }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: txt2 }}>Title *</label>
                  <Input value={form.title} onChange={(e) => { const title = e.target.value; setForm((f) => ({ ...f, title, slug: editingId ? f.slug : slugify(title) })); }} placeholder="Floral Pattern Design" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: txt2 }}>Slug *</label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="floral-pattern" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: txt2 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                  placeholder="Brief description of this design..."
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none resize-y"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: txt }} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {([
                  ["Stitch Count", "stitchCount", "number"],
                  ["Colors", "colors", "number"],
                  ["Size", "designSize", "text"],
                ] as const).map(([label, key, type]) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: txt2 }}>{label}</label>
                    <Input type={type} value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? (parseInt(e.target.value) || 0) : e.target.value }))}
                      placeholder={label === "Size" ? '4.2" x 3.8"' : undefined} />
                  </div>
                ))}
              </div>

              <TagInput label="File Formats" tags={form.formats} options={FORMAT_OPTIONS}
                onAdd={(tag) => setForm((f) => ({ ...f, formats: [...f.formats, tag] }))}
                onRemove={(tag) => setForm((f) => ({ ...f, formats: f.formats.filter((t) => t !== tag) }))} />

              <TagInput label="Compatible Machines" tags={form.machines} options={MACHINE_OPTIONS}
                onAdd={(tag) => setForm((f) => ({ ...f, machines: [...f.machines, tag] }))}
                onRemove={(tag) => setForm((f) => ({ ...f, machines: f.machines.filter((t) => t !== tag) }))} />

              <ImageUploader images={form.images}
                onAdd={(img) => setForm((f) => ({ ...f, images: [...f.images, img] }))}
                onRemove={(i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                uploading={uploadingImg} />

              <FileUploader url={form.downloadUrl}
                onUpload={(url) => { setForm((f) => ({ ...f, downloadUrl: url })); }}
                uploading={uploadingFile} />

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-4 h-4 rounded" style={{ accentColor: clr[2].icon }} />
                  <span className="text-xs font-medium" style={{ color: txt2 }}>
                    <Star className="w-3.5 h-3.5 inline mr-1" style={{ color: clr[2].icon }} /> Featured
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.visible} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                    className="w-4 h-4 rounded" style={{ accentColor: clr[1].icon }} />
                  <span className="text-xs font-medium" style={{ color: txt2 }}>
                    {form.visible ? <Eye className="w-3.5 h-3.5 inline mr-1" /> : <EyeOff className="w-3.5 h-3.5 inline mr-1" />} Visible
                  </span>
                </label>
                <div>
                  <label className="block text-[10px] font-semibold mb-0.5" style={{ color: txt3 }}>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-20 rounded-xl border px-2 py-1.5 text-xs outline-none"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: txt }} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-4 sm:px-6 py-4 rounded-b-2xl"
              style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="grad" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                {editingId ? "Save Changes" : "Create Design"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
