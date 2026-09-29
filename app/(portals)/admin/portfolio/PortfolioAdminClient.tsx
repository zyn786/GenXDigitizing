"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Star,
  Eye,
  EyeOff,
  ImagePlus,
  X,
  Save,
  Loader2,
  Upload,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SUB_CATEGORIES } from "@/components/portfolio/data";
import { PortfolioModal } from "@/components/portfolio/PortfolioModal";
import Image from "next/image";

const CARD_COLORS = [
  {
    bg: "#3B82F6",
    bgSoft: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    icon: "#2563EB",
    text: "#1D4ED8",
  },
  {
    bg: "#10B981",
    bgSoft: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    icon: "#059669",
    text: "#047857",
  },
  {
    bg: "#F97316",
    bgSoft: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    icon: "#EA580C",
    text: "#C2410C",
  },
  {
    bg: "#06B6D4",
    bgSoft: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    icon: "#0891B2",
    text: "#0E7490",
  },
  {
    bg: "#8B5CF6",
    bgSoft: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    icon: "#7C3AED",
    text: "#6D28D9",
  },
  {
    bg: "#EC4899",
    bgSoft: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.25)",
    icon: "#DB2777",
    text: "#BE185D",
  },
];

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string;
  sortOrder: number;
  _count?: { portfolios: number };
}

interface PortfolioImage {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  blurhash?: string;
  alt?: string;
  width?: number;
  height?: number;
  sortOrder: number;
  isBefore: boolean;
  isThumbnail?: boolean;
}

interface Portfolio {
  id: string;
  title: string;
  slug: string;
  description: string;
  clientName?: string;
  categoryId: string;
  category: Category;
  stitches?: number;
  colors: number;
  format: string;
  turnaround: string;
  size: string;
  accent: string;
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  tags: string[];
  keywords?: string[];
  images: PortfolioImage[];
}

const DEFAULT_FORM = {
  title: "",
  slug: "",
  description: "",
  clientName: "",
  categoryId: "",
  stitches: 0,
  colors: 1,
  format: "DST · PES",
  turnaround: "Standard",
  size: "",
  accent: "#5B21B6",
  featured: false,
  visible: true,
  tags: [] as string[],
  keywords: [] as string[],
  images: [] as PortfolioImage[],
};

