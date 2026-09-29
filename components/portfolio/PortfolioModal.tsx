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
    return () => {
      document.body.style.overflow = original;
    };
  }, [item]);

  const handleClose = useCallback(() => {
    setActiveIdx(0);
    onClose();
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item || !mounted) return null;

  const images = item.images || [];
  const total = images.length;
  const current = images[activeIdx];
  const accent = item.accent || item.category?.color || "#2563EB";

  function goPrev() {
    setActiveIdx((p) => (p === 0 ? total - 1 : p - 1));
  }
  function goNext() {
    setActiveIdx((p) => (p === total - 1 ? 0 : p + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null || total <= 1) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goPrev() : goNext();
    }
    setTouchStart(null);
  }

  const modal = (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex flex-col bg-black/95"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        onClick={handleClose}
      >
        {/* ── Top bar (in flow) ────────────────────────── */}
        <div className="flex flex-shrink-0 items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2">
            {item.category && (
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.04em] sm:text-[11px]"
                style={{
                  background: `${accent}30`,
                  color: "white",
                  border: `1px solid ${accent}50`,
                }}
              >
                {item.category.emoji} {item.category.name}
              </span>
            )}
            {total > 1 && (
              <span className="text-xs font-semibold tabular-nums text-white/50">
                {activeIdx + 1}/{total}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="hover:bg-white/20transition-colors rounded-full p-2 text-white/70 hover:text-white"
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
          className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-4 sm:px-12"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {current && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image
                src={current.url}
                alt={current.alt || item.title}
                width={1200}
                height={900}
                className="h-auto max-h-full w-auto max-w-full rounded-lg object-contain"
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Desktop arrows */}
              {total > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                    className="bg-white/20text-white absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-white/20 sm:left-5 sm:flex"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                    className="bg-white/20text-white absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-white/20 sm:right-5 sm:flex"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          )}
        </motion.div>

        {/* ── Bottom info (in flow) ───────────────────── */}
        <div className="flex-shrink-0 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
          {/* Title + tags */}
          <div className="mx-auto mb-3 max-w-lg text-center">
            <p className="mb-2 font-syne text-sm font-bold leading-tight text-white sm:text-base">
              {item.title}
            </p>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {item.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-white/8 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/60 sm:text-[11px]"
                  >
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
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-white/40 sm:text-[10px]">
                      Industry
                    </p>
                    <p className="text-[11px] leading-snug text-white/80 sm:text-xs">
                      {item.industry}
                    </p>
                  </div>
                )}
                {item.challenge && (
                  <div className="bg-white/8 rounded-lg px-3 py-2">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300 sm:text-[10px]">
                      Challenge
                    </p>
                    <p className="text-[11px] leading-snug text-white/80 sm:text-xs">
                      {item.challenge}
                    </p>
                  </div>
                )}
                {item.solution && (
                  <div className="bg-white/8 rounded-lg px-3 py-2">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300 sm:text-[10px]">
                      Solution
                    </p>
                    <p className="text-[11px] leading-snug text-white/80 sm:text-xs">
                      {item.solution}
                    </p>
                  </div>
                )}
                {item.result && (
                  <div className="bg-white/8 rounded-lg px-3 py-2">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-green-300 sm:text-[10px]">
                      Result
                    </p>
                    <p className="text-[11px] leading-snug text-white/80 sm:text-xs">
                      {item.result}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {total > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(i);
                  }}
                  className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 sm:h-14 sm:w-14 ${
                    i === activeIdx
                      ? "scale-105 opacity-100 ring-2 ring-white"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image
                    src={img.thumbnailUrl || img.url}
                    alt=""
                    width={80}
                    height={60}
                    className="object-cover"
                  />
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
