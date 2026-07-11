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
  "General", "Digitizing 101", "Vector Art", "Patches",
  "Tutorials", "Industry News", "Case Studies",
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
    const published = posts.filter(p => p.published).length;
    const drafts = posts.filter(p => !p.published).length;
    const uniqueCategories = [...new Set(posts.map(p => p.category).filter(Boolean))];
    return { total: posts.length, published, drafts, categories: uniqueCategories.length };
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const mq = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
      const ms = statusFilter === "all" || (statusFilter === "published" ? p.published : !p.published);
      const mc = categoryFilter === "all" || p.category === categoryFilter;
      return mq && ms && mc;
    });
  }, [posts, search, statusFilter, categoryFilter]);

  // Unique categories from posts
  const usedCategories = useMemo(() => [...new Set(posts.map(p => p.category).filter(Boolean))], [posts]);

  function formToBlogPost(): BlogPostType {
    if (!form) return {} as BlogPostType;
    const kw = typeof form.keywords === "string"
      ? form.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : form.keywords || [];
    return {
      slug: form.slug,
      title: form.title,
      description: form.description,
      date: new Date().toISOString().split("T")[0],
      category: form.category || "General",
      readTime: "6 min read",
      keywords: kw,
      hero: { emoji: form.emoji || "📝", color: form.accentColor || "#2563EB", image: form.heroImage || undefined },
      sections: form.content?.sections || [],
      faqs: form.content?.faqs || [],
      internalLinks: form.content?.internalLinks || [],
      cta: form.content?.cta || { text: "Get a Free Quote", href: "/contact", label: "Upload Design" },
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
      if (url) { updateField("heroImage", url); setMessage({ type: "success", text: "Image uploaded!" }); }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally { setUploading(false); }
  }

  async function handleSectionImageUpload(e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) { updateContentField("sections", sectionIndex, "image", url); setMessage({ type: "success", text: "Section image uploaded!" }); }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally { setUploading(false); }
  }

  async function handleSectionMultiImageUpload(e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) {
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
        arr[sectionIndex] = { ...arr[sectionIndex], images: [...(arr[sectionIndex].images || []), ...urls] };
        content.sections = arr;
        return { ...prev, content };
      });
      setMessage({ type: "success", text: `${urls.length} image(s) uploaded!` });
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally { setUploading(false); }
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
    } finally { setLoading(false); }
  }

  useEffect(() => { loadPosts(); }, []);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await fetch("/api/admin/blog/comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch { /* silent */ }
    finally { setLoadingComments(false); }
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
    setShowModal(false); setForm(null); setEditingId(null);
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
      if (path === "sections") arr.push({ heading: "", body: "", image: "", images: [], layout: "text-only" });
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
    setSaving(true); setMessage(null);
    try {
      const payload = {
        ...form,
        content: form.content,
        keywords: typeof form.keywords === "string"
          ? form.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
          : form.keywords,
      };
      if (!editingId) {
        const res = await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Post created!" });
      } else {
        const res = await fetch("/api/admin/blog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editingId }) });
        if (!res.ok) throw new Error((await res.json()).error);
        setMessage({ type: "success", text: "Post updated!" });
      }
      closeModal(); loadPosts();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Save failed" });
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMessage({ type: "success", text: "Post deleted" }); loadPosts();
    } catch { setMessage({ type: "error", text: "Delete failed" }); }
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
    } catch { setMessage({ type: "error", text: "Toggle failed" }); }
  }

  async function handleSeed() {
    if (!confirm("Import 4 pre-written blog posts? Existing posts with matching slugs will be skipped.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: `${data.imported || 0} posts imported!` }); loadPosts();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Import failed" });
    } finally { setSaving(false); }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1300px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-syne font-bold text-xl sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
          Blog Management
        </h2>
        <p className="text-xs sm:text-[13px] mt-1" style={{ color: "var(--txt3)" }}>
          Create, edit, and manage blog content
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
        {[
          { label: "Total Posts", val: stats.total, icon: <FileText size={16} />, ci: 0 },
          { label: "Published", val: stats.published, icon: <Globe size={16} />, ci: 1 },
          { label: "Drafts", val: stats.drafts, icon: <Pencil size={16} />, ci: 2 },
          { label: "Categories", val: stats.categories, icon: <Hash size={16} />, ci: 3 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-3.5 sm:p-4 border"
            style={{
              background: [
                "rgba(37,99,235,0.06)", "rgba(16,185,129,0.06)",
                "rgba(249,115,22,0.06)", "rgba(139,92,246,0.06)",
              ][s.ci],
              borderColor: [
                "rgba(37,99,235,0.2)", "rgba(16,185,129,0.2)",
                "rgba(249,115,22,0.2)", "rgba(139,92,246,0.2)",
              ][s.ci],
            }}
          >
            <div className="flex items-center gap-2 mb-1"
              style={{ color: ["#2563EB", "#16A34A", "#F97316", "#7C3AED"][s.ci] }}>
              {s.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: "var(--txt)" }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
            <input
              type="text" placeholder="Search posts..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] border outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
              style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt)" }}
            />
          </div>
          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="rounded-xl px-3 py-2 text-[13px] border outline-none cursor-pointer"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt)" }}>
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          {/* Category filter */}
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-[13px] border outline-none cursor-pointer"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: "var(--txt)" }}>
            <option value="all">All Categories</option>
            {usedCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSeed} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span className="hidden sm:inline ml-1.5">Seed Posts</span>
          </Button>
          <Button variant="grad" size="md" leftIcon={<Plus size={15} />} onClick={openCreate}>
            New Post
          </Button>
        </div>
      </div>

      {/* Tabs: Posts | Comments */}
      <div className="flex items-center gap-0 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
        {[
          { key: "posts", label: "Posts", count: posts.length },
          { key: "comments", label: "Comments", count: comments.length },
        ].map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key as any); if (t.key === "comments") loadComments(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all bg-transparent cursor-pointer ${
              activeTab === t.key
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[var(--txt3)] hover:text-[var(--txt)]"
            }`}>
            {t.key === "posts" ? <FileText size={14} /> : <MessageSquare size={14} />}
            {t.label}
            {t.count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: activeTab === t.key ? "rgba(37,99,235,0.12)" : "var(--elevated)",
                  color: activeTab === t.key ? "#2563EB" : "var(--txt3)",
                }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 flex items-center gap-2 text-[13px] p-3 rounded-xl ${
          message.type === "success"
            ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
            : "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20"
        }`}>
          {message.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}

      {/* ── Posts Tab ──────────────────────────────────────────── */}
      {activeTab === "posts" && (
        <>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--txt3)]" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 rounded-2xl bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center text-4xl mx-auto mb-5">📝</div>
              <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-2">No Blog Posts Yet</h2>
              <p className="text-sm text-[var(--txt2)] max-w-sm mx-auto mb-6">Create your first post manually, or import 4 pre-written articles optimized for SEO.</p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button variant="grad" size="md" leftIcon={<Plus size={15} />} onClick={openCreate}>Create New Post</Button>
                <Button variant="outline" size="md" onClick={handleSeed} disabled={saving}>
                  {saving ? "Importing..." : "Import 4 Sample Posts"}
                </Button>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-sm text-[var(--txt2)]">No posts match your filters.</p>
              <button onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }}
                className="text-sm text-[#2563EB] hover:underline mt-2 bg-transparent border-none cursor-pointer">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredPosts.map((post) => (
                <div key={post.id}
                  className="group rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  {/* Card hero area */}
                  <div className="relative h-24 sm:h-32 flex items-center justify-center"
                    style={{
                      background: post.heroImage
                        ? `url(${post.heroImage}) center/cover`
                        : `linear-gradient(135deg, ${post.accentColor}22, ${post.accentColor}44)`,
                    }}>
                    {!post.heroImage && (
                      <span className="text-4xl">{post.emoji || "📝"}</span>
                    )}
                    {/* Status badge */}
                    <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: post.published ? "rgba(22,163,74,0.12)" : "var(--elevated)",
                        color: post.published ? "#16A34A" : "var(--txt3)",
                        border: `1px solid ${post.published ? "rgba(22,163,74,0.25)" : "var(--border2)"}`,
                      }}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {/* Card body */}
                  <div className="p-3.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                        style={{ background: `${post.accentColor}15`, color: post.accentColor }}>
                        {post.category || "General"}
                      </span>
                    </div>
                    <h3 className="font-syne font-bold text-sm leading-snug mb-1 line-clamp-2" style={{ color: "var(--txt)" }}>
                      {post.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--txt3)" }}>
                      {post.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] mb-3" style={{ color: "var(--txt3)" }}>
                      <Calendar size={10} />
                      <span>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="opacity-40">|</span>
                      <span className="font-mono">{post.slug}</span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                      <button onClick={() => handleTogglePublish(post)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-[var(--elevated)] bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--txt2)" }}
                        title={post.published ? "Unpublish" : "Publish"}>
                        {post.published ? <><EyeOff size={12} /> <span className="hidden sm:inline">Unpublish</span></> : <><Eye size={12} /> <span className="hidden sm:inline">Publish</span></>}
                      </button>
                      <button onClick={() => openEdit(post)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-[var(--elevated)] bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--txt2)" }}>
                        <Pencil size={12} /> <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button onClick={() => handleDelete(post.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-red-50 hover:text-[#DC2626] bg-transparent border-none cursor-pointer ml-auto"
                        style={{ color: "var(--txt3)" }}>
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
            <div className="flex justify-center py-12"><Loader2 size={18} className="animate-spin text-[var(--txt3)]" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-xl bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center text-2xl mx-auto mb-3">💬</div>
              <p className="text-sm text-[var(--txt2)]">No comments yet.</p>
              <p className="text-xs text-[var(--txt3)] mt-1">Comments will appear here once readers start engaging.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {comments.map((c: any) => (
                <div key={c.id} className="p-4 rounded-2xl border transition-all"
                  style={{
                    background: c.is_approved ? "var(--surface)" : "rgba(249,115,22,0.04)",
                    borderColor: c.is_approved ? "var(--border)" : "rgba(249,115,22,0.2)",
                  }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold" style={{ color: "var(--txt)" }}>{c.author_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: c.is_approved ? "rgba(22,163,74,0.1)" : "rgba(249,115,22,0.1)",
                            color: c.is_approved ? "#16A34A" : "#F97316",
                          }}>
                          {c.is_approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--txt3)" }}>
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}
                        <span className="font-medium">{c.blog_posts?.title || "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!c.is_approved ? (
                        <button onClick={() => handleApproveComment(c.id, true)}
                          className="p-1.5 rounded-lg hover:bg-[#16A34A]/10 text-[var(--txt3)] hover:text-[#16A34A] bg-transparent border-none cursor-pointer"
                          title="Approve"><Check size={14} /></button>
                      ) : (
                        <button onClick={() => handleApproveComment(c.id, false)}
                          className="p-1.5 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)] bg-transparent border-none cursor-pointer"
                          title="Unapprove"><EyeOff size={14} /></button>
                      )}
                      <button onClick={() => handleDeleteComment(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--txt3)] hover:text-[#DC2626] bg-transparent border-none cursor-pointer"
                        title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--txt2)" }}>{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Editor Modal ──────────────────────────────────────────── */}
      {showModal && form && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-4xl my-4 bg-[var(--surface)] border border-[var(--border2)] rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface)] rounded-t-2xl">
              <div>
                <h2 className="font-syne font-bold text-lg">{editingId ? "Edit Post" : "New Post"}</h2>
                {editingId && <p className="text-[11px] text-[var(--txt3)] mt-0.5">Editing: {form.slug || "untitled"}</p>}
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-[var(--elevated)] text-[var(--txt3)] bg-transparent border-none cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form body — split into left (meta) and right (content) on desktop */}
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="p-4 sm:p-5 space-y-5">
                {/* Meta fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                    <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="my-post-slug" />
                    <Input label="Category" value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="e.g. Digitizing 101" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Title" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Post title" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Description (SEO)" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Meta description for search engines" />
                  </div>
                  <Input label="Emoji" value={form.emoji} onChange={(e) => updateField("emoji", e.target.value)} placeholder="📝" />
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-[0.04em] mb-1.5 text-[var(--txt3)]">Accent Color</label>
                    <input type="color" value={form.accentColor} onChange={(e) => updateField("accentColor", e.target.value)}
                      className="w-full h-10 rounded-lg border border-[var(--border)] cursor-pointer" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Keywords (comma-separated)" value={Array.isArray(form.keywords) ? form.keywords.join(", ") : form.keywords}
                      onChange={(e) => updateField("keywords", e.target.value)} placeholder="keyword1, keyword2, keyword3" />
                  </div>
                  {/* Hero Image */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.04em] mb-1.5 text-[var(--txt3)]">Hero Image</label>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Input value={form.heroImage || ""} onChange={(e) => updateField("heroImage", e.target.value)}
                          placeholder="https://res.cloudinary.com/.../image.webp" />
                        <p className="text-[10px] text-[var(--txt3)] mt-1">Recommended: 1200×630px, 16:9, WebP</p>
                      </div>
                      <label className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                        style={{ background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--txt2)" }}>
                        {uploading ? "Uploading..." : "Upload"}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </label>
                    </div>
                    {form.heroImage && (
                      <Image src={form.heroImage} alt="Preview" className="mt-2 w-full max-h-36 object-cover rounded-xl border border-[var(--border)]" />
                    )}
                  </div>
                  {/* Publish toggle */}
                  <div className="sm:col-span-2 flex items-center gap-2.5">
                    <input type="checkbox" id="published" checked={form.published} onChange={(e) => updateField("published", e.target.checked)}
                      className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer" />
                    <label htmlFor="published" className="text-sm text-[var(--txt2)] cursor-pointer select-none">Published (visible on site)</label>
                  </div>
                </div>

                <hr style={{ borderColor: "var(--border)" }} />

                {/* Sections */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-syne font-bold text-[15px]" style={{ color: "var(--txt)" }}>Content Sections</h3>
                    <button onClick={() => addContentItem("sections")}
                      className="text-xs text-[#2563EB] hover:underline font-semibold bg-transparent border-none cursor-pointer">
                      + Add Section
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.content.sections.map((s: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border space-y-3"
                        style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--txt2)" }}>
                            Section {i + 1}
                          </span>
                          <button onClick={() => removeContentItem("sections", i)}
                            className="text-[11px] text-[#DC2626] hover:underline font-medium bg-transparent border-none cursor-pointer">
                            Remove
                          </button>
                        </div>

                        <Input value={s.heading} onChange={(e) => updateContentField("sections", i, "heading", e.target.value)}
                          placeholder="Section heading" />

                        <textarea value={s.body}
                          onChange={(e) => updateContentField("sections", i, "body", e.target.value)}
                          placeholder="Section body — supports **bold**, *italic*, tables, bullet/numbered lists"
                          rows={5}
                          className="w-full rounded-xl border p-3 text-sm resize-y outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                          style={{ background: "var(--bg)", borderColor: "var(--border2)", color: "var(--txt)" }}
                        />

                        {/* Layout picker */}
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--txt3)" }}>
                            Layout
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {LAYOUT_OPTIONS.map((tpl) => (
                              <button key={tpl.value} type="button"
                                onClick={() => updateContentField("sections", i, "layout", tpl.value)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border transition-all bg-transparent cursor-pointer ${
                                  (s.layout || "text-only") === tpl.value
                                    ? "border-[#2563EB] bg-[#2563EB]/8 text-[#2563EB]"
                                    : "border-[var(--border)] text-[var(--txt3)] hover:border-[var(--border3)] hover:text-[var(--txt)]"
                                }`}>
                                <span className="text-sm">{tpl.icon}</span> {tpl.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Single image upload */}
                        {(!s.layout || s.layout === "text-only" || s.layout === "image-top" || s.layout === "image-left" || s.layout === "image-right") && (
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt3)" }}>
                              Section Image
                            </label>
                            <div className="flex items-start gap-2">
                              <Input value={s.image || ""} onChange={(e) => updateContentField("sections", i, "image", e.target.value)}
                                placeholder="https://res.cloudinary.com/.../image.webp" />
                              <label className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-semibold cursor-pointer transition-all"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--txt2)" }}>
                                {uploading ? "..." : "Upload"}
                                <input type="file" accept="image/*" onChange={(e) => handleSectionImageUpload(e, i)} className="hidden" disabled={uploading} />
                              </label>
                            </div>
                            {s.image && (
                              <Image src={s.image} alt={`Section ${i + 1}`}
                                className="mt-2 w-full max-h-32 object-cover rounded-lg border border-[var(--border)]" />
                            )}
                          </div>
                        )}

                        {/* Multi-image (grid/comparison layouts) */}
                        {(s.layout === "image-grid-2" || s.layout === "image-grid-3" || s.layout === "image-grid-4" || s.layout === "comparison") && (
                          <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--txt3)" }}>
                              Grid Images
                            </label>
                            <div className="flex items-center gap-2 mb-2">
                              <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-semibold cursor-pointer transition-all"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--txt2)" }}>
                                <ImageIcon size={12} /> Upload
                                <input type="file" accept="image/*" multiple onChange={(e) => handleSectionMultiImageUpload(e, i)} className="hidden" disabled={uploading} />
                              </label>
                              <span className="text-[10px]" style={{ color: "var(--txt3)" }}>
                                {(s.images || []).length} image(s)
                              </span>
                            </div>
                            {(s.images || []).length > 0 && (
                              <div className="space-y-1.5 mb-2">
                                {(s.images || []).map((url: string, imgIdx: number) => (
                                  <div key={imgIdx} className="flex items-center gap-2">
                                    <Input value={url} onChange={(e) => {
                                      setForm((prev: any) => {
                                        const content = { ...prev.content };
                                        const arr = [...(content.sections || [])];
                                        const imgs = [...(arr[i].images || [])];
                                        imgs[imgIdx] = e.target.value;
                                        arr[i] = { ...arr[i], images: imgs };
                                        content.sections = arr;
                                        return { ...prev, content };
                                      });
                                    }} placeholder={`Image ${imgIdx + 1} URL`} />
                                    <button onClick={() => removeSectionImage(i, imgIdx)}
                                      className="flex-shrink-0 text-[#DC2626] bg-transparent border-none cursor-pointer">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button onClick={() => {
                              setForm((prev: any) => {
                                const content = { ...prev.content }; const arr = [...(content.sections || [])];
                                arr[i] = { ...arr[i], images: [...(arr[i].images || []), ""] };
                                content.sections = arr; return { ...prev, content };
                              });
                            }}
                              className="text-[10px] text-[#2563EB] hover:underline font-medium bg-transparent border-none cursor-pointer">
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-syne font-bold text-[15px]" style={{ color: "var(--txt)" }}>FAQs</h3>
                    <button onClick={() => addContentItem("faqs")}
                      className="text-xs text-[#2563EB] hover:underline font-semibold bg-transparent border-none cursor-pointer">
                      + Add FAQ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.content.faqs.map((f: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl border space-y-2"
                        style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--txt3)" }}>FAQ {i + 1}</span>
                          <button onClick={() => removeContentItem("faqs", i)}
                            className="text-[11px] text-[#DC2626] hover:underline font-medium bg-transparent border-none cursor-pointer">Remove</button>
                        </div>
                        <Input value={f.q} onChange={(e) => updateContentField("faqs", i, "q", e.target.value)} placeholder="Question" />
                        <Input value={f.a} onChange={(e) => updateContentField("faqs", i, "a", e.target.value)} placeholder="Answer" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Internal Links */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-syne font-bold text-[15px]" style={{ color: "var(--txt)" }}>Internal Links</h3>
                    <button onClick={() => addContentItem("internalLinks")}
                      className="text-xs text-[#2563EB] hover:underline font-semibold bg-transparent border-none cursor-pointer">
                      + Add Link
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.content.internalLinks.map((l: any, i: number) => (
                      <div key={i} className="grid sm:grid-cols-2 gap-2 p-3 rounded-xl border"
                        style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                        <Input value={l.text} onChange={(e) => updateContentField("internalLinks", i, "text", e.target.value)} placeholder="Link text" />
                        <div className="flex gap-2">
                          <Input value={l.href} onChange={(e) => updateContentField("internalLinks", i, "href", e.target.value)} placeholder="e.g. /services" />
                          <button onClick={() => removeContentItem("internalLinks", i)}
                            className="flex-shrink-0 text-[#DC2626] bg-transparent border-none cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div>
                  <h3 className="font-syne font-bold text-[15px] mb-3" style={{ color: "var(--txt)" }}>Bottom CTA</h3>
                  <div className="grid sm:grid-cols-3 gap-2 p-3 rounded-xl border"
                    style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                    <Input value={form.content.cta.text} onChange={(e) => setForm((prev: any) => ({
                      ...prev, content: { ...prev.content, cta: { ...prev.content.cta, text: e.target.value } }
                    }))} placeholder="CTA text" />
                    <Input value={form.content.cta.href} onChange={(e) => setForm((prev: any) => ({
                      ...prev, content: { ...prev.content, cta: { ...prev.content.cta, href: e.target.value } }
                    }))} placeholder="e.g. /contact" />
                    <Input value={form.content.cta.label} onChange={(e) => setForm((prev: any) => ({
                      ...prev, content: { ...prev.content, cta: { ...prev.content.cta, label: e.target.value } }
                    }))} placeholder="Button label" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 flex items-center gap-2 p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface)] rounded-b-2xl">
              <Button variant="grad" size="md" onClick={handleSave} disabled={saving}
                leftIcon={saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}>
                {saving ? "Saving..." : "Save Post"}
              </Button>
              <Button variant="outline" size="md" onClick={() => setShowPreview(true)} leftIcon={<Play size={15} />}>
                Preview
              </Button>
              <Button variant="ghost" size="md" onClick={closeModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ────────────────────────────────────────── */}
      {showPreview && form && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 w-full max-w-5xl my-4 bg-[var(--bg)] border border-[var(--border2)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">Preview</span>
                <span className="text-xs text-[var(--txt3)]">Post preview — close to continue editing</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} leftIcon={<X size={14} />}>Close</Button>
            </div>
            <div className="overflow-y-auto max-h-[80vh]">
              <BlogContent post={formToBlogPost()} showBack={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
