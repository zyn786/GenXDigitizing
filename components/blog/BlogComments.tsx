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
        body: JSON.stringify({
          author_name: name.trim(),
          author_email: email.trim(),
          content: body.trim(),
        }),
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
    <div className="mt-12 border-t border-[var(--border)] pt-8">
      <h3 className="mb-1 font-syne text-lg font-bold text-[var(--txt)]">
        Comments{" "}
        {comments.length > 0 && (
          <span className="text-sm font-normal text-[var(--txt3)]">({comments.length})</span>
        )}
      </h3>
      <p className="mb-6 text-xs text-[var(--txt3)]">
        Share your thoughts. Comments are reviewed before publishing.
      </p>

      {/* Existing comments */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-[var(--txt3)]" />
        </div>
      ) : comments.length > 0 ? (
        <div className="mb-8 space-y-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
                  {c.author_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-[var(--txt)]">{c.author_name}</span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--txt3)]">
                  <Clock size={10} />{" "}
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--txt2)]">{c.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Comment form */}
      {submitted ? (
        <div className="rounded-xl border border-[#16A34A]/15 bg-[#16A34A]/5 p-5 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A]">
            <Check size={18} />
          </div>
          <p className="mb-1 text-sm font-semibold text-[#16A34A]">Thank you!</p>
          <p className="text-xs text-[var(--txt3)]">Your comment has been submitted for review.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
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
            className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--txt)] placeholder:text-[var(--txt3)] focus:border-[#2563EB]/40 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/20"
          />
          {error && <p className="text-xs text-[#DC2626]">{error}</p>}
          <Button
            type="submit"
            variant="grad"
            size="sm"
            disabled={submitting}
            rightIcon={
              submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />
            }
          >
            {submitting ? "Submitting..." : "Post Comment"}
          </Button>
        </form>
      )}
    </div>
  );
}
