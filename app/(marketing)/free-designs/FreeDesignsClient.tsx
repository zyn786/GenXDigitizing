"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, X, ChevronLeft, ChevronRight, Eye, Loader2, Check, Zap, Palette, Ruler, FileText } from "lucide-react";
import { toast } from "sonner";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { cn } from "@/lib/utils";
import type { FreeDesign } from "@/types";

// ── Helpers ──────────────────────────────────────────────────
function formatNumber(n: number) {
  return n.toLocaleString();
}

// ── Image Carousel (touch + mouse) ──────────────────────────
function ImageCarousel({
  images,
  onEnlarge,
}: {
  images: { url: string; alt?: string; thumbnailUrl?: string; blurhash?: string }[];
  onEnlarge: (index: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
  const touchStart = useRef<number>(0);
  const touchDelta = useRef<number>(0);

  const go = useCallback((dir: 1 | -1) => {
    setCurrent((c) => {
      const next = c + dir;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  }, [images.length]);

  useEffect(() => {
    setLoaded((prev) => {
      const next = new Set(prev);
      next.add(current);
      next.add((current + 1) % images.length);
      return next;
    });
  }, [current, images.length]);

  if (!images.length) {
    return (
      <div className="aspect-[4/3] md:aspect-[4/3] bg-gradient-to-br from-[var(--elevated)] to-[var(--elevated2)] rounded-2xl flex items-center justify-center">
        <span className="text-6xl md:text-5xl">🧵</span>
      </div>
    );
  }

  return (
    <div
      className="relative group/carousel aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--elevated)] cursor-pointer select-none isolate"
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchMove={(e) => { touchDelta.current = e.touches[0].clientX - touchStart.current; }}
      onTouchEnd={() => {
        if (Math.abs(touchDelta.current) > 50) {
          go(touchDelta.current > 0 ? -1 : 1);
        }
        touchDelta.current = 0;
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
          onClick={() => onEnlarge(current)}
        >
          {loaded.has(current) ? (
            <img
              src={images[current].url}
              alt={images[current].alt || "Design preview"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={images[current].thumbnailUrl || images[current].url}
                alt=""
                className="w-full h-full object-cover blur-lg scale-105"
                onLoad={() => setLoaded((prev) => new Set([...prev, current]))}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Desktop arrows (hover) */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
              bg-white/90 border border-white/40 items-center justify-center
              opacity-0 group-hover/carousel:opacity-100 translate-x-1 group-hover/carousel:translate-x-0
              transition-all duration-300 hover:shadow-md hover:scale-105"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
              bg-white/90 border border-white/40 items-center justify-center
              opacity-0 group-hover/carousel:opacity-100 -translate-x-1 group-hover/carousel:translate-x-0
              transition-all duration-300 hover:shadow-md hover:scale-105"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4 text-gray-800" />
          </button>
        </>
      )}

      {/* Zoom indicator (desktop only) */}
      <div className="hidden lg:block absolute top-3 right-3 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
          <Eye className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* Dots (desktop only) */}
      {images.length > 1 && (
        <div className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 18 : 6,
                height: 6,
                background: i === current
                  ? "linear-gradient(90deg, #2563EB, #F97316)"
                  : "rgba(255,255,255,0.65)",
                boxShadow: i === current ? "0 0 4px rgba(37,99,235,0.5)" : "0 0 0 1px rgba(0,0,0,0.15)",
              }}
              aria-label={`View image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe hint (mobile/tablet only) */}
      {images.length > 1 && (
        <div className="lg:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10">
          <span className="text-[10px] text-white/70 bg-black/50 px-2.5 py-0.5 rounded-full">
            swipe to see more
          </span>
        </div>
      )}
    </div>
  );
}

// ── Lightbox Modal ──────────────────────────────────────────
function Lightbox({
  images,
  current,
  onClose,
  onPrev,
  onNext,
}: {
  images: { url: string; alt?: string }[];
  current: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touchStart = useRef(0);
  const touchDelta = useRef(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95  p-4 sm:p-6"
      onClick={onClose}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchMove={(e) => { touchDelta.current = e.touches[0].clientX - touchStart.current; }}
      onTouchEnd={() => {
        if (Math.abs(touchDelta.current) > 60) {
          touchDelta.current > 0 ? onPrev() : onNext();
        }
        touchDelta.current = 0;
      }}
    >
      {/* Close (desktop only) */}
      <button
        onClick={onClose}
        className="hidden lg:flex absolute top-10 right-5 lg:top-12 lg:right-8 w-10 h-10 rounded-full
          bg-white/15 border border-white/30 items-center justify-center
          text-white hover:bg-white/30 transition-colors z-10"
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Desktop arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
              bg-white/20border border-white/25 items-center justify-center
              text-white hover:bg-white/25 transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
              bg-white/20border border-white/25 items-center justify-center
              text-white hover:bg-white/25 transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          src={images[current]?.url}
          alt={images[current]?.alt || "Design preview"}
          className="max-w-full max-h-[72vh] sm:max-h-[82vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </AnimatePresence>

      {/* Dots (desktop) + counter (all) */}
      <div className="mt-5 flex flex-col items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <div className="hidden lg:flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i > current) onNext();
                  else if (i < current) onPrev();
                }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  background: i === current
                    ? "linear-gradient(90deg, #2563EB, #F97316)"
                    : "rgba(255,255,255,0.4)",
                }}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}
        <span className="text-white/70 text-sm lg:text-xs font-medium">{current + 1} / {images.length}</span>
      </div>
    </motion.div>
  );
}

// ── Spec Pill ───────────────────────────────────────────────
function SpecPill({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 py-2 sm:py-2.5">
      <div
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12` }}
      >
        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color }} />
      </div>
      <div className="min-w-0 overflow-hidden">
        <div className="text-[10px] sm:text-[11px] text-[var(--txt3)] leading-tight font-medium tracking-wide uppercase truncate">
          {label}
        </div>
        <div className="text-xs sm:text-sm font-bold text-[var(--txt)] leading-tight truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Design Card ─────────────────────────────────────────────
function DesignCard({
  design,
  index,
}: {
  design: FreeDesign;
  index: number;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const openLightbox = (imgIdx: number) => {
    setLightboxIdx(imgIdx);
    setLightboxOpen(true);
  };

  const handleDownload = async () => {
    if (!design.downloadUrl) return;
    setDownloading(true);

    // Track download (non-blocking)
    fetch("/api/free-designs/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designId: design.id }),
    }).catch(() => {});

    // Trigger download
    window.open(design.downloadUrl, "_blank");
    setDownloaded(true);
      toast.success("Download started!", {
        description: `${design.title} — check your downloads folder.`,
      });
    setTimeout(() => setDownloaded(false), 3000);
    setDownloading(false);
  };

  const images = (design.images || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="group/card h-full flex flex-col bg-[var(--surface)]/90  rounded-2xl
            border border-[var(--border)] overflow-hidden w-full
            shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.02)]
            hover:shadow-[0_8px_30px_rgba(0,0,0,0.05),0_0_0_1px_rgba(37,99,235,0.08)]
            hover:border-[#2563EB]/20
            transition-all duration-400 ease-out"
        >
          {/* Image carousel */}
          <ImageCarousel images={images} onEnlarge={openLightbox} />

          {/* Content */}
          <div className="flex flex-col flex-1 p-4 sm:p-5">
            {/* Title + badge row */}
            <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="font-syne font-bold text-sm sm:text-base text-[var(--txt)] leading-snug line-clamp-2">
                {design.title}
              </h3>
              {design.downloadCount > 0 && (
                <span className="flex-shrink-0 text-[10px] text-[var(--txt3)] bg-[var(--elevated)] px-2 py-0.5 rounded-full border border-[var(--border2)] whitespace-nowrap">
                  {formatNumber(design.downloadCount)} dl
                </span>
              )}
            </div>

            {/* Specs — 2x2 grid on all sizes, clean icons */}
            <div className="grid grid-cols-2 gap-0.5 mb-3 sm:mb-4 -mx-1">
              <SpecPill icon={Zap} label="Stitches" value={formatNumber(design.stitchCount)} color="#2563EB" />
              <SpecPill icon={Palette} label="Colors" value={`${design.colors}`} color="#F97316" />
              <SpecPill icon={Ruler} label="Size" value={design.designSize} color="#16A34A" />
              <SpecPill
                icon={FileText}
                label="Formats"
                value={(design.formats || []).length
                  ? `${(design.formats || []).slice(0, 3).join(" · ")}${(design.formats || []).length > 3 ? " +" : ""}`
                  : "—"}
                color="#A855F7"
              />
            </div>

            {/* Machines — wrap chips */}
            {(design.machines || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mb-3 sm:mb-4">
                {(design.machines || []).map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center px-2 py-0.5 rounded-md
                      text-[10px] sm:text-[11px] font-medium
                      bg-[var(--elevated)] text-[var(--txt2)]
                      border border-[var(--border2)]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            {/* Spacer pushes button to bottom */}
            <div className="flex-1" />

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading || !design.downloadUrl}
              className={cn(
                "relative w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl",
                "font-syne font-bold text-sm transition-all duration-300",
                "border-2 overflow-hidden group/btn",
                downloaded
                  ? "border-[#16A34A] bg-[#16A34A]/8 text-[#16A34A]"
                  : !design.downloadUrl
                    ? "border-[var(--border2)] bg-[var(--elevated)] text-[var(--txt3)] cursor-not-allowed"
                    : "border-[var(--border2)] bg-transparent text-[var(--txt)] hover:border-[#2563EB]/60 hover:bg-[#2563EB]/5"
              )}
            >
              {/* Hover gradient overlay */}
              {design.downloadUrl && !downloaded && (
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl bg-gradient-to-r from-[#2563EB]/8 to-[#7C3AED]/8" />
              )}

              <span className="relative z-10 flex items-center gap-2">
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting download...</span>
                  </>
                ) : downloaded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Downloaded!</span>
                  </>
                ) : !design.downloadUrl ? (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Coming Soon</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform duration-300" />
                    <span>Free Download</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={images}
            current={lightboxIdx}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setLightboxIdx((c) => (c - 1 + images.length) % images.length)}
            onNext={() => setLightboxIdx((c) => (c + 1) % images.length)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Page Component ─────────────────────────────────────
export function FreeDesignsClient() {
  const [designs, setDesigns] = useState<FreeDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/free-designs")
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || `Failed to load (${r.status})`);
        }
        return r.json();
      })
      .then((data) => setDesigns(data.designs || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? designs.filter((d) => {
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.formats || []).some((f) => f.toLowerCase().includes(q)) ||
          (d.machines || []).some((m) => m.toLowerCase().includes(q))
        );
      })
    : designs;

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-12 md:pt-16 pb-2 sm:pb-4 px-4 sm:px-6 overflow-hidden">
        <GradientOrb color="#2563EB" size={600} className="-top-[25%] -left-[15%]" style={{ opacity: 0.1 }} />
        <GradientOrb color="#A855F7" size={400} className="top-[5%] right-[0%]" style={{ opacity: 0.06 }} />

        {/* Desktop floating showcase images — flanking heading */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [0, -12, 6, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[18%] top-[28%] w-[220px] xl:w-[250px]"
          >
            <img
              src="https://res.cloudinary.com/djoixgojj/image/upload/v1779204050/cap-embroidery_sjxoep.webp"
              alt="Cap embroidery"
              className="w-full h-auto rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-white/20"
            />
          </motion.div>
          <motion.div
            animate={{ y: [6, -10, 4, -8, 6] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute right-[18%] top-[26%] w-[220px] xl:w-[250px]"
          >
            <img
              src="https://res.cloudinary.com/djoixgojj/image/upload/v1779207170/jacket-embroidery_ycfnqh.webp"
              alt="Jacket embroidery"
              className="w-full h-auto rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-white/20"
            />
          </motion.div>
        </div>

        <div className="relative z-10 max-w-[720px] mx-auto text-center">
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold
                uppercase tracking-wider bg-[#16A34A]/8 text-[#16A34A] border border-[#16A34A]/15 mb-4 sm:mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              FREE SAMPLES
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="font-syne font-bold text-[clamp(30px,6vw,60px)] leading-[1.08] mb-3 sm:mb-4"
          >
            Free{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
              Sample Digitizing
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm sm:text-base text-[var(--txt2)] leading-relaxed max-w-[480px] mx-auto mb-6 sm:mb-8"
          >
            Download free digitized sample files. Test our stitch quality on your machine before placing your first order.
          </motion.p>

          {/* Search bar — inside hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-[480px] mx-auto"
          >
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search designs by name, format, or machine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-10 rounded-xl sm:rounded-2xl
                bg-[var(--surface)]/95 
                border border-[var(--border)] text-sm text-[var(--txt)]
                placeholder:text-[var(--txt3)]
                focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10
                transition-all duration-300 shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                  bg-[var(--elevated2)] flex items-center justify-center
                  hover:bg-[var(--border2)] active:scale-90 transition-all"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-[var(--txt3)]" />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── DESIGNS GRID ──────────────────────────────────── */}
      <section id="designs-grid" className="pb-16 sm:pb-20 md:pb-28 px-4 sm:px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
              <p className="text-sm text-[var(--txt3)]">Loading designs...</p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
              <h3 className="font-syne font-bold text-lg sm:text-xl text-[var(--txt)] mb-1">
                Failed to load designs
              </h3>
              <p className="text-sm text-[var(--txt2)] max-w-[380px] mx-auto mb-4">
                {error}
              </p>
              <button
                onClick={() => { setError(""); setLoading(true); window.location.reload(); }}
                className="text-sm text-[#2563EB] hover:underline font-medium"
              >
                Retry
              </button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="text-5xl sm:text-6xl mb-4">🧵</div>
              <h3 className="font-syne font-bold text-lg sm:text-xl text-[var(--txt)] mb-1">
                {search ? "No results found" : "No free designs yet"}
              </h3>
              <p className="text-sm text-[var(--txt2)] max-w-[380px] mx-auto">
                {search
                  ? `Nothing matches "${search}". Try a different term.`
                  : "Check back soon — we're adding new free designs regularly."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-4 text-sm text-[#2563EB] hover:underline font-medium"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          ) : (
            <>
              {/* Result count + sort hint */}
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                {search ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-[var(--txt2)]"
                  >
                    <span className="font-semibold text-[var(--txt)]">{filtered.length}</span> design{filtered.length !== 1 ? "s" : ""} matching &ldquo;{search}&rdquo;
                  </motion.p>
                ) : (
                  <p className="text-sm text-[var(--txt2)]">
                    <span className="font-semibold text-[var(--txt)]">{filtered.length}</span> free design{filtered.length !== 1 ? "s" : ""} available
                  </p>
                )}
              </div>

              {/* Grid */}
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((design, i) => (
                    <motion.div
                      key={design.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DesignCard design={design} index={i} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