const ACCENT_COLORS = [
  "#0E7490",
  "#1E8CC0",
  "#0284C7",
  "#0369A1",
  "#9A3412",
  "#92400E",
  "#D97706",
  "#047857",
  "#047857",
  "#047857",
  "#2B1D17",
  "#5C3F2E",
  "#8C7A6B",
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const [selectedPreview, setSelectedPreview] = useState<Portfolio | null>(null);

  const fetchData = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/portfolio"),
      fetch("/api/admin/categories"),
    ]);
    if (pRes.ok) {
      setPortfolios(await pRes.json());
    } else {
      const err = await pRes.json().catch(() => ({}));
      if (err.error?.includes("does not exist") || pRes.status === 500) setSetupNeeded(true);
    }
    if (cRes.ok) {
      setCategories(await cRes.json());
    } else {
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
      toast.error(
        "Tables don't exist yet. Run migration SQL in Supabase SQL Editor:\n" + data.migrationFile
      );
    } else if (res.ok) {
      toast.success("Portfolio tables ready!");
      setSetupNeeded(false);
      setLoading(true);
      await fetchData();
    } else {
      toast.error(data.error || "Setup failed");
    }
    setSettingUp(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uploadFiles = useCallback(
    async (accepted: File[], isThumbnail: boolean) => {
      if (accepted.length === 0) return;
      setUploading(true);
      try {
        const fd = new FormData();
        accepted.forEach((f) => fd.append("files", f));
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }
        const uploaded = await res.json();
        const baseIdx = form.images.filter((i) => !i.isThumbnail).length;
        const newImages: PortfolioImage[] = uploaded.map((img: any, idx: number) => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          blurhash: img.blurhash,
          alt: isThumbnail ? "Thumbnail" : `Image ${baseIdx + idx + 1}`,
          width: img.width,
          height: img.height,
          sortOrder: isThumbnail ? -1 : baseIdx + idx,
          isBefore: false,
          isThumbnail,
        }));
        setForm((f) => ({
          ...f,
          images: isThumbnail
            ? [...f.images.filter((i) => !i.isThumbnail), ...newImages]
            : [...f.images, ...newImages],
        }));
        toast.success(isThumbnail ? "Thumbnail uploaded" : `${uploaded.length} image(s) uploaded`);
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [form.images]
  );

  const {
    getRootProps: getThumbRootProps,
    getInputProps: getThumbInputProps,
    isDragActive: isThumbDrag,
  } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 4 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (accepted) => uploadFiles(accepted, true),
  });

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDrag,
  } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".avif"] },
    maxSize: 16 * 1024 * 1024,
    onDrop: (accepted) => uploadFiles(accepted, false),
  });

  const openNew = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  };
  const openEdit = (p: Portfolio) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      description: p.description,
      clientName: p.clientName || "",
      categoryId: p.categoryId,
      stitches: p.stitches || 0,
      colors: p.colors,
      format: p.format,
      turnaround: p.turnaround,
      size: p.size,
      accent: p.accent,
      featured: p.featured,
      visible: p.visible,
      tags: p.tags,
      keywords: p.keywords || [],
      images: p.images.map((img) => ({ ...img })),
    });
    setShowModal(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: editingId ? f.slug : slugify(title) }));
  };
  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };
  const toggleImageBefore = (idx: number) => {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => (i === idx ? { ...img, isBefore: !img.isBefore } : img)),
    }));
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.categoryId) {
      toast.error("Title, slug, and category are required");
      return;
    }
    setSaving(true);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/admin/portfolio/${editingId}` : "/api/admin/portfolio";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editingId ? "Updated" : "Created");
      setShowModal(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || "Save failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const res = await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      fetchData();
    } else {
      toast.error("Delete failed");
    }
  };

  const toggleFeatured = async (p: Portfolio) => {
    await fetch(`/api/admin/portfolio/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !p.featured }),
    });
    fetchData();
  };

  const toggleVisible = async (p: Portfolio) => {
    await fetch(`/api/admin/portfolio/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !p.visible }),
    });
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
    await fetch("/api/admin/portfolio/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: portfolios.map((p) => p.id) }),
    });
  };

  const txt2 = "var(--txt2)",
    txt3 = "var(--txt3)",
    txt = "var(--txt)";

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
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
            style={{
              background: CARD_COLORS[4].bgSoft,
              border: `1px solid ${CARD_COLORS[4].border}`,
            }}
          >
            🗄️
          </div>
          <h2 className="mb-2 font-syne text-lg font-bold" style={{ color: txt }}>
            Database Setup Required
          </h2>
          <p className="mb-6 max-w-md text-sm" style={{ color: txt2 }}>
            The portfolio tables haven&apos;t been created yet. Run the migration SQL in your
            Supabase SQL Editor.
          </p>
          <Button
            onClick={handleSetup}
            disabled={settingUp}
            leftIcon={settingUp ? <Loader2 size={15} className="animate-spin" /> : undefined}
          >
            {settingUp ? "Setting up..." : "Auto-Setup"}
          </Button>
          <p className="mt-4 text-xs" style={{ color: txt3 }}>
            Manual: Open Supabase SQL Editor → paste{" "}
            <code
              className="rounded px-1.5 py-0.5 text-[11px]"
              style={{ background: "var(--elevated)", color: txt2 }}
            >
              supabase/migrations/007_portfolio.sql
            </code>{" "}
            → Run
          </p>
        </div>
      </div>
    );
  }

  const clr = CARD_COLORS;
  const btnBase: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    background: "transparent",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
    minWidth: 32,
    minHeight: 32,
  };

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2
          className="font-syne text-xl font-bold sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Portfolio
        </h2>
        <p className="mt-1 text-[12px] sm:text-xs" style={{ color: txt3 }}>
          Manage showcase projects — drag to reorder
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={openNew}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none px-4 py-2.5 text-xs font-semibold text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}
        >
          <Plus size={15} /> Add Project
        </button>
        <span className="text-xs font-medium" style={{ color: txt3 }}>
          {portfolios.length} project{portfolios.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Project list */}
      <div className="flex flex-col gap-2">
        {portfolios.map((p, idx) => (
          <div
            key={p.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex cursor-default items-center gap-2 rounded-2xl border p-2.5 transition-all sm:gap-3 sm:p-3 ${dragIndex === idx ? "scale-[0.98] opacity-50" : ""}`}
            style={{
              background: p.featured ? "var(--surface)" : "var(--surface)",
              borderColor: p.featured ? CARD_COLORS[2].border : "var(--border)",
            }}
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 cursor-grab" style={{ color: txt3 }}>
              <GripVertical size={16} />
            </div>

            {/* Thumbnail */}
            <div
              className="relative flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl sm:h-16 sm:w-16"
              style={{
                background: `linear-gradient(135deg, ${p.accent}20, ${p.accent}08)`,
                border: `1px solid ${p.accent}30`,
              }}
              onClick={() => setSelectedPreview(p)}
            >
              {p.images.find((i: any) => i.isThumbnail || i.sortOrder === -1) || p.images[0] ? (
                <Image
                  fill
                  src={
                    (p.images.find((i: any) => i.isThumbnail || i.sortOrder === -1) || p.images[0])
                      .url
                  }
                  alt={p.title}
                  className="object-cover"
                  loading="lazy"
                  sizes="64px"
                />
              ) : (
                <Palette size={18} style={{ color: p.accent }} />
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold" style={{ color: txt }}>
                  {p.title}
                </span>
                {p.featured && (
                  <Star size={12} className="flex-shrink-0 fill-[#EA580C] text-[#EA580C]" />
                )}
              </div>
              <div
                className="mt-0.5 flex flex-wrap items-center gap-2 text-xs"
                style={{ color: txt2 }}
              >
                <span style={{ color: p.category.color }}>
                  {p.category.emoji} {p.category.name}
                </span>
                <span>·</span>
                <span>
                  {p.images.length} image{p.images.length !== 1 ? "s" : ""}
                </span>
                {p.clientName && (
                  <>
                    <span>·</span>
                    <span>Client: {p.clientName}</span>
                  </>
                )}
                {!p.visible && <Badge className="text-[10px]">Hidden</Badge>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => toggleFeatured(p)}
                title={p.featured ? "Unfeature" : "Feature"}
                style={btnBase}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--elevated)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                <Star
                  size={15}
                  className={p.featured ? "fill-[#EA580C] text-[#EA580C]" : ""}
                  style={{ color: p.featured ? undefined : txt3 }}
                />
              </button>
              <button
                onClick={() => toggleVisible(p)}
                title={p.visible ? "Hide" : "Show"}
                style={btnBase}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--elevated)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                {p.visible ? (
                  <Eye size={15} style={{ color: txt2 }} />
                ) : (
                  <EyeOff size={15} style={{ color: txt3 }} />
                )}
              </button>
              <button
                onClick={() => openEdit(p)}
                style={{ ...btnBase, color: txt2 }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--elevated)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                <Edit size={15} />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                style={{ ...btnBase, color: CARD_COLORS[5].text }}
                onMouseEnter={(e) => {
                  const t = e.currentTarget as HTMLElement;
                  t.style.background = CARD_COLORS[5].bgSoft;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {portfolios.length === 0 && (
          <div className="py-16 text-center" style={{ color: txt3 }}>
            <p className="mb-2 text-lg font-medium">No projects yet</p>
            <p className="text-sm">Add your first portfolio project to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto p-4 pt-[5vh]"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl p-4 sm:p-5"
              style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="font-syne text-lg font-bold" style={{ color: txt }}>
                {editingId ? "Edit Project" : "New Project"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{ color: txt3 }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "var(--elevated)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "transparent")
                }
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-6 p-4 sm:p-5">
              {/* ── Basic Info ── */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: txt2 }}>
                      Title *
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Project title"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: txt2 }}>
                      Slug *
                    </label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="auto-generated-from-title"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold" style={{ color: txt2 }}>
                      Category *
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                      style={{
                        background: "var(--elevated)",
                        borderColor: "var(--border2)",
                        color: txt,
                      }}
                    >
                      <option value="">Select category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold" style={{ color: txt2 }}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Short description shown on card..."
                    className="w-full resize-y rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                    style={{
                      background: "var(--elevated)",
                      borderColor: "var(--border2)",
                      color: txt,
                    }}
                  />
                </div>
              </div>

              {/* Sub-categories */}
              {form.categoryId &&
                (() => {
                  const selectedCat = categories.find((c) => c.id === form.categoryId);
                  const subs = selectedCat ? SUB_CATEGORIES[selectedCat.slug] || [] : [];
                  if (subs.length === 0) return null;
                  return (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold" style={{ color: txt2 }}>
                        Sub-categories
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {subs.map((sub) => {
                          const alreadyAdded = form.tags.includes(sub);
                          return (
                            <button
                              key={sub}
                              onClick={() => {
                                if (alreadyAdded)
                                  setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== sub) }));
                                else setForm((f) => ({ ...f, tags: [...f.tags, sub] }));
                              }}
                              className="rounded-full border px-2.5 py-1 text-xs font-medium transition-all active:scale-95"
                              style={{
                                background: alreadyAdded ? clr[3].bgSoft : "var(--elevated)",
                                color: alreadyAdded ? clr[3].text : txt2,
                                borderColor: alreadyAdded ? clr[3].border : "var(--border2)",
                              }}
                            >
                              {alreadyAdded ? "✓ " : "+ "}
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              {/* ── Keywords ── */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold" style={{ color: txt2 }}>
                  Keywords{" "}
                  <span className="font-normal" style={{ color: txt3 }}>
                    — comma-separated, for SEO
                  </span>
                </label>
                <input
                  type="text"
                  value={form.keywords.join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      keywords: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="embroidery digitizing, custom patches, vector art..."
                  className="input text-xs"
                  style={{
                    background: "var(--elevated)",
                    border: "1px solid var(--border2)",
                    borderRadius: 8,
                    color: "var(--txt)",
                    padding: "8px 12px",
                    width: "100%",
                    outline: "none",
                  }}
                />
                {form.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: clr[0].bgSoft,
                          color: clr[0].text,
                          border: `1px solid ${clr[0].border}`,
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Images ── */}
              <div className="space-y-4">
                <h3
                  className="flex items-center gap-2 font-syne text-sm font-bold"
                  style={{ color: txt }}
                >
                  <span className="h-4 w-1 rounded-full" style={{ background: clr[5].icon }} />{" "}
                  Images
                </h3>

                {/* Thumbnail upload */}
                <div>
                  <label className="mb-2 block text-xs font-semibold" style={{ color: txt2 }}>
                    Thumbnail{" "}
                    <span className="font-normal" style={{ color: txt3 }}>
                      — main card image, 3:4 ratio recommended
                    </span>
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Thumbnail preview */}
                    <div
                      className="relative flex h-40 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border sm:h-48 sm:w-36"
                      style={{ background: `${form.accent}10`, borderColor: "var(--border2)" }}
                    >
                      {form.images.filter((i) => i.isThumbnail)[0] ? (
                        <>
                          <Image
                            fill
                            src={form.images.filter((i) => i.isThumbnail)[0].url}
                            alt="Thumbnail"
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                          <button
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                images: f.images.filter((i) => !i.isThumbnail),
                              }))
                            }
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <ImagePlus size={22} style={{ color: txt3, opacity: 0.5 }} />
                      )}
                    </div>
                    {/* Drop zone */}
                    <div
                      {...getThumbRootProps()}
                      className="flex min-h-[160px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-4 text-center transition-all sm:min-h-[192px]"
                      style={{
                        borderColor: isThumbDrag ? CARD_COLORS[2].border : "var(--border2)",
                        background: isThumbDrag ? CARD_COLORS[2].bgSoft : "transparent",
                      }}
                    >
                      <input {...getThumbInputProps()} />
                      {uploading ? (
                        <>
                          <Loader2
                            size={18}
                            className="animate-spin"
                            style={{ color: CARD_COLORS[2].icon }}
                          />
                          <span className="text-xs" style={{ color: txt2 }}>
                            Uploading...
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} style={{ color: txt3 }} />
                          <span className="text-xs font-medium" style={{ color: txt2 }}>
                            Drop or click to upload
                          </span>
                          <span className="text-[10px]" style={{ color: txt3 }}>
                            PNG/JPG/WebP · max 4MB
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project images upload */}
                <div>
                  <label className="mb-2 block text-xs font-semibold" style={{ color: txt2 }}>
                    Gallery Images ({form.images.filter((i) => !i.isThumbnail).length})
                    <span className="font-normal" style={{ color: txt3 }}>
                      {" "}
                      — shown in lightbox, 4:3 ratio recommended
                    </span>
                  </label>
                  <div
                    {...getImageRootProps()}
                    className="cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all"
                    style={{
                      borderColor: isImageDrag ? CARD_COLORS[4].border : "var(--border2)",
                      background: isImageDrag ? CARD_COLORS[4].bgSoft : "transparent",
                    }}
                  >
                    <input {...getImageInputProps()} />
                    <div className="flex flex-col items-center gap-1">
                      <Upload size={18} style={{ color: txt3 }} />
                      <span className="text-xs font-medium" style={{ color: txt2 }}>
                        Drop or click to upload gallery images
                      </span>
                      <span className="text-[10px]" style={{ color: txt3 }}>
                        PNG/JPG/WebP · up to 16MB each · multiple files OK
                      </span>
                    </div>
                  </div>
                  {form.images.filter((i) => !i.isThumbnail).length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {form.images
                        .filter((i) => !i.isThumbnail)
                        .map((img, idx) => (
                          <div
                            key={idx}
                            className="group relative aspect-[3/2] overflow-hidden rounded-xl border"
                            style={{ borderColor: "var(--border2)" }}
                          >
                            <Image
                              fill
                              src={img.url}
                              alt={img.alt || `Image ${idx + 1}`}
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 800px"
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                              <button
                                onClick={() =>
                                  toggleImageBefore(form.images.findIndex((i) => i === img))
                                }
                                title={img.isBefore ? "Set as after" : "Set as before"}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                                style={{
                                  background: img.isBefore
                                    ? "rgba(255,255,255,0.9)"
                                    : "rgba(255,255,255,0.3)",
                                  color: img.isBefore ? "#000" : "#fff",
                                }}
                              >
                                B
                              </button>
                              <button
                                onClick={() => {
                                  setForm((f) => ({
                                    ...f,
                                    images: f.images.filter((i) => i !== img),
                                  }));
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 text-white"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <span
                              className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                              style={{
                                background: img.isBefore
                                  ? "rgba(220,38,38,0.85)"
                                  : "rgba(0,0,0,0.55)",
                                color: "#fff",
                              }}
                            >
                              {img.isBefore ? "Before" : `Image ${idx + 1}`}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center sm:gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: CARD_COLORS[2].icon }}
                  />
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: txt2 }}>
                    <Star size={13} style={{ color: CARD_COLORS[2].icon }} /> Featured
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.visible}
                    onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: CARD_COLORS[4].icon }}
                  />
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: txt2 }}>
                    {form.visible ? <Eye size={13} /> : <EyeOff size={13} />} Visible on homepage
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div
              className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl p-4 sm:p-5"
              style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
            >
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                leftIcon={
                  saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />
                }
              >
                {editingId ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <PortfolioModal item={selectedPreview as any} onClose={() => setSelectedPreview(null)} />
    </div>
  );
}
