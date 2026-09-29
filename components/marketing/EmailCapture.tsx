"use client";

import { useState } from "react";
import { X, Download, Mail } from "lucide-react";
import { toast } from "sonner";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "email_capture_banner" }),
      });
      if (res.ok) {
        setDone(true);
        toast.success("Guide sent! Check your inbox.");
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 md:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#2563EB] p-7 text-center shadow-xl sm:p-10">
          {/* Glow */}
          <div className="pointer-events-none absolute -right-[10%] -top-[20%] h-[250px] w-[250px] rounded-full bg-[#A78BFA] opacity-15 blur-3xl" />

          <div className="relative z-10">
            {done ? (
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <Download size={24} className="text-white" />
                </div>
                <h3 className="mb-2 font-syne text-xl font-bold text-white sm:text-2xl">
                  Guide Sent!
                </h3>
                <p className="text-sm text-white/70">
                  Check {email} for your free Embroidery File Preparation Guide.
                </p>
              </div>
            ) : (
              <>
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Download size={12} /> Free Download
                </span>

                <h2 className="mb-2 font-syne text-2xl font-bold leading-[1.15] text-white sm:text-3xl">
                  Get Our{" "}
                  <span className="bg-gradient-to-r from-[#FBBF24] to-[#F97316] bg-clip-text text-transparent">
                    Embroidery File Preparation Guide
                  </span>
                </h2>

                <p className="mx-auto mb-5 max-w-md text-sm text-white/70">
                  Tips for preparing artwork, choosing formats, avoiding common mistakes — plus
                  portfolio samples and promotions.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mx-auto flex max-w-md flex-col gap-2.5 sm:flex-row"
                >
                  <div className="relative flex-1">
                    <Mail
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-9 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#7C3AED] transition-all hover:bg-[#F5F3FF] active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Get Free Guide"}
                  </button>
                </form>

                <p className="mt-3 text-[11px] text-white/40">
                  No spam. Unsubscribe anytime. Guide + occasional tips & promos.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
