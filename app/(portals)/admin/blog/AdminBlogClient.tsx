// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import BlogContent from "@/components/blog/BlogContent";
import type { BlogPost as BlogPostType } from "@/lib/blog-data";

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

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const results = await res.json();
      if (results.length > 0) {
        updateField("heroImage", results[0].url);
        setMessage({ type: "success", text: "Image uploaded!" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSectionImageUpload(e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const results = await res.json();
      if (results.length > 0) {
        updateContentField("sections", sectionIndex, "image", results[0].url);
        setMessage({ type: "success", text: "Section image uploaded!" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSectionMultiImageUpload(e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("files", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const results = await res.json();
        if (results.length > 0) urls.push(results[0].url);
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

  useEffect(() => { loadPosts(); }, []);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await fetch("/api/admin/blog/comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // silent
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
    setSaving(true);
    setMessage(null);
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
    if (!confirm("Import 4 pre-written blog posts (What Is Embroidery Digitizing, Manual vs Auto, File Formats, JPG to Vector)? Existing posts with matching slugs will be skipped.")) return;
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

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-end mb-6">
        <Button variant="grad" size="md" leftIcon={<Plus size={15} />} onClick={openCreate}>
          New Post
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 flex items-center gap-2 text-sm p-3 rounded-xl ${message.type === "success" ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20" : "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20"}`}>
          {message.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[var(--txt3)]" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 rounded-2xl bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center text-4xl mx-auto mb-5">📝</div>
          <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-2">No Blog Posts Yet</h2>
          <p className="text-sm text-[var(--txt2)] max-w-sm mx-auto mb-6">Create your first post manually, or import 4 pre-written articles optimized for SEO.</p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Button variant="grad" size="md" leftIcon={<Plus size={15} />} onClick={openCreate}>
              Create New Post
            </Button>
            <Button variant="outline" size="md" onClick={handleSeed} disabled={saving}>
              {saving ? "Importing..." : "Import 4 Sample Posts"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border3)] transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{post.emoji || "📝"}</span>
                  <h3 className="font-syne font-bold text-sm truncate">{post.title}</h3>
                  {post.published ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] font-medium flex items-center gap-1"><Eye size={10} /> Published</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--border)] text-[var(--txt3)] font-medium flex items-center gap-1"><EyeOff size={10} /> Draft</span>
                  )}
                </div>
                <p className="text-xs text-[var(--txt2)] truncate">{post.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--txt3)]">
                  <span>{post.category}</span>
                  <span>{post.slug}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleTogglePublish(post)} className="p-2 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)]" title={post.published ? "Unpublish" : "Publish"}>
                  {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => openEdit(post)} className="p-2 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)]" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg hover:bg-red-50 text-[var(--txt3)] hover:text-[#DC2626]" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Moderation */}
      {posts.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--txt2)] hover:text-[var(--txt)] transition-colors"
          >
            <span className={`transition-transform ${showComments ? "rotate-90" : ""}`}>▸</span>
            Comments {comments.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--elevated)] border border-[var(--border)]">{comments.length}</span>}
          </button>
          {showComments && (
            <div className="mt-3 space-y-3">
              {loadingComments ? (
                <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-[var(--txt3)]" /></div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-[var(--txt3)] py-4 text-center">No comments yet.</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className={`p-3 rounded-xl border ${c.is_approved ? "bg-[var(--surface)] border-[var(--border)]" : "bg-[#F97316]/5 border-[#F97316]/20"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-[var(--txt)]">{c.author_name}</span>
                          <span className="text-[10px] text-[var(--txt3)]">{new Date(c.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-[var(--txt3)] truncate">on {c.blog_posts?.title || "—"}</span>
                          {c.is_approved ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A]">Approved</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">Pending</span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--txt2)] leading-relaxed">{c.content}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!c.is_approved && (
                          <button onClick={() => handleApproveComment(c.id, true)} className="p-1.5 rounded-lg hover:bg-[#16A34A]/10 text-[var(--txt3)] hover:text-[#16A34A]" title="Approve">
                            <Check size={14} />
                          </button>
                        )}
                        {c.is_approved && (
                          <button onClick={() => handleApproveComment(c.id, false)} className="p-1.5 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)]" title="Unapprove">
                            <EyeOff size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDeleteComment(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--txt3)] hover:text-[#DC2626]" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Editor */}
      {showModal && form && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative z-10 w-full max-w-3xl my-4 bg-[var(--surface)] border border-[var(--border2)] rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--surface)] rounded-t-2xl">
              <h2 className="font-syne font-bold text-lg">{editingId ? "Edit Post" : "New Post"}</h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)]"><X size={18} /></button>
            </div>

            {/* Form body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="my-post-slug" />
                <Input label="Title" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Post title" />
                <div className="sm:col-span-2">
                  <Input label="Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="SEO description" />
                </div>
                <Input label="Category" value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="e.g. Digitizing 101" />
                <Input label="Keywords (comma separated)" value={Array.isArray(form.keywords) ? form.keywords.join(", ") : form.keywords} onChange={(e) => updateField("keywords", e.target.value)} placeholder="keyword1, keyword2" />
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--txt2)] mb-2">Hero Image</label>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Input value={form.heroImage || ""} onChange={(e) => updateField("heroImage", e.target.value)} placeholder="https://res.cloudinary.com/.../image.webp" />
                      <p className="text-[10px] text-[var(--txt3)] mt-1">Recommended: 1200×630px, 16:9 ratio, WebP format</p>
                    </div>
                    <label className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--elevated)] border border-[var(--border)] text-[var(--txt2)] hover:text-[var(--txt)] hover:border-[var(--border3)] cursor-pointer transition-all">
                      {uploading ? "Uploading..." : "Upload"}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                  {form.heroImage && (
                    <img src={form.heroImage} alt="Preview" className="mt-2 w-full max-h-32 object-cover rounded-xl border border-[var(--border)]" />
                  )}
                </div>
                <Input label="Emoji" value={form.emoji} onChange={(e) => updateField("emoji", e.target.value)} placeholder="📝" />
                <div>
                  <label className="block text-xs font-medium text-[var(--txt2)] mb-1">Color</label>
                  <input type="color" value={form.accentColor} onChange={(e) => updateField("accentColor", e.target.value)} className="w-full h-10 rounded-lg border border-[var(--border)] cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="published" checked={form.published} onChange={(e) => updateField("published", e.target.checked)} className="rounded" />
                <label htmlFor="published" className="text-sm text-[var(--txt2)]">Published (visible on site)</label>
              </div>

              {/* Sections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-syne font-bold text-sm">Sections</h3>
                  <button onClick={() => addContentItem("sections")} className="text-xs text-[#2563EB] hover:underline font-medium">+ Add</button>
                </div>
                <div className="space-y-3">
                  {form.content.sections.map((s: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--elevated)] border border-[var(--border)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--txt3)]">Section {i + 1}</span>
                        <button onClick={() => removeContentItem("sections", i)} className="text-[#DC2626] text-xs hover:underline">Remove</button>
                      </div>
                      <Input value={s.heading} onChange={(e) => updateContentField("sections", i, "heading", e.target.value)} placeholder="Section heading" />
                      <textarea value={s.body} onChange={(e) => updateContentField("sections", i, "body", e.target.value)} placeholder="Section body (supports **bold**, *italic*, tables, bullet/numbered lists)" rows={4} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--txt)] p-3 resize-y" />

                      {/* Layout template selector */}
                      <div>
                        <label className="block text-[10px] font-medium text-[var(--txt3)] mb-1">Layout Template</label>
                        <select
                          value={s.layout || "text-only"}
                          onChange={(e) => updateContentField("sections", i, "layout", e.target.value)}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--txt)] p-2.5"
                        >
                          <option value="text-only">Text Only</option>
                          <option value="image-top">Image Top (single, full-width)</option>
                          <option value="image-grid-2">Image Grid — 2 Columns</option>
                          <option value="image-grid-3">Image Grid — 3 Columns</option>
                        </select>
                      </div>

                      {/* Single image (for image-top layout) */}
                      {(s.layout === "image-top" || !s.layout || s.layout === "text-only") && (
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--txt3)] mb-1">Section Image</label>
                          <div className="flex items-start gap-2">
                            <Input value={s.image || ""} onChange={(e) => updateContentField("sections", i, "image", e.target.value)} placeholder="https://res.cloudinary.com/.../image.webp" />
                            <label className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--txt2)] hover:text-[var(--txt)] cursor-pointer transition-all">
                              {uploading ? "..." : "Upload"}
                              <input type="file" accept="image/*" onChange={(e) => handleSectionImageUpload(e, i)} className="hidden" disabled={uploading} />
                            </label>
                          </div>
                          {s.image && (
                            <img src={s.image} alt={`Section ${i + 1}`} className="mt-2 w-full max-h-28 object-cover rounded-lg border border-[var(--border)]" />
                          )}
                        </div>
                      )}

                      {/* Multi-image (for grid layouts) */}
                      {(s.layout === "image-grid-2" || s.layout === "image-grid-3") && (
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--txt3)] mb-1">Grid Images</label>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--txt2)] hover:text-[var(--txt)] cursor-pointer transition-all">
                              {uploading ? "..." : "Upload Images"}
                              <input type="file" accept="image/*" multiple onChange={(e) => handleSectionMultiImageUpload(e, i)} className="hidden" disabled={uploading} />
                            </label>
                            <span className="text-[10px] text-[var(--txt3)]">{(s.images || []).length} image(s) — paste URLs or upload</span>
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
                                  <button onClick={() => removeSectionImage(i, imgIdx)} className="flex-shrink-0 text-[#DC2626]"><Trash2 size={14} /></button>
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
                            className="text-[10px] text-[#2563EB] hover:underline font-medium"
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-syne font-bold text-sm">FAQs</h3>
                  <button onClick={() => addContentItem("faqs")} className="text-xs text-[#2563EB] hover:underline font-medium">+ Add</button>
                </div>
                <div className="space-y-2">
                  {form.content.faqs.map((f: any, i: number) => (
                    <div key={i} className="p-2 rounded-xl bg-[var(--elevated)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--txt3)]">FAQ {i + 1}</span>
                        <button onClick={() => removeContentItem("faqs", i)} className="text-[#DC2626] text-[10px] hover:underline">Remove</button>
                      </div>
                      <Input value={f.q} onChange={(e) => updateContentField("faqs", i, "q", e.target.value)} placeholder="Question" />
                      <Input value={f.a} onChange={(e) => updateContentField("faqs", i, "a", e.target.value)} placeholder="Answer" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-syne font-bold text-sm">Internal Links</h3>
                  <button onClick={() => addContentItem("internalLinks")} className="text-xs text-[#2563EB] hover:underline font-medium">+ Add</button>
                </div>
                <div className="space-y-2">
                  {form.content.internalLinks.map((l: any, i: number) => (
                    <div key={i} className="grid sm:grid-cols-2 gap-2 p-2 rounded-xl bg-[var(--elevated)]">
                      <Input value={l.text} onChange={(e) => updateContentField("internalLinks", i, "text", e.target.value)} placeholder="Link text" />
                      <div className="flex gap-2">
                        <Input value={l.href} onChange={(e) => updateContentField("internalLinks", i, "href", e.target.value)} placeholder="e.g. /services" />
                        <button onClick={() => removeContentItem("internalLinks", i)} className="text-[#DC2626] flex-shrink-0"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div>
                <h3 className="font-syne font-bold text-sm mb-2">Bottom CTA</h3>
                <div className="grid sm:grid-cols-3 gap-2 p-2 rounded-xl bg-[var(--elevated)]">
                  <Input value={form.content.cta.text} onChange={(e) => setForm((prev: any) => ({ ...prev, content: { ...prev.content, cta: { ...prev.content.cta, text: e.target.value } } }))} placeholder="CTA text" />
                  <Input value={form.content.cta.href} onChange={(e) => setForm((prev: any) => ({ ...prev, content: { ...prev.content, cta: { ...prev.content.cta, href: e.target.value } } }))} placeholder="e.g. /contact" />
                  <Input value={form.content.cta.label} onChange={(e) => setForm((prev: any) => ({ ...prev, content: { ...prev.content, cta: { ...prev.content.cta, label: e.target.value } } }))} placeholder="Button label" />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 flex items-center gap-2 p-4 sm:p-6 border-t border-[var(--border)] bg-[var(--surface)] rounded-b-2xl">
              <Button variant="grad" size="md" onClick={handleSave} disabled={saving} leftIcon={saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}>
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

      {/* Preview Modal */}
      {showPreview && form && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative z-10 w-full max-w-5xl my-4 bg-[var(--bg)] border border-[var(--border2)] rounded-2xl shadow-2xl overflow-hidden">
            {/* Preview toolbar */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">Preview</span>
                <span className="text-xs text-[var(--txt3)]">See how your post looks before publishing</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} leftIcon={<X size={14} />}>
                  Close
                </Button>
              </div>
            </div>
            {/* Preview content */}
            <div className="overflow-y-auto max-h-[80vh]">
              <BlogContent post={formToBlogPost()} showBack={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
