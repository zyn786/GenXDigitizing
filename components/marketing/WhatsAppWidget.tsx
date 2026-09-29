"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { SITE_INFO } from "@/lib/site-config";

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Hide on mobile for home & upload pages (sticky bottom nav conflicts)
  const isHome = pathname === "/home" || pathname === "/";
  const isUpload = pathname === "/upload";
  const hideMobile = isHome || isUpload;

  return (
    <div
      className={`fixed bottom-8 right-4 z-[60] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 ${hideMobile ? "hidden sm:flex" : ""}`}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="w-[280px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-2xl sm:w-[320px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[#25D366] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">genxdigitizing</p>
                  <p className="text-[11px] text-white/80">Typically replies within 5 minutes</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-white transition-colors hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="mb-3 rounded-xl bg-[#F0F2F5] p-3">
                <p className="text-[13px] leading-relaxed text-[var(--txt)]">
                  👋 Get a free quote on WhatsApp!
                </p>
                <p className="mt-1 text-[12px] text-[var(--txt2)]">
                  Share your design — we reply with pricing in minutes.
                </p>
              </div>

              <a
                href={`https://wa.me/${SITE_INFO.whatsapp}?text=Hi! I'd like to know more about your embroidery digitizing services.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#22C55E]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Start Chat
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-none bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_24px_rgba(37,211,102,0.45)] active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        {open ? (
          <X size={24} />
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
      </button>

      {/* Reply time indicator when closed */}
      {!open && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-none absolute bottom-0 right-14 rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-lg sm:right-16"
        >
          <p className="whitespace-nowrap text-[11px] font-semibold text-[var(--txt)]">
            💬 Get Free Quote
          </p>
        </motion.div>
      )}
    </div>
  );
}
