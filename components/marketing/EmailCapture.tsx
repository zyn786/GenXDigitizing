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
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
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
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#2563EB] p-7 sm:p-10 text-center shadow-xl">
          {/* Glow */}
          <div className="absolute -top-[20%] -right-[10%] w-[250px] h-[250px] rounded-full bg-[#A78BFA] opacity-15 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {done ? (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Download size={24} className="text-white" />
                </div>
                <h3 className="font-syne font-bold text-xl sm:text-2xl text-white mb-2">Guide Sent!</h3>
                <p className="text-white/70 text-sm">Check {email} for your free Embroidery File Preparation Guide.</p>
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-white border border-white/20 mb-4">
                  <Download size={12} /> Free Download
                </span>

                <h2 className="font-syne font-bold text-2xl sm:text-3xl text-white mb-2 leading-[1.15]">
                  Get Our{" "}
                  <span className="bg-gradient-to-r from-[#FBBF24] to-[#F97316] bg-clip-text text-transparent">
                    Embroidery File Preparation Guide
                  </span>
                </h2>

                <p className="text-white/70 text-sm max-w-md mx-auto mb-5">
                  Tips for preparing artwork, choosing formats, avoiding common mistakes — plus portfolio samples and promotions.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                  <div className="flex-1 relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl bg-white text-[#7C3AED] font-bold text-sm hover:bg-[#F5F3FF] active:scale-[0.98] transition-all disabled:opacity-60 flex-shrink-0"
                  >
                    {submitting ? "Sending…" : "Get Free Guide"}
                  </button>
                </form>

                <p className="text-white/40 text-[11px] mt-3">No spam. Unsubscribe anytime. Guide + occasional tips & promos.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
