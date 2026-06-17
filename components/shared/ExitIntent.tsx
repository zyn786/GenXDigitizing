"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getVisitorState, markVisited } from "@/lib/visitor";

function getReturnVisitor(): string | null {
  const state = getVisitorState();
  if (state.isNew) {
    markVisited();
    return null;
  }
  const d = new Date(state.visitedAt!);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 30 && days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (days < 1) return "today";
  return null;
}

export function ExitIntent() {
  const [show, setShow] = useState(false);
  const [returnMsg, setReturnMsg] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    setReturnMsg(getReturnVisitor());
  }, []);

  useEffect(() => {
    if (fired.current || dismissed) return;
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && !fired.current) {
        fired.current = true;
        setShow(true);
      }
    }
    // Mobile: show on scroll past 70%
    function onScroll() {
      if (fired.current) return;
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (pct > 0.7) {
        fired.current = true;
        setTimeout(() => setShow(true), 2000);
      }
    }
    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dismissed]);

  // Return visitor banner — shown inline at top of page
  if (returnMsg && !dismissed) {
    return (
      <div className="fixed top-[100px] lg:top-[104px] inset-x-0 z-[45] bg-white border-b border-gray-200">
        <div className="max-w-[800px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-gray-700">
            👋 Welcome back! You visited {returnMsg}. Ready to continue?
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/upload">
              <Button variant="grad" size="sm" rightIcon={<ArrowRight size={12} />}>Upload Design</Button>
            </Link>
            <button onClick={() => setDismissed(true)} className="p-1.5 rounded-lg hover:bg-[var(--elevated)] text-[var(--txt3)]"><X size={14} /></button>
          </div>
        </div>
      </div>
    );
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[440px] w-full text-center shadow-2xl relative animate-fade-in-up">
        <button onClick={() => setDismissed(true)} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X size={16} /></button>

        <div className="text-4xl mb-4">⏱️</div>
        <h3 className="font-syne font-bold text-xl sm:text-2xl mb-2">Before you go…</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          Get a <strong className="text-gray-800">free digitizing quote</strong> in under 60 seconds. No payment required.
        </p>

        <div className="space-y-3">
          <Link href="/upload" className="block">
            <Button variant="grad" size="lg" className="w-full" rightIcon={<ArrowRight size={16} />}>
              Upload Design — Free Quote
            </Button>
          </Link>
          <a
            href="https://wa.me/18302102135"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3.5 rounded-xl bg-[#25D366] text-white font-bold text-[14px] no-underline active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(37,211,102,0.2)]"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            Quick WhatsApp Quote
          </a>
          <button onClick={() => setDismissed(true)} className="text-[12px] text-gray-400 underline hover:text-gray-600">
            No thanks, I&apos;ll decide later
          </button>
        </div>
      </div>
    </div>
  );
}
