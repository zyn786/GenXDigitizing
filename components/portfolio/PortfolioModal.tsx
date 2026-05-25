"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PortfolioItem } from "./data";

interface PortfolioModalProps {
  item: PortfolioItem | null;
  onClose: () => void;
}

/* ── Justified Gallery ─────────────────────────────────── */
function buildRows(images: PortfolioItem["images"], containerWidth: number, targetRowHeight: number) {
  const rows: { image: PortfolioItem["images"][0]; width: number; height: number }[][] = [];
  let currentRow: typeof rows[0] = [];
  let rowAspectSum = 0;

  for (const img of images) {
    const ar = (img.width && img.height) ? img.width / img.height : 1;
    currentRow.push({ image: img, width: 0, height: 0 });
    rowAspectSum += ar;

    if (rowAspectSum >= containerWidth / targetRowHeight || currentRow.length >= 3) {
      const rowHeight = containerWidth / rowAspectSum;
      for (const item of currentRow) {
        const imgAr = (item.image.width && item.image.height) ? item.image.width / item.image.height : 1;
        item.width = rowHeight * imgAr;
        item.height = rowHeight;
      }
      rows.push(currentRow);
      currentRow = [];
      rowAspectSum = 0;
    }
  }

  // Remaining images in last row
  if (currentRow.length > 0) {
    const rowHeight = containerWidth / rowAspectSum;
    for (const item of currentRow) {
      const imgAr = (item.image.width && item.image.height) ? item.image.width / item.image.height : 1;
      item.width = rowHeight * imgAr;
      item.height = rowHeight;
    }
    rows.push(currentRow);
  }

  return rows;
}

function JustifiedGallery({ images, accent }: { images: PortfolioItem["images"]; accent: string }) {
  const rows = useMemo(() => buildRows(images, 800, 200), [images]);

  return (
    <div className="space-y-2">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-2 justify-center">
          {row.map((item, ii) => (
            <div
              key={ii}
              className="relative rounded-xl overflow-hidden border flex-shrink-0 group"
              style={{ borderColor: `${accent}20` }}
            >
              <img
                src={item.image.url}
                alt={item.image.alt || `Image ${ri}-${ii + 1}`}
                width={item.width}
                height={item.height}
                className="block object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, var(--surface), var(--elevated))`,
                }}
                loading="lazy"
              />

              {item.image.isBefore && (
                <span
                  className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full z-10"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
                >
                  Before
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PortfolioModal({ item, onClose }: PortfolioModalProps) {

  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  const category = item?.category;
  const accent = item?.accent || category?.color || "#2563EB";
  const emoji = category?.emoji || "✦";

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[95vw] sm:max-w-4xl max-h-[92vh] overflow-y-auto
              bg-[var(--surface)] border border-[var(--border2)] rounded-2xl shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center
                bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt2)]
                hover:text-[var(--txt)] hover:border-[var(--border3)] transition-all"
            >
              <X size={18} className="sm:size-4" />
            </button>

            {/* Header */}
            <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)]">
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                    border: `1px solid ${accent}30`,
                    boxShadow: `0 0 20px ${accent}15`,
                  }}
                >
                  {item.images[0] && !item.images[0].isBefore ? (
                    <img
                      src={item.images[0].url}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    emoji
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                    {category && (
                      <span
                        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full"
                        style={{
                          background: `${accent}15`,
                          color: accent,
                          border: `1px solid ${accent}30`,
                        }}
                      >
                        {category.name}
                      </span>
                    )}
                    <span className="text-[9px] sm:text-[10px] text-[var(--txt3)] uppercase tracking-wider">
                      {item.turnaround}
                    </span>
                    {item.clientName && (
                      <span className="text-[9px] sm:text-[10px] text-[var(--txt3)]">Client: {item.clientName}</span>
                    )}
                  </div>
                  <h2
                    className="font-jakarta font-extrabold text-lg sm:text-xl md:text-2xl mb-1.5 sm:mb-2 bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(135deg, var(--txt), ${accent})`,
                    }}
                  >
                    {item.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--txt2)] leading-relaxed">{item.description}</p>

                  {/* Quick specs */}
                  <div className="flex gap-2 sm:gap-3 flex-wrap mt-3 sm:mt-4">
                    {item.stitches && item.stitches > 0 && (
                      <span className="text-[11px] sm:text-xs text-[var(--txt2)] bg-[var(--elevated)] px-2 py-0.5 rounded-md">
                        {item.stitches.toLocaleString()} stitches
                      </span>
                    )}
                    <span className="text-[11px] sm:text-xs text-[var(--txt2)] bg-[var(--elevated)] px-2 py-0.5 rounded-md">
                      {item.colors} colors
                    </span>
                    <span className="text-[11px] sm:text-xs text-[var(--txt2)] bg-[var(--elevated)] px-2 py-0.5 rounded-md">
                      {item.designSize}
                    </span>
                    <span className="text-[11px] sm:text-xs text-[var(--txt2)] bg-[var(--elevated)] px-2 py-0.5 rounded-md">
                      {item.outputFormat}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Image gallery — collage */}
            <div className="p-4 sm:p-6 md:p-8">
              <h3 className="font-jakarta font-bold text-xs sm:text-sm text-[var(--txt)] flex items-center gap-2 mb-3 sm:mb-4">
                <Sparkles size={14} style={{ color: accent }} />
                Project Images
                <span className="text-[var(--txt3)] font-normal text-xs">({item.images.length})</span>
              </h3>

              {/* Mobile: horizontal scroll row */}
              <div className="flex sm:hidden gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
                {item.images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0 w-[80vw] max-w-[320px] snap-start rounded-xl overflow-hidden border"
                    style={{ borderColor: `${accent}20` }}>
                    <img
                      src={img.url}
                      alt={img.alt || `Image ${i + 1}`}
                      className="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                    />
                    {img.isBefore && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                        Before
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {/* Desktop: Justified Gallery */}
              <div className="hidden sm:block">
                <JustifiedGallery images={item.images} accent={accent} />
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        background: `${accent}0a`,
                        color: accent,
                        borderColor: `${accent}20`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 sm:p-6 md:p-8 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-2 sm:gap-3">
              <div>
                <p className="text-[11px] sm:text-xs text-[var(--txt3)]">
                  Starting from{" "}
                  <strong className="text-[#16A34A]">$7</strong> with free revisions · free formats · free rush delivery
                </p>
              </div>
              <Link href="/client/new-order">
                <Button variant="grad" size="md" onClick={onClose} className="shadow-[0_2px_12px_rgba(37,99,235,0.2)]">
                  Start Your Order →
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
