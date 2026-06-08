"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ArrowRight,
  Check,
  Clock,
  Palette,
  Ruler,
  Download,
  Zap,
  Shield,
  Layers,
  Scissors,
  GripHorizontal,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";
import type { PortfolioItem } from "./data";

/* ─────────────────────────────────────────────────────────────
   Before/After Image Comparison Slider
   ──────────────────────────────────────────────────────────── */

function BeforeAfterSlider({
  beforeImg,
  afterImg,
  accent,
}: {
  beforeImg: { url: string; alt?: string };
  afterImg: { url: string; alt?: string };
  accent: string;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const handleMove = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(pct);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.touches[0].clientX, rect);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-syne font-bold text-xs text-[var(--txt)] flex items-center gap-1.5">
          <Sparkles size={13} style={{ color: accent }} />
          Before / After Comparison
        </h4>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="text-[10px] text-[var(--txt3)] hover:text-[var(--txt)] transition-colors flex items-center gap-1"
        >
          {showLabels ? <EyeOff size={11} /> : <Eye size={11} />}
          {showLabels ? "Hide labels" : "Show labels"}
        </button>
      </div>

      <div
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden cursor-col-resize select-none border"
        style={{ borderColor: `${accent}20` }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
      >
        {/* After image (full, underneath) */}
        <img
          src={afterImg.url}
          alt={afterImg.alt || "After digitizing"}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before image (clipped to slider position) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
          <img
            src={beforeImg.url}
            alt={beforeImg.alt || "Before digitizing"}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${100 / (sliderPos / 100)}%` }}
            draggable={false}
          />
        </div>

        {/* Slider handle line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        />

        {/* Handle knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-xl border-2 flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%`, borderColor: accent }}
        >
          <div className="flex gap-[3px]">
            <span className="w-[2px] h-3 rounded-full" style={{ background: accent }} />
            <span className="w-[2px] h-3 rounded-full" style={{ background: accent }} />
          </div>
        </div>

        {/* Labels */}
        {showLabels && (
          <>
            <span
              className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#DC2626]/90 text-white backdrop-blur-sm"
            >
              Before
            </span>
            <span
              className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#16A34A]/90 text-white backdrop-blur-sm"
            >
              After
            </span>
          </>
        )}

        {/* Drag hint */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] text-white/60 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full sm:hidden">
          <GripHorizontal size={11} />
          Drag to compare
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sew-Out Photo Gallery (small inline)
   ──────────────────────────────────────────────────────────── */

