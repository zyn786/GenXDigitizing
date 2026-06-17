"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, GripVertical, Star, Eye, EyeOff,
  ImagePlus, X, Save, Loader2, Upload, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SUB_CATEGORIES } from "@/components/portfolio/data";

const CARD_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D" },
];

interface Category {
  id: string; name: string; slug: string; emoji: string; color: string; sortOrder: number;
  _count?: { portfolios: number };
}

interface PortfolioImage {
  id?: string; url: string; thumbnailUrl?: string; blurhash?: string;
  alt?: string; width?: number; height?: number; sortOrder: number; isBefore: boolean;
  isThumbnail?: boolean;
}

interface Portfolio {
  id: string; title: string; slug: string; description: string; clientName?: string;
  categoryId: string; category: Category; stitches?: number; colors: number;
  format: string; turnaround: string; size: string; accent: string;
  featured: boolean; visible: boolean; sortOrder: number; tags: string[];
  images: PortfolioImage[];
}

const DEFAULT_FORM = {
  title: "", slug: "", description: "", clientName: "", categoryId: "",
  stitches: 0, colors: 1, format: "DST · PES", turnaround: "Standard",
  size: "", accent: "#5B21B6", featured: false, visible: true, tags: [] as string[],
  keywords: [] as string[],
  images: [] as PortfolioImage[],
};

const ACCENT_COLORS = [
  "#0E7490", "#1E8CC0", "#0284C7", "#0369A1",
  "#9A3412", "#92400E", "#D97706",
  "#047857", "#047857", "#047857",
  "#2B1D17", "#5C3F2E", "#8C7A6B",
];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

