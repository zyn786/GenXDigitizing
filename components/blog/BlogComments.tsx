"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, Check, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export default function BlogComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/${slug}/comments`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      setError("Name and comment are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_name: name.trim(), author_email: email.trim(), content: body.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      setSubmitted(true);
      setName("");
      setEmail("");
      setBody("");
    } catch (e: any) {
      setError(e.message || "Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-12 pt-8 border-t border-[var(--border)]">
      <h3 className="font-syne font-bold text-lg mb-1 text-[var(--txt)]">
        Comments {comments.length > 0 && <span className="text-[var(--txt3)] text-sm font-normal">({comments.length})</span>}
      </h3>
      <p className="text-xs text-[var(--txt3)] mb-6">Share your thoughts. Comments are reviewed before publishing.</p>

      {/* Existing comments */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[var(--txt3)]" /></div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-8">
          {comments.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-xs font-bold">
                  {c.author_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-[var(--txt)]">{c.author_name}</span>
                <span className="text-[10px] text-[var(--txt3)] flex items-center gap-1">
                  <Clock size={10} /> {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-[var(--txt2)] leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Comment form */}
      {submitted ? (
        <div className="p-5 rounded-xl bg-[#16A34A]/5 border border-[#16A34A]/15 text-center">
          <div className="w-10 h-10 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto mb-2">
            <Check size={18} />
          </div>
          <p className="text-sm font-semibold text-[#16A34A] mb-1">Thank you!</p>
          <p className="text-xs text-[var(--txt3)]">Your comment has been submitted for review.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name *"
              required
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional, never shown)"
              type="email"
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your comment... *"
            rows={3}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--txt)] p-3 resize-y placeholder:text-[var(--txt3)] focus:outline-none focus:border-[#2563EB]/40 focus:ring-1 focus:ring-[#2563EB]/20"
          />
          {error && <p className="text-xs text-[#DC2626]">{error}</p>}
          <Button type="submit" variant="grad" size="sm" disabled={submitting} rightIcon={submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}>
            {submitting ? "Submitting..." : "Post Comment"}
          </Button>
        </form>
      )}
    </div>
  );
}