function SewOutSection({
  images,
  accent,
}: {
  images: PortfolioItem["images"];
  accent: string;
}) {
  const sewOutImages = images.filter((img) => !img.isBefore);
  if (sewOutImages.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-syne font-bold text-xs text-[var(--txt)] flex items-center gap-1.5">
        <Scissors size={13} style={{ color: accent }} />
        Sew-Out &amp; Production Photos
        <span className="text-[var(--txt3)] font-normal text-[11px]">({sewOutImages.length})</span>
      </h4>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex sm:grid sm:grid-cols-3 gap-2 overflow-x-auto sm:overflow-visible scrollbar-none snap-x snap-mandatory pb-1">
        {sewOutImages.map((img, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 w-[70vw] sm:w-auto max-w-[220px] sm:max-w-none snap-start rounded-lg overflow-hidden border aspect-[4/3]"
            style={{ borderColor: `${accent}15` }}
          >
            <img
              src={img.url}
              alt={img.alt || `Production photo ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Technical Specs Grid
   ──────────────────────────────────────────────────────────── */

function TechSpecs({ item, accent }: { item: PortfolioItem; accent: string }) {
  const specs = [
    ...(item.stitches && item.stitches > 0 ? [{ icon: Layers, label: "Stitch Count", value: `${(item.stitches / 1000).toFixed(1)}k stitches` }] : []),
    { icon: Palette, label: "Colors", value: `${item.colors} colors` },
    { icon: Ruler, label: "Design Size", value: item.designSize || "Custom" },
    { icon: Download, label: "Output Format", value: item.outputFormat },
    { icon: Clock, label: "Turnaround", value: item.turnaround || "12–24h" },
    { icon: Zap, label: "Complexity", value: item.stitches && item.stitches > 20000 ? "Complex" : item.stitches && item.stitches > 8000 ? "Standard" : "Simple" },
  ];

  return (
    <div className="space-y-2.5">
      <h4 className="font-syne font-bold text-xs text-[var(--txt)] flex items-center gap-1.5">
        <Layers size={13} style={{ color: accent }} />
        Technical Details
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div
              key={spec.label}
              className="flex items-center gap-2 p-2.5 rounded-xl border"
              style={{
                background: `${accent}06`,
                borderColor: `${accent}18`,
              }}
            >
              <Icon size={14} style={{ color: accent }} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-[var(--txt3)] uppercase tracking-wider">{spec.label}</p>
                <p className="text-[11px] font-semibold text-[var(--txt)] truncate">{spec.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Image Gallery (Non-Before/After)
   ──────────────────────────────────────────────────────────── */

function ImageGallery({ images, accent }: { images: PortfolioItem["images"]; accent: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const normalImages = images.filter((img) => !img.isBefore);

  if (normalImages.length === 0) return null;

  const current = normalImages[activeIdx];

  return (
    <div className="space-y-2">
      <h4 className="font-syne font-bold text-xs text-[var(--txt)] flex items-center gap-1.5">
        <Sparkles size={13} style={{ color: accent }} />
        Project Images
        <span className="text-[var(--txt3)] font-normal text-[11px]">({normalImages.length})</span>
      </h4>

      {/* Main viewer */}
      <div
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden border"
        style={{ borderColor: `${accent}18` }}
      >
        <img
          src={current.url}
          alt={current.alt || "Project image"}
          className="w-full h-full object-cover"
        />

        {/* Nav arrows */}
        {normalImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx((prev) => (prev === 0 ? normalImages.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all backdrop-blur-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActiveIdx((prev) => (prev === normalImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all backdrop-blur-sm"
            >
              <ChevronRight size={16} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {normalImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{
                    background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.4)",
                    transform: i === activeIdx ? "scale(1.3)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Counter badge */}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm">
          {activeIdx + 1} / {normalImages.length}
        </span>
      </div>

      {/* Thumbnail strip */}
      {normalImages.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {normalImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all"
              style={{
                borderColor: i === activeIdx ? accent : "var(--border2)",
                opacity: i === activeIdx ? 1 : 0.6,
              }}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN MODAL
   ═════════════════════════════════════════════════════════════ */

export function PortfolioModal({ item, onClose }: { item: PortfolioItem | null; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = item ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  if (!item) return null;

  const category = item.category;
  const accent = item.accent || category?.color || "#2563EB";
  const emoji = category?.emoji || "✦";

  const beforeImg = item.images?.find((i: any) => i.isBefore);
  const afterImg = item.images?.find((i: any) => !i.isBefore);
  const hasComparison = !!(beforeImg && afterImg);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-[98vw] sm:max-w-3xl lg:max-w-4xl max-h-[94vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border2)] rounded-2xl sm:rounded-3xl shadow-2xl"
        >
          {/* ── Close button ────────────────────────────────── */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt2)] hover:text-[var(--txt)] hover:border-[var(--border3)] transition-all"
          >
            <X size={16} className="sm:size-[18px]" />
          </button>

          {/* ── Header ──────────────────────────────────────── */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--border)]">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Thumbnail icon */}
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                  border: `1px solid ${accent}30`,
                  boxShadow: `0 0 20px ${accent}15`,
                }}
              >
                {afterImg ? (
                  <img src={afterImg.url} alt="" className="w-full h-full object-cover" />
                ) : item.images[0] ? (
                  <img src={item.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  emoji
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  {category && (
                    <span
                      className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
                    >
                      {category.name}
                    </span>
                  )}
                  {hasComparison && (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30">
                      Before / After
                    </span>
                  )}
                  <span
                    className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: "#16A34A12", color: "#16A34A", border: "1px solid #16A34A25" }}
                  >
                    <Check size={10} />
                    Quality Checked
                  </span>
                </div>

                <h2 className="font-syne font-bold text-lg sm:text-xl md:text-2xl mb-1.5" style={{ color: "var(--txt)" }}>
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--txt2)] leading-relaxed">{item.description}</p>

                {/* Client info */}
                <div className="flex items-center gap-3 mt-3 text-[11px] sm:text-xs">
                  {item.clientName && (
                    <span className="font-semibold text-[var(--txt)]">{item.clientName}</span>
                  )}
                  <span className="text-[var(--txt3)]">{item.turnaround}</span>
                  {item.stitches && item.stitches > 0 && (
                    <span className="text-[var(--txt3)]">{(item.stitches / 1000).toFixed(1)}k stitches</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Visual Content Body ─────────────────────────── */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {/* Before/After Slider (if applicable) */}
            {hasComparison && (
              <BeforeAfterSlider beforeImg={beforeImg!} afterImg={afterImg!} accent={accent} />
            )}

            {/* Standard Image Gallery (non-comparison images) */}
            {!hasComparison && item.images.length > 0 && (
              <ImageGallery images={item.images} accent={accent} />
            )}

            {/* Sew-Out Photos */}
            <SewOutSection images={item.images} accent={accent} />

            {/* Technical Specs */}
            <TechSpecs item={item} accent={accent} />

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2.5 py-1 rounded-full border"
                    style={{ background: `${accent}08`, color: accent, borderColor: `${accent}20` }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer CTA ──────────────────────────────────── */}
          <div className="p-4 sm:p-6 md:p-8 border-t border-[var(--border)]">
            {/* Trust bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-[var(--txt3)]">
              <span className="inline-flex items-center gap-1">
                <Star size={11} className="text-[#EAB308] fill-[#EAB308]" />
                {SITE_STATS.avgRating}/5 Rating
              </span>
              <span className="inline-flex items-center gap-1">
                <Shield size={11} className="text-[#16A34A]" />
                100% Guaranteed
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap size={11} className="text-[#F97316]" />
                Free Rush Delivery
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[11px] sm:text-xs text-[var(--txt3)]">
                  Starting from{" "}
                  <strong className="text-[#16A34A]">$7</strong> per design
                </p>
                <p className="text-[10px] text-[var(--txt3)]">
                  ♾️ Free revisions &bull; 🔄 Free formats &bull; ⚡ 3–24h delivery
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/contact" onClick={onClose}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Get Quote
                  </Button>
                </Link>
                <Link href="/client/new-order" onClick={onClose}>
                  <Button variant="grad" size="md" rightIcon={<ArrowRight size={13} />}>
                    Start Your Order
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