export function PortfolioAdminClient() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/portfolio"),
      fetch("/api/admin/categories"),
    ]);
    if (pRes.ok) { setPortfolios(await pRes.json()); }
    else {
      const err = await pRes.json().catch(() => ({}));
      if (err.error?.includes("does not exist") || pRes.status === 500) setSetupNeeded(true);
    }
    if (cRes.ok) { setCategories(await cRes.json()); }
    else {
      const err = await cRes.json().catch(() => ({}));
      if (err.error?.includes("does not exist") || cRes.status === 500) setSetupNeeded(true);
    }
    setLoading(false);
  }, []);

  const handleSetup = async () => {
    setSettingUp(true);
    const res = await fetch("/api/admin/setup-portfolio", { method: "POST" });
    const data = await res.json();
    if (data.needsSetup) {
      toast.error("Tables don't exist yet. Run migration SQL in Supabase SQL Editor:\n" + data.migrationFile);
    } else if (res.ok) {
      toast.success("Portfolio tables ready!");
      setSetupNeeded(false); setLoading(true); await fetchData();
    } else { toast.error(data.error || "Setup failed"); }
    setSettingUp(false);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const uploadFiles = useCallback(async (accepted: File[], isThumbnail: boolean) => {
    if (accepted.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      accepted.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Upload failed"); }
      const uploaded = await res.json();
      const baseIdx = form.images.filter((i) => !i.isThumbnail).length;
      const newImages: PortfolioImage[] = uploaded.map((img: any, idx: number) => ({
        url: img.url, thumbnailUrl: img.thumbnailUrl, blurhash: img.blurhash,
        alt: isThumbnail ? "Thumbnail" : `Image ${baseIdx + idx + 1}`,
        width: img.width, height: img.height,
        sortOrder: isThumbnail ? -1 : baseIdx + idx, isBefore: false, isThumbnail,
      }));
      setForm((f) => ({
        ...f,
        images: isThumbnail ? [...f.images.filter((i) => !i.isThumbnail), ...newImages] : [...f.images, ...newImages],
      }));
      toast.success(isThumbnail ? "Thumbnail uploaded" : `${uploaded.length} image(s) uploaded`);
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  }, [form.images]);

  const { getRootProps: getThumbRootProps, getInputProps: getThumbInputProps, isDragActive: isThumbDrag } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] }, maxSize: 4 * 1024 * 1024, maxFiles: 1,
    onDrop: (accepted) => uploadFiles(accepted, true),
  });

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDrag } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif"] }, maxSize: 16 * 1024 * 1024,
    onDrop: (accepted) => uploadFiles(accepted, false),
  });

  const openNew = () => { setEditingId(null); setForm(DEFAULT_FORM); setShowModal(true); };
  const openEdit = (p: Portfolio) => {
    setEditingId(p.id);
    setForm({ title: p.title, slug: p.slug, description: p.description, clientName: p.clientName || "", categoryId: p.categoryId, stitches: p.stitches || 0, colors: p.colors, format: p.format, turnaround: p.turnaround, size: p.size, accent: p.accent, featured: p.featured, visible: p.visible, tags: p.tags, keywords: p.keywords || [], images: p.images.map((img) => ({ ...img })) });
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => { setForm((f) => ({ ...f, title, slug: editingId ? f.slug : slugify(title) })); };
  const removeImage = (idx: number) => { setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) })); };
  const toggleImageBefore = (idx: number) => { setForm((f) => ({ ...f, images: f.images.map((img, i) => i === idx ? { ...img, isBefore: !img.isBefore } : img) })); };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.categoryId) { toast.error("Title, slug, and category are required"); return; }
    setSaving(true);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/admin/portfolio/${editingId}` : "/api/admin/portfolio";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success(editingId ? "Updated" : "Created"); setShowModal(false); fetchData(); }
    else { const data = await res.json(); toast.error(data.error || "Save failed"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const res = await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchData(); } else { toast.error("Delete failed"); }
  };

  const toggleFeatured = async (p: Portfolio) => {
    await fetch(`/api/admin/portfolio/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured: !p.featured }) });
    fetchData();
  };

  const toggleVisible = async (p: Portfolio) => {
    await fetch(`/api/admin/portfolio/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visible: !p.visible }) });
    fetchData();
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const reordered = [...portfolios];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    setPortfolios(reordered);
    setDragIndex(idx);
  };
  const handleDragEnd = async () => {
    setDragIndex(null);
    await fetch("/api/admin/portfolio/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderedIds: portfolios.map((p) => p.id) }) });
  };

  const txt2 = "var(--txt2)", txt3 = "var(--txt3)", txt = "var(--txt)";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: txt3 }} />
      </div>
    );
  }

  if (setupNeeded) {
    return (
      <div className="portal-content" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl"
            style={{ background: CARD_COLORS[4].bgSoft, border: `1px solid ${CARD_COLORS[4].border}` }}>
            🗄️
          </div>
          <h2 className="font-syne font-bold text-lg mb-2" style={{ color: txt }}>Database Setup Required</h2>
          <p className="text-sm max-w-md mb-6" style={{ color: txt2 }}>
            The portfolio tables haven&apos;t been created yet. Run the migration SQL in your Supabase SQL Editor.
          </p>
          <Button onClick={handleSetup} disabled={settingUp} leftIcon={settingUp ? <Loader2 size={15} className="animate-spin" /> : undefined}>
            {settingUp ? "Setting up..." : "Auto-Setup"}
          </Button>
          <p className="text-xs mt-4" style={{ color: txt3 }}>
            Manual: Open Supabase SQL Editor → paste <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: "var(--elevated)", color: txt2 }}>supabase/migrations/007_portfolio.sql</code> → Run
          </p>
        </div>
      </div>
    );
  }

  const clr = CARD_COLORS;
  const btnBase: React.CSSProperties = { padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: "transparent", border: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", minWidth: 32, minHeight: 32 };

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-syne font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Portfolio
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>Manage showcase projects — drag to reorder</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <button onClick={openNew}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-semibold border-none cursor-pointer transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}>
          <Plus size={15} /> Add Project
        </button>
        <span className="text-xs font-medium" style={{ color: txt3 }}>{portfolios.length} project{portfolios.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Project list */}
      <div className="flex flex-col gap-2">
        {portfolios.map((p, idx) => (
          <div key={p.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all cursor-default ${dragIndex === idx ? "opacity-50 scale-[0.98]" : ""}`}
            style={{
              background: p.featured ? "var(--surface)" : "var(--surface)",
              borderColor: p.featured ? CARD_COLORS[2].border : "var(--border)",
            }}>
            {/* Drag handle */}
            <div className="cursor-grab flex-shrink-0" style={{ color: txt3 }}><GripVertical size={16} /></div>

            {/* Thumbnail */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${p.accent}20, ${p.accent}08)`, border: `1px solid ${p.accent}30` }}>
              {(p.images.find((i: any) => i.isThumbnail || i.sortOrder === -1) || p.images[0]) ? (
                <img src={(p.images.find((i: any) => i.isThumbnail || i.sortOrder === -1) || p.images[0]).url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
              ) : <Palette size={18} style={{ color: p.accent }} />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate" style={{ color: txt }}>{p.title}</span>
                {p.featured && <Star size={12} className="text-[#EA580C] fill-[#EA580C] flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap" style={{ color: txt2 }}>
                <span style={{ color: p.category.color }}>{p.category.emoji} {p.category.name}</span>
                <span>·</span><span>{p.images.length} image{p.images.length !== 1 ? "s" : ""}</span>
                {p.clientName && <><span>·</span><span>Client: {p.clientName}</span></>}
                {!p.visible && <Badge className="text-[10px]">Hidden</Badge>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <button onClick={() => toggleFeatured(p)} title={p.featured ? "Unfeature" : "Feature"} style={btnBase}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--elevated)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                <Star size={15} className={p.featured ? "text-[#EA580C] fill-[#EA580C]" : ""} style={{ color: p.featured ? undefined : txt3 }} />
              </button>
              <button onClick={() => toggleVisible(p)} title={p.visible ? "Hide" : "Show"} style={btnBase}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--elevated)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                {p.visible ? <Eye size={15} style={{ color: txt2 }} /> : <EyeOff size={15} style={{ color: txt3 }} />}
              </button>
              <button onClick={() => openEdit(p)} style={{ ...btnBase, color: txt2 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--elevated)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                <Edit size={15} />
              </button>
              <button onClick={() => handleDelete(p.id)} style={{ ...btnBase, color: CARD_COLORS[5].text }}
                onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = CARD_COLORS[5].bgSoft; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {portfolios.length === 0 && (
          <div className="text-center py-16" style={{ color: txt3 }}>
            <p className="text-lg mb-2 font-medium">No projects yet</p>
            <p className="text-sm">Add your first portfolio project to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center p-4 pt-[5vh] overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 rounded-t-2xl"
              style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-syne font-bold text-lg" style={{ color: txt }}>
                {editingId ? "Edit Project" : "New Project"}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: txt3 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--elevated)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-6">
              {/* ── Basic Info ── */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: txt2 }}>Title *</label>
                    <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Project title" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: txt2 }}>Slug *</label>
                    <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated-from-title" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: txt2 }}>Category *</label>
                    <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                      style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt }}>
                      <option value="">Select category...</option>
                      {categories.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.name}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: txt2 }}>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                    placeholder="Short description shown on card..."
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm resize-y outline-none"
                    style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt }} />
                </div>
              </div>

              {/* Sub-categories */}
              {form.categoryId && (() => {
                const selectedCat = categories.find((c) => c.id === form.categoryId);
                const subs = selectedCat ? (SUB_CATEGORIES[selectedCat.slug] || []) : [];
                if (subs.length === 0) return null;
                return (
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: txt2 }}>Sub-categories</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {subs.map((sub) => {
                        const alreadyAdded = form.tags.includes(sub);
                        return (
                          <button key={sub} onClick={() => {
                            if (alreadyAdded) setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== sub) }));
                            else setForm((f) => ({ ...f, tags: [...f.tags, sub] }));
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95"
                          style={{
                            background: alreadyAdded ? clr[3].bgSoft : "var(--elevated)",
                            color: alreadyAdded ? clr[3].text : txt2,
                            borderColor: alreadyAdded ? clr[3].border : "var(--border2)",
                          }}>
                          {alreadyAdded ? "✓ " : "+ "}{sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── Images ── */}
              <div className="space-y-4">
                <h3 className="font-syne font-bold text-sm flex items-center gap-2" style={{ color: txt }}>
                  <span className="w-1 h-4 rounded-full" style={{ background: clr[5].icon }} /> Images
                </h3>

              {/* Thumbnail upload */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: txt2 }}>
                  Thumbnail <span className="font-normal" style={{ color: txt3 }}>— main card image, 3:4 ratio recommended</span>
                </label>
                <div className="flex items-start gap-4">
                  {/* Thumbnail preview */}
                  <div className="w-32 h-40 sm:w-36 sm:h-48 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border relative"
                    style={{ background: `${form.accent}10`, borderColor: "var(--border2)" }}>
                    {form.images.filter((i) => i.isThumbnail)[0] ? (
                      <>
                        <img src={form.images.filter((i) => i.isThumbnail)[0].url} alt="Thumbnail" className="w-full h-full object-cover" />
                        <button onClick={() => setForm((f) => ({ ...f, images: f.images.filter((i) => !i.isThumbnail) }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"><X size={10} /></button>
                      </>
                    ) : (
                      <ImagePlus size={22} style={{ color: txt3, opacity: 0.5 }} />
                    )}
                  </div>
                  {/* Drop zone */}
                  <div {...getThumbRootProps()} className="flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 min-h-[160px] sm:min-h-[192px]"
                    style={{ borderColor: isThumbDrag ? CARD_COLORS[2].border : "var(--border2)", background: isThumbDrag ? CARD_COLORS[2].bgSoft : "transparent" }}>
                    <input {...getThumbInputProps()} />
                    {uploading ? (
                      <><Loader2 size={18} className="animate-spin" style={{ color: CARD_COLORS[2].icon }} /><span className="text-xs" style={{ color: txt2 }}>Uploading...</span></>
                    ) : (
                      <><Upload size={18} style={{ color: txt3 }} /><span className="text-xs font-medium" style={{ color: txt2 }}>Drop or click to upload</span><span className="text-[10px]" style={{ color: txt3 }}>PNG/JPG/WebP · max 4MB</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Project images upload */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: txt2 }}>
                  Gallery Images ({form.images.filter((i) => !i.isThumbnail).length})
                  <span className="font-normal" style={{ color: txt3 }}> — shown in lightbox, 4:3 ratio recommended</span>
                </label>
                <div {...getImageRootProps()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all"
                  style={{ borderColor: isImageDrag ? CARD_COLORS[4].border : "var(--border2)", background: isImageDrag ? CARD_COLORS[4].bgSoft : "transparent" }}>
                  <input {...getImageInputProps()} />
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={18} style={{ color: txt3 }} />
                    <span className="text-xs font-medium" style={{ color: txt2 }}>Drop or click to upload gallery images</span>
                    <span className="text-[10px]" style={{ color: txt3 }}>PNG/JPG/WebP · up to 16MB each · multiple files OK</span>
                  </div>
                </div>
                {form.images.filter((i) => !i.isThumbnail).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {form.images.filter((i) => !i.isThumbnail).map((img, idx) => (
                      <div key={idx} className="relative aspect-[3/2] rounded-xl overflow-hidden border group" style={{ borderColor: "var(--border2)" }}>
                        <img src={img.url} alt={img.alt || `Image ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => toggleImageBefore(form.images.findIndex((i) => i === img))}
                            title={img.isBefore ? "Set as after" : "Set as before"}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: img.isBefore ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", color: img.isBefore ? "#000" : "#fff" }}>B</button>
                          <button onClick={() => { setForm((f) => ({ ...f, images: f.images.filter((i) => i !== img) })); }}
                            className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white"><X size={14} /></button>
                        </div>
                        <span className="absolute top-2 left-2 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: img.isBefore ? "rgba(220,38,38,0.85)" : "rgba(0,0,0,0.55)", color: "#fff" }}>
                          {img.isBefore ? "Before" : `Image ${idx + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="w-4 h-4 rounded" style={{ accentColor: CARD_COLORS[2].icon }} />
                  <span className="text-sm flex items-center gap-1.5" style={{ color: txt2 }}>
                    <Star size={13} style={{ color: CARD_COLORS[2].icon }} /> Featured
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.visible} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                    className="w-4 h-4 rounded" style={{ accentColor: CARD_COLORS[4].icon }} />
                  <span className="text-sm flex items-center gap-1.5" style={{ color: txt2 }}>
                    {form.visible ? <Eye size={13} /> : <EyeOff size={13} />} Visible on homepage
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 sm:p-5 rounded-b-2xl"
              style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} leftIcon={saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}>
                {editingId ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
