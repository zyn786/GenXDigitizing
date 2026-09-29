// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  Check,
  AlertCircle,
  Play,
  Search,
  FileText,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  Globe,
  Hash,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import BlogContent from "@/components/blog/BlogContent";
import type { BlogPost as BlogPostType } from "@/lib/blog-data";
import Image from "next/image";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  emoji: string;
  accentColor: string;
  heroImage: string | null;
  published: boolean;
  content: any;
  created_at: string;
}

const CATEGORIES = [
  "General",
  "Digitizing 101",
  "Vector Art",
  "Patches",
  "Tutorials",
  "Industry News",
  "Case Studies",
];

const EMPTY_POST = {
  slug: "",
  title: "",
  description: "",
  category: "General",
  keywords: [] as string[],
  heroImage: "",
  emoji: "📝",
  accentColor: "#2563EB",
  published: false,
  content: {
    sections: [{ heading: "", body: "", image: "", images: [], layout: "text-only" }],
    faqs: [{ q: "", a: "" }],
    internalLinks: [{ text: "", href: "" }],
    cta: { text: "", href: "/contact", label: "Upload Design" },
  },
};

const LAYOUT_OPTIONS = [
  { value: "text-only", label: "Text", icon: "📝" },
  { value: "image-top", label: "Img Top", icon: "🖼️" },
  { value: "image-left", label: "Img Left", icon: "◧" },
  { value: "image-right", label: "Img Right", icon: "◨" },
  { value: "image-grid-2", label: "2-Up", icon: "⊞" },
  { value: "image-grid-3", label: "3-Up", icon: "▦" },
  { value: "image-grid-4", label: "4-Up", icon: "⊟" },
  { value: "comparison", label: "Compare", icon: "⇔" },
] as const;

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Stats
  const stats = useMemo(() => {
    const published = posts.filter((p) => p.published).length;
    const drafts = posts.filter((p) => !p.published).length;
    const uniqueCategories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    return { total: posts.length, published, drafts, categories: uniqueCategories.length };
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const mq =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const ms =
        statusFilter === "all" || (statusFilter === "published" ? p.published : !p.published);
      const mc = categoryFilter === "all" || p.category === categoryFilter;
      return mq && ms && mc;
    });
  }, [posts, search, statusFilter, categoryFilter]);

  // Unique categories from posts
  const usedCategories = useMemo(
    () => [...new Set(posts.map((p) => p.category).filter(Boolean))],
    [posts]
  );

  function formToBlogPost(): BlogPostType {
    if (!form) return {} as BlogPostType;
    const kw =
      typeof form.keywords === "string"
        ? form.keywords
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean)
        : form.keywords || [];
    return {
      slug: form.slug,
      title: form.title,
      description: form.description,
      date: new Date().toISOString().split("T")[0],
      category: form.category || "General",
      readTime: "6 min read",
      keywords: kw,
      hero: {
        emoji: form.emoji || "📝",
        color: form.accentColor || "#2563EB",
        image: form.heroImage || undefined,
      },
      sections: form.content?.sections || [],
      faqs: form.content?.faqs || [],
      internalLinks: form.content?.internalLinks || [],
      cta: form.content?.cta || {
        text: "Get a Free Quote",
        href: "/contact",
        label: "Upload Design",
      },
    };
  }

  // ── Image upload handlers ──────────────────────────────────────
  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("files", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const results = await res.json();
    return results[0]?.url || null;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        updateField("heroImage", url);
        setMessage({ type: "success", text: "Image uploaded!" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSectionImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    sectionIndex: number
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        updateContentField("sections", sectionIndex, "image", url);
        setMessage({ type: "success", text: "Section image uploaded!" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSectionMultiImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    sectionIndex: number
  ) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        if (url) urls.push(url);
      }
      setForm((prev: any) => {
        const content = { ...prev.content };
        const arr = [...(content.sections || [])];
        arr[sectionIndex] = {
          ...arr[sectionIndex],
          images: [...(arr[sectionIndex].images || []), ...urls],
        };
        content.sections = arr;
        return { ...prev, content };
      });
      setMessage({ type: "success", text: `${urls.length} image(s) uploaded!` });
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  function removeSectionImage(sectionIndex: number, imageIndex: number) {
    setForm((prev: any) => {
      const content = { ...prev.content };
      const arr = [...(content.sections || [])];
      const imgs = [...(arr[sectionIndex].images || [])];
      imgs.splice(imageIndex, 1);
      arr[sectionIndex] = { ...arr[sectionIndex], images: imgs };
      content.sections = arr;
      return { ...prev, content };
    });
  }

  // ── CRUD ───────────────────────────────────────────────────────
  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load posts" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await fetch("/api/admin/blog/comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      /* silent */
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleApproveComment(id: string, approved: boolean) {
    try {
      const res = await fetch("/api/admin/blog/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_approved: approved }),
      });
      if (!res.ok) throw new Error("Failed");
      loadComments();
    } catch {
      setMessage({ type: "error", text: "Failed to update comment" });
    }
  }

  async function handleDeleteComment(id: string) {
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/admin/blog/comments?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      loadComments();
    } catch {
      setMessage({ type: "error", text: "Failed to delete comment" });
    }
  }

  function openCreate() {
    setForm(JSON.parse(JSON.stringify(EMPTY_POST)));
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(post: BlogPost) {
    const content = typeof post.content === "string" ? JSON.parse(post.content) : post.content;
    setForm({ ...post, content });
    setEditingId(post.id);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm(null);
    setEditingId(null);
  }

  function updateField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  function updateContentField(path: string, index: number, subfield: string, value: string) {
    setForm((prev: any) => {
      const content = { ...prev.content };
      const arr = [...(content[path] || [])];
      if (!arr[index]) arr[index] = {};
      arr[index] = { ...arr[index], [subfield]: value };
      content[path] = arr;
      return { ...prev, content };
    });
  }

  function addContentItem(path: string) {
    setForm((prev: any) => {
      const content = { ...prev.content };
      const arr = [...(content[path] || [])];
      if (path === "sections")
        arr.push({ heading: "", body: "", image: "", images: [], layout: "text-only" });
      else if (path === "faqs") arr.push({ q: "", a: "" });
      else if (path === "internalLinks") arr.push({ text: "", href: "" });
      content[path] = arr;
      return { ...prev, content };
    });
  }

  function removeContentItem(path: string, index: number) {
    setForm((prev: any) => {
      const content = { ...prev.content };
      const arr = [...(content[path] || [])];
      arr.splice(index, 1);
      content[path] = arr;
      return { ...prev, content };
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        content: form.content,
        keywords:
          typeof form.keywords === "string"
            ? form.keywords
                .split(",")
                .map((k: string) => k.trim())
                .filter(Boolean)
            : form.keywords,
      };
      if (!editingId) {
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Post created!" });
      } else {
        const res = await fetch("/api/admin/blog", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingId }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Post updated!" });
      }
      closeModal();
      loadPosts();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMessage({ type: "success", text: "Post deleted" });
      loadPosts();
    } catch {
      setMessage({ type: "error", text: "Delete failed" });
    }
  }

  async function handleTogglePublish(post: BlogPost) {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, published: !post.published }),
      });
      if (!res.ok) throw new Error("Update failed");
      loadPosts();
    } catch {
      setMessage({ type: "error", text: "Toggle failed" });
    }
  }

  async function handleSeed() {
    if (
      !confirm(
        "Import 4 pre-written blog posts? Existing posts with matching slugs will be skipped."
      )
    )
      return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: `${data.imported || 0} posts imported!` });
      loadPosts();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Import failed" });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1300px] p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2
          className="font-syne text-xl font-bold sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Blog Management
        </h2>
        <p className="mt-1 text-xs sm:text-[13px]" style={{ color: "var(--txt3)" }}>
          Create, edit, and manage blog content
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Total Posts", val: stats.total, icon: <FileText size={16} />, ci: 0 },
          { label: "Published", val: stats.published, icon: <Globe size={16} />, ci: 1 },
          { label: "Drafts", val: stats.drafts, icon: <Pencil size={16} />, ci: 2 },
          { label: "Categories", val: stats.categories, icon: <Hash size={16} />, ci: 3 },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-3.5 sm:p-4"
            style={{
              background: [
                "rgba(37,99,235,0.06)",
                "rgba(16,185,129,0.06)",
                "rgba(249,115,22,0.06)",
                "rgba(139,92,246,0.06)",
              ][s.ci],
              borderColor: [
                "rgba(37,99,235,0.2)",
                "rgba(16,185,129,0.2)",
                "rgba(249,115,22,0.2)",
                "rgba(139,92,246,0.2)",
              ][s.ci],
            }}
          >
            <div
              className="mb-1 flex items-center gap-2"
              style={{ color: ["#2563EB", "#16A34A", "#F97316", "#7C3AED"][s.ci] }}
            >
              {s.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-bold sm:text-2xl" style={{ color: "var(--txt)" }}>
              {s.val}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[180px] max-w-[320px] flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt3)]"
            />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
              style={{
                background: "var(--elevated)",
                borderColor: "var(--border2)",
                color: "var(--txt)",
              }}
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="cursor-pointer rounded-xl border px-3 py-2 text-[13px] outline-none"
            style={{
              background: "var(--elevated)",
              borderColor: "var(--border2)",
              color: "var(--txt)",
            }}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="cursor-pointer rounded-xl border px-3 py-2 text-[13px] outline-none"
            style={{
              background: "var(--elevated)",
              borderColor: "var(--border2)",
              color: "var(--txt)",
            }}
          >
            <option value="all">All Categories</option>
            {usedCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSeed} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span className="ml-1.5 hidden sm:inline">Seed Posts</span>
          </Button>
          <Button variant="grad" size="md" leftIcon={<Plus size={15} />} onClick={openCreate}>
            New Post
          </Button>
        </div>
      </div>

      {/* Tabs: Posts | Comments */}
      <div
        className="mb-4 flex items-center gap-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {[
          { key: "posts", label: "Posts", count: posts.length },
          { key: "comments", label: "Comments", count: comments.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key as any);
              if (t.key === "comments") loadComments();
            }}
            className={`flex cursor-pointer items-center gap-2 border-b-2 bg-transparent px-4 py-2.5 text-[13px] font-semibold transition-all ${
              activeTab === t.key
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[var(--txt3)] hover:text-[var(--txt)]"
            }`}
          >
            {t.key === "posts" ? <FileText size={14} /> : <MessageSquare size={14} />}
            {t.label}
            {t.count > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px]"
                style={{
                  background: activeTab === t.key ? "rgba(37,99,235,0.12)" : "var(--elevated)",
                  color: activeTab === t.key ? "#2563EB" : "var(--txt3)",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-[13px] ${
            message.type === "success"
              ? "border border-[#16A34A]/20 bg-[#16A34A]/10 text-[#16A34A]"
              : "border border-[#DC2626]/20 bg-[#DC2626]/10 text-[#DC2626]"
          }`}
        >
          {message.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}

      {/* ── Posts Tab ──────────────────────────────────────────── */}
      {activeTab === "posts" && (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[var(--txt3)]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--elevated)] text-4xl">
                📝
              </div>
              <h2 className="mb-2 font-syne text-lg font-bold text-[var(--txt)]">
                No Blog Posts Yet
              </h2>
              <p className="mx-auto mb-6 max-w-sm text-sm text-[var(--txt2)]">
                Create your first post manually, or import 4 pre-written articles optimized for SEO.
              </p>
              <div className="flex flex-col justify-center gap-2.5 sm:flex-row">
                <Button variant="grad" size="md" leftIcon={<Plus size={15} />} onClick={openCreate}>
                  Create New Post
                </Button>
                <Button variant="outline" size="md" onClick={handleSeed} disabled={saving}>
                  {saving ? "Importing..." : "Import 4 Sample Posts"}
                </Button>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-sm text-[var(--txt2)]">No posts match your filters.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="mt-2 cursor-pointer border-none bg-transparent text-sm text-[#2563EB] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  {/* Card hero area */}
                  <div
                    className="relative flex h-24 items-center justify-center sm:h-32"
                    style={{
                      background: post.heroImage
                        ? `url(${post.heroImage}) center/cover`
                        : `linear-gradient(135deg, ${post.accentColor}22, ${post.accentColor}44)`,
                    }}
                  >
                    {!post.heroImage && <span className="text-4xl">{post.emoji || "📝"}</span>}
                    {/* Status badge */}
                    <span
                      className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: post.published ? "rgba(22,163,74,0.12)" : "var(--elevated)",
                        color: post.published ? "#16A34A" : "var(--txt3)",
                        border: `1px solid ${post.published ? "rgba(22,163,74,0.25)" : "var(--border2)"}`,
                      }}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {/* Card body */}
                  <div className="p-3.5">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: `${post.accentColor}15`, color: post.accentColor }}
                      >
                        {post.category || "General"}
                      </span>
                    </div>
                    <h3
                      className="mb-1 line-clamp-2 font-syne text-sm font-bold leading-snug"
                      style={{ color: "var(--txt)" }}
                    >
                      {post.title}
                    </h3>
                    <p
                      className="mb-3 line-clamp-2 text-[11px] leading-relaxed"
                      style={{ color: "var(--txt3)" }}
                    >
                      {post.description}
                    </p>
                    <div
                      className="mb-3 flex items-center gap-2 text-[10px]"
                      style={{ color: "var(--txt3)" }}
                    >
                      <Calendar size={10} />
                      <span>
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="opacity-40">|</span>
                      <span className="font-mono">{post.slug}</span>
                    </div>
                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 border-t pt-2"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--elevated)]"
                        style={{ color: "var(--txt2)" }}
                        title={post.published ? "Unpublish" : "Publish"}
                      >
                        {post.published ? (
                          <>
                            <EyeOff size={12} /> <span className="hidden sm:inline">Unpublish</span>
                          </>
                        ) : (
                          <>
                            <Eye size={12} /> <span className="hidden sm:inline">Publish</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(post)}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--elevated)]"
                        style={{ color: "var(--txt2)" }}
                      >
                        <Pencil size={12} /> <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="ml-auto flex cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-red-50 hover:text-[#DC2626]"
                        style={{ color: "var(--txt3)" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Comments Tab ─────────────────────────────────────────── */}
      {activeTab === "comments" && (
        <div>
          {loadingComments ? (
            <div className="flex justify-center py-12">
              <Loader2 size={18} className="animate-spin text-[var(--txt3)]" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--elevated)] text-2xl">
                💬
              </div>
              <p className="text-sm text-[var(--txt2)]">No comments yet.</p>
              <p className="mt-1 text-xs text-[var(--txt3)]">
                Comments will appear here once readers start engaging.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {comments.map((c: any) => (
                <div
                  key={c.id}
                  className="rounded-2xl border p-4 transition-all"
                  style={{
                    background: c.is_approved ? "var(--surface)" : "rgba(249,115,22,0.04)",
                    borderColor: c.is_approved ? "var(--border)" : "rgba(249,115,22,0.2)",
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: "var(--txt)" }}>
                          {c.author_name}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: c.is_approved
                              ? "rgba(22,163,74,0.1)"
                              : "rgba(249,115,22,0.1)",
                            color: c.is_approved ? "#16A34A" : "#F97316",
                          }}
                        >
                          {c.is_approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px]" style={{ color: "var(--txt3)" }}>
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" · "}
                        <span className="font-medium">{c.blog_posts?.title || "—"}</span>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {!c.is_approved ? (
                        <button
                          onClick={() => handleApproveComment(c.id, true)}
                          className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--txt3)] hover:bg-[#16A34A]/10 hover:text-[#16A34A]"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveComment(c.id, false)}
                          className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--txt3)] hover:bg-[var(--elevated)]"
                          title="Unapprove"
                        >
                          <EyeOff size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-[var(--txt3)] hover:bg-red-50 hover:text-[#DC2626]"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--txt2)" }}>
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Editor Modal ──────────────────────────────────────────── */}
      {showModal && form && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-10 my-4 w-full max-w-4xl rounded-2xl border border-[var(--border2)] bg-[var(--surface)] shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div>
                <h2 className="font-syne text-lg font-bold">
                  {editingId ? "Edit Post" : "New Post"}
                </h2>
                {editingId && (
                  <p className="mt-0.5 text-[11px] text-[var(--txt3)]">
                    Editing: {form.slug || "untitled"}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="cursor-pointer rounded-xl border-none bg-transparent p-2 text-[var(--txt3)] hover:bg-[var(--elevated)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form body — split into left (meta) and right (content) on desktop */}
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-5 p-4 sm:p-5">
                {/* Meta fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                    <Input
                      label="Slug"
                      value={form.slug}
                      onChange={(e) => updateField("slug", e.target.value)}
                      placeholder="my-post-slug"
                    />
                    <Input
                      label="Category"
                      value={form.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      placeholder="e.g. Digitizing 101"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Title"
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="Post title"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Description (SEO)"
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Meta description for search engines"
                    />
                  </div>
                  <Input
                    label="Emoji"
                    value={form.emoji}
                    onChange={(e) => updateField("emoji", e.target.value)}
                    placeholder="📝"
                  />
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--txt3)]">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => updateField("accentColor", e.target.value)}
                      className="h-10 w-full cursor-pointer rounded-lg border border-[var(--border)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Keywords (comma-separated)"
                      value={
                        Array.isArray(form.keywords) ? form.keywords.join(", ") : form.keywords
                      }
                      onChange={(e) => updateField("keywords", e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                  {/* Hero Image */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--txt3)]">
                      Hero Image
                    </label>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Input
                          value={form.heroImage || ""}
                          onChange={(e) => updateField("heroImage", e.target.value)}
                          placeholder="https://res.cloudinary.com/.../image.webp"
                        />
                        <p className="mt-1 text-[10px] text-[var(--txt3)]">
                          Recommended: 1200×630px, 16:9, WebP
                        </p>
                      </div>
                      <label
                        className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all"
                        style={{
                          background: "var(--elevated)",
                          border: "1px solid var(--border)",
                          color: "var(--txt2)",
                        }}
                      >
                        {uploading ? "Uploading..." : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {form.heroImage && (
                      // `fill` ignores width/height/max-height classes — it sets
                      // position:absolute with inset:0. The image was positioned
                      // against an ancestor outside this form and overflowed it,
                      // so it needs a real sized, positioned box.
                      <div
                        className="relative mt-2 aspect-[16/9] max-h-36 w-full overflow-hidden rounded-xl border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <Image
                          fill
                          src={form.heroImage}
                          alt="Preview"
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                    )}
                  </div>
                  {/* Publish toggle */}
                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={form.published}
                      onChange={(e) => updateField("published", e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded accent-[#2563EB]"
                    />
                    <label
                      htmlFor="published"
                      className="cursor-pointer select-none text-sm text-[var(--txt2)]"
                    >
                      Published (visible on site)
                    </label>
                  </div>
                </div>

                <hr style={{ borderColor: "var(--border)" }} />

                {/* Sections */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-syne text-[15px] font-bold" style={{ color: "var(--txt)" }}>
                      Content Sections
                    </h3>
                    <button
                      onClick={() => addContentItem("sections")}
                      className="cursor-pointer border-none bg-transparent text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      + Add Section
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.content.sections.map((s: any, i: number) => (
                      <div
                        key={i}
                        className="space-y-3 rounded-xl border p-4"
                        style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[11px] font-bold uppercase tracking-wide"
                            style={{ color: "var(--txt2)" }}
                          >
                            Section {i + 1}
                          </span>
                          <button
                            onClick={() => removeContentItem("sections", i)}
                            className="cursor-pointer border-none bg-transparent text-[11px] font-medium text-[#DC2626] hover:underline"
                          >
                            Remove
                          </button>
                        </div>

                        <Input
                          value={s.heading}
                          onChange={(e) =>
                            updateContentField("sections", i, "heading", e.target.value)
                          }
                          placeholder="Section heading"
                        />

                        <textarea
                          value={s.body}
                          onChange={(e) =>
                            updateContentField("sections", i, "body", e.target.value)
                          }
                          placeholder="Section body — supports **bold**, *italic*, tables, bullet/numbered lists"
                          rows={5}
                          className="w-full resize-y rounded-xl border p-3 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                          style={{
                            background: "var(--bg)",
                            borderColor: "var(--border2)",
                            color: "var(--txt)",
                          }}
                        />

                        {/* Layout picker */}
                        <div>
                          <label
                            className="mb-2 block text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: "var(--txt3)" }}
                          >
                            Layout
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {LAYOUT_OPTIONS.map((tpl) => (
                              <button
                                key={tpl.value}
                                type="button"
                                onClick={() =>
                                  updateContentField("sections", i, "layout", tpl.value)
                                }
                                className={`flex cursor-pointer items-center gap-1.5 rounded-lg border bg-transparent px-3 py-2 text-[11px] font-semibold transition-all ${
                                  (s.layout || "text-only") === tpl.value
                                    ? "bg-[#2563EB]/8 border-[#2563EB] text-[#2563EB]"
                                    : "border-[var(--border)] text-[var(--txt3)] hover:border-[var(--border3)] hover:text-[var(--txt)]"
                                }`}
                              >
                                <span className="text-sm">{tpl.icon}</span> {tpl.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Single image upload */}
                        {(!s.layout ||
                          s.layout === "text-only" ||
                          s.layout === "image-top" ||
                          s.layout === "image-left" ||
                          s.layout === "image-right") && (
                          <div>
                            <label
                              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: "var(--txt3)" }}
                            >
                              Section Image
                            </label>
                            <div className="flex items-start gap-2">
                              <Input
                                value={s.image || ""}
                                onChange={(e) =>
                                  updateContentField("sections", i, "image", e.target.value)
                                }
                                placeholder="https://res.cloudinary.com/.../image.webp"
                              />
                              <label
                                className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all"
                                style={{
                                  background: "var(--bg)",
                                  border: "1px solid var(--border)",
                                  color: "var(--txt2)",
                                }}
                              >
                                {uploading ? "..." : "Upload"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSectionImageUpload(e, i)}
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                            </div>
                            {s.image && (
                              <Image
                                src={s.image}
                                alt={`Section ${i + 1}`}
                                width={400}
                                height={128}
                                className="mt-2 max-h-32 w-full rounded-lg border border-[var(--border)] object-cover"
                              />
                            )}
                          </div>
                        )}

                        {/* Multi-image (grid/comparison layouts) */}
                        {(s.layout === "image-grid-2" ||
                          s.layout === "image-grid-3" ||
                          s.layout === "image-grid-4" ||
                          s.layout === "comparison") && (
                          <div>
                            <label
                              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: "var(--txt3)" }}
                            >
                              Grid Images
                            </label>
                            <div className="mb-2 flex items-center gap-2">
                              <label
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all"
                                style={{
                                  background: "var(--bg)",
                                  border: "1px solid var(--border)",
                                  color: "var(--txt2)",
                                }}
                              >
                                <ImageIcon size={12} /> Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleSectionMultiImageUpload(e, i)}
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                              <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                                {(s.images || []).length} image(s)
                              </span>
                            </div>
                            {(s.images || []).length > 0 && (
                              <div className="mb-2 space-y-1.5">
                                {(s.images || []).map((url: string, imgIdx: number) => (
                                  <div key={imgIdx} className="flex items-center gap-2">
                                    <Input
                                      value={url}
                                      onChange={(e) => {
                                        setForm((prev: any) => {
                                          const content = { ...prev.content };
                                          const arr = [...(content.sections || [])];
                                          const imgs = [...(arr[i].images || [])];
                                          imgs[imgIdx] = e.target.value;
                                          arr[i] = { ...arr[i], images: imgs };
                                          content.sections = arr;
                                          return { ...prev, content };
                                        });
                                      }}
                                      placeholder={`Image ${imgIdx + 1} URL`}
                                    />
                                    <button
                                      onClick={() => removeSectionImage(i, imgIdx)}
                                      className="flex-shrink-0 cursor-pointer border-none bg-transparent text-[#DC2626]"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setForm((prev: any) => {
                                  const content = { ...prev.content };
                                  const arr = [...(content.sections || [])];
                                  arr[i] = { ...arr[i], images: [...(arr[i].images || []), ""] };
                                  content.sections = arr;
                                  return { ...prev, content };
                                });
                              }}
                              className="cursor-pointer border-none bg-transparent text-[10px] font-medium text-[#2563EB] hover:underline"
                            >
                              + Add Image URL
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQs */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-syne text-[15px] font-bold" style={{ color: "var(--txt)" }}>
                      FAQs
                    </h3>
                    <button
                      onClick={() => addContentItem("faqs")}
                      className="cursor-pointer border-none bg-transparent text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      + Add FAQ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.content.faqs.map((f: any, i: number) => (
                      <div
                        key={i}
                        className="space-y-2 rounded-xl border p-3"
                        style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: "var(--txt3)" }}
                          >
                            FAQ {i + 1}
                          </span>
                          <button
                            onClick={() => removeContentItem("faqs", i)}
                            className="cursor-pointer border-none bg-transparent text-[11px] font-medium text-[#DC2626] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <Input
                          value={f.q}
                          onChange={(e) => updateContentField("faqs", i, "q", e.target.value)}
                          placeholder="Question"
                        />
                        <Input
                          value={f.a}
                          onChange={(e) => updateContentField("faqs", i, "a", e.target.value)}
                          placeholder="Answer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Internal Links */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-syne text-[15px] font-bold" style={{ color: "var(--txt)" }}>
                      Internal Links
                    </h3>
                    <button
                      onClick={() => addContentItem("internalLinks")}
                      className="cursor-pointer border-none bg-transparent text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      + Add Link
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.content.internalLinks.map((l: any, i: number) => (
                      <div
                        key={i}
                        className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2"
                        style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
                      >
                        <Input
                          value={l.text}
                          onChange={(e) =>
                            updateContentField("internalLinks", i, "text", e.target.value)
                          }
                          placeholder="Link text"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={l.href}
                            onChange={(e) =>
                              updateContentField("internalLinks", i, "href", e.target.value)
                            }
                            placeholder="e.g. /services"
                          />
                          <button
                            onClick={() => removeContentItem("internalLinks", i)}
                            className="flex-shrink-0 cursor-pointer border-none bg-transparent text-[#DC2626]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div>
                  <h3
                    className="mb-3 font-syne text-[15px] font-bold"
                    style={{ color: "var(--txt)" }}
                  >
                    Bottom CTA
                  </h3>
                  <div
                    className="grid gap-2 rounded-xl border p-3 sm:grid-cols-3"
                    style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
                  >
                    <Input
                      value={form.content.cta.text}
                      onChange={(e) =>
                        setForm((prev: any) => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            cta: { ...prev.content.cta, text: e.target.value },
                          },
                        }))
                      }
                      placeholder="CTA text"
                    />
                    <Input
                      value={form.content.cta.href}
                      onChange={(e) =>
                        setForm((prev: any) => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            cta: { ...prev.content.cta, href: e.target.value },
                          },
                        }))
                      }
                      placeholder="e.g. /contact"
                    />
                    <Input
                      value={form.content.cta.label}
                      onChange={(e) =>
                        setForm((prev: any) => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            cta: { ...prev.content.cta, label: e.target.value },
                          },
                        }))
                      }
                      placeholder="Button label"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 flex items-center gap-2 rounded-b-2xl border-t border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <Button
                variant="grad"
                size="md"
                onClick={handleSave}
                disabled={saving}
                leftIcon={
                  saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />
                }
              >
                {saving ? "Saving..." : "Save Post"}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowPreview(true)}
                leftIcon={<Play size={15} />}
              >
                Preview
              </Button>
              <Button variant="ghost" size="md" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ────────────────────────────────────────── */}
      {showPreview && form && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 my-4 w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border2)] bg-[var(--bg)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-2 py-1 text-xs font-semibold text-[#F97316]">
                  Preview
                </span>
                <span className="text-xs text-[var(--txt3)]">
                  Post preview — close to continue editing
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                leftIcon={<X size={14} />}
              >
                Close
              </Button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <BlogContent post={formToBlogPost()} showBack={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
