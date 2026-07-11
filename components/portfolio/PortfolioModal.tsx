"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioItem } from "./data";
import Image from "next/image";

export function PortfolioModal({
  item,
  onClose,
}: {
  item: PortfolioItem | null;
  onClose: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Lock body scroll
  useEffect(() => {
    if (!item) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [item]);

  const handleClose = useCallback(() => {
    setActiveIdx(0);
    onClose();
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!item || !mounted) return null;

  const images = item.images || [];
  const total = images.length;
  const current = images[activeIdx];
  const accent = item.accent || item.category?.color || "#2563EB";

  function goPrev() { setActiveIdx((p) => (p === 0 ? total - 1 : p - 1)); }
  function goNext() { setActiveIdx((p) => (p === total - 1 ? 0 : p + 1)); }

  function handleTouchStart(e: React.TouchEvent) { setTouchStart(e.touches[0].clientX); }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null || total <= 1) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) { diff > 0 ? goPrev() : goNext(); }
    setTouchStart(null);
  }

  const modal = (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] bg-black/95  flex flex-col"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        onClick={handleClose}
      >
        {/* ── Top bar (in flow) ────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 min-w-0">
            {item.category && (
              <span
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.04em] px-2.5 py-1 rounded-full"
                style={{ background: `${accent}30`, color: "white", border: `1px solid ${accent}50` }}
              >
                {item.category.emoji} {item.category.name}
              </span>
            )}
            {total > 1 && (
              <span className="text-white/50 text-xs font-semibold tabular-nums">{activeIdx + 1}/{total}</span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Image area — tap black space to close ────── */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden px-4 sm:px-12"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {current && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image
                src={current.url}
                alt={current.alt || item.title}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Desktop arrows */}
              {total > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="hidden sm:flex absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20text-white hover:bg-white/20 items-center justify-center transition-colors "
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="hidden sm:flex absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20text-white hover:bg-white/20 items-center justify-center transition-colors "
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          )}
        </motion.div>

        {/* ── Bottom info (in flow) ───────────────────── */}
        <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-5 pt-3 sm:pt-4">
          {/* Title + tags */}
          <div className="text-center max-w-lg mx-auto mb-3">
            <p className="text-white text-sm sm:text-base font-syne font-bold leading-tight mb-2">
              {item.title}
            </p>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="text-[10px] sm:text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/8 text-white/60 border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* Case-study fields */}
            {(item.industry || item.challenge || item.solution || item.result) && (
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-left">
                {item.industry && (
                  <div className="bg-white/8 rounded-lg px-3 py-2">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 font-bold mb-0.5">Industry</p>
                    <p className="text-[11px] sm:text-xs text-white/80 leading-snug">{item.industry}</p>
                  </div>
                )}
                {item.challenge && (
                  <div className="bg-white/8 rounded-lg px-3 py-2">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-red-300 font-bold mb-0.5">Challenge</p>
                    <p className="text-[11px] sm:text-xs text-white/80 leading-snug">{item.challenge}</p>
                  </div>
                )}
                {item.solution && (
                  <div className="bg-white/8 rounded-lg px-3 py-2">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-blue-300 font-bold mb-0.5">Solution</p>
                    <p className="text-[11px] sm:text-xs text-white/80 leading-snug">{item.solution}</p>
                  </div>
                )}
                {item.result && (
                  <div className="bg-white/8 rounded-lg px-3 py-2">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-green-300 font-bold mb-0.5">Result</p>
                    <p className="text-[11px] sm:text-xs text-white/80 leading-snug">{item.result}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto justify-center pb-1">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                  className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                    i === activeIdx
                      ? "ring-2 ring-white scale-105 opacity-100"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image src={img.thumbnailUrl || img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
