"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  Sparkles,
  Check,
  Star,
  Clock,
  Globe,
  Shield,
  Zap,
  Eye,
  Layers,
  Download,
  FileCheck,
  SlidersHorizontal,
  ImageOff,
  ArrowUpRight,
} from "lucide-react";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { PortfolioModal } from "@/components/portfolio/PortfolioModal";
import { fetchPortfolio, DEFAULT_CATEGORIES, SUB_CATEGORIES } from "@/components/portfolio/data";
import { SITE_STATS, fmt, fmtPlus } from "@/lib/site-config";
import type { PortfolioItem, PortfolioCategory } from "@/components/portfolio/data";

/* ─────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────── */

function SectionBadge({ children, color = "#2563EB" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
    >
      {children}
    </span>
  );
}

function StatPill({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--elevated)] border border-[var(--border)]">
      <Icon size={14} className="text-[#2563EB]" />
      <span className="text-xs font-semibold text-[var(--txt)]">{value}</span>
      <span className="text-[10px] text-[var(--txt3)] hidden sm:inline">{label}</span>
    </div>
  );
}

function CategoryIcon({ emoji, size = "md" }: { emoji: string; size?: "sm" | "md" }) {
  return (
    <span className={size === "sm" ? "text-sm" : "text-lg"}>
      {emoji}
    </span>
  );
}

/* ── Filter Chip ────────────────────────────────────────── */
function FilterChip({
  label,
  emoji,
  count,
  isActive,
  color,
  onClick,
}: {
  label: string;
  emoji: string;
  count: number;
  isActive: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${color}, ${color}DD)`
          : "var(--surface)",
        color: isActive ? "#fff" : "var(--txt2)",
        borderColor: isActive ? "transparent" : "var(--border2)",
        boxShadow: isActive ? `0 0 24px ${color}30` : "none",
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span
        className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1.5"
        style={{
          background: isActive ? `${color}30` : "var(--border)",
          color: isActive ? color : "var(--txt3)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ── Portfolio Card (inline for conversion focus) ────────── */
function GalleryCard({
  item,
  onClick,
  index,
}: {
  item: PortfolioItem;
  onClick: () => void;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const category = item.category;
  const thumbnail = item.images?.find((i: any) => i.isThumbnail || i.sortOrder === -1);
  const firstImage = thumbnail || item.images?.[0];
  const accent = item.accent || category?.color || "#2563EB";
  const emoji = category?.emoji || "✦";
  const hasBeforeAfter = item.images?.some((i: any) => i.isBefore) && item.images?.some((i: any) => !i.isBefore);
  const beforeImg = item.images?.find((i: any) => i.isBefore);
  const afterImg = item.images?.find((i: any) => !i.isBefore);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="group relative rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 flex flex-col"
      style={{
        background: "var(--surface)",
        border: `1px solid ${isHovered ? accent + "50" : "var(--border2)"}`,
        boxShadow: isHovered
          ? `0 16px 48px ${accent}14, 0 0 0 1px ${accent}18 inset`
          : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `${accent}06` }}>
        {/* Grid bg */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundImage: `linear-gradient(${accent}08 1px, transparent 1px), linear-gradient(90deg, ${accent}08 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            opacity: isHovered ? 0.8 : 0.3,
          }}
        />

        {firstImage && !imgError ? (
          <>
            <img
              src={firstImage.url}
              alt={item.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              style={{
                opacity: isHovered ? 1 : 0.88,
                transform: isHovered ? "scale(1.06)" : "scale(1)",
              }}
            />
            {/* Hover overlay with preview CTA */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                background: `linear-gradient(to top, ${accent}40 0%, transparent 50%)`,
                opacity: isHovered ? 1 : 0,
              }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-md border border-white/20"
              >
                <Eye size={13} />
                Preview
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff size={28} className="opacity-20" style={{ color: accent }} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10">
          {category && (
            <span
              className="text-[9px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
              style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}35` }}
            >
              {category.name}
            </span>
          )}
          {hasBeforeAfter && (
            <span className="text-[9px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30">
              Before / After
            </span>
          )}
        </div>

        {item.images.length > 1 && (
          <span className="absolute top-2.5 right-2.5 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm">
            +{item.images.length - 1}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-syne font-bold text-sm leading-snug transition-colors"
            style={{ color: isHovered ? accent : "var(--txt)" }}
          >
            {item.title}
          </h3>
          {item.turnaround && (
            <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
              {item.turnaround}
            </span>
          )}
        </div>

        <p className="text-xs text-[var(--txt2)] leading-relaxed line-clamp-2">{item.description}</p>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-1.5 mt-auto">
          {item.stitches && item.stitches > 0 && (
            <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-[var(--border)] border border-[var(--border2)]">
              <Layers size={10} className="text-[var(--txt3)]" />
              <span className="text-[10px] font-mono font-semibold text-[var(--txt)]">{(item.stitches / 1000).toFixed(1)}k</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-[var(--border)] border border-[var(--border2)]">
            <span className="text-[10px]">🎨</span>
            <span className="text-[10px] font-mono font-semibold text-[var(--txt)]">{item.colors}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-[var(--border)] border border-[var(--border2)]">
            <Download size={10} className="text-[var(--txt3)]" />
            <span className="text-[10px] font-semibold text-[var(--txt)] truncate max-w-[55px]">{item.outputFormat}</span>
          </div>
        </div>

        {/* Quick CTA */}
        <Link
          href="/contact"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-semibold no-underline transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: isHovered ? `linear-gradient(135deg, ${accent}, ${accent}DD)` : `${accent}10`,
            color: isHovered ? "#fff" : accent,
            border: `1px solid ${isHovered ? "transparent" : accent + "25"}`,
          }}
        >
          Order This Style
          <ArrowRight size={11} />
        </Link>
      </div>
    </motion.article>
  );
}

/* ── Before/After Showcase Card ──────────────────────────── */
function BeforeAfterCard({
  item,
  onClick,
}: {
  item: PortfolioItem;
  onClick: () => void;
}) {
  const accent = item.accent || item.category?.color || "#2563EB";
  const beforeImg = item.images?.find((i: any) => i.isBefore);
  const afterImg = item.images?.find((i: any) => !i.isBefore);

  if (!beforeImg || !afterImg) return null;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border2)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      <div className="grid grid-cols-2 gap-[2px]">
        {/* Before */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={beforeImg.url}
            alt="Before digitizing"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span
            className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
            style={{ background: "#DC262615", color: "#DC2626", border: "1px solid #DC262630" }}
          >
            Before
          </span>
        </div>
        {/* After */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={afterImg.url}
            alt="After digitizing"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span
            className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
            style={{ background: "#16A34A15", color: "#16A34A", border: "1px solid #16A34A30" }}
          >
            After
          </span>
        </div>
      </div>

      {/* Info bar */}
      <div className="p-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-syne font-bold text-sm text-[var(--txt)]">{item.title}</h4>
          <p className="text-[10px] text-[var(--txt3)] mt-0.5">{item.category?.name} — {item.outputFormat}</p>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-[#16A34A]/8 px-2 py-1 rounded-lg">
          <Check size={10} />
          View Details
        </span>
      </div>
    </div>
  );
}

/* ── Client Results Card ─────────────────────────────────── */
function ClientResultCard({ item }: { item: PortfolioItem }) {
  const accent = item.accent || item.category?.color || "#2563EB";
  const firstImg = item.images?.[0];

  return (
    <div
      className="flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border2)",
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden border"
        style={{ borderColor: `${accent}25` }}
      >
        {firstImg ? (
          <img src={firstImg.url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl"
            style={{ background: `${accent}10` }}
          >
            {item.category?.emoji || "✦"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} className="text-[#EAB308] fill-[#EAB308]" />
          ))}
        </div>
        <p className="text-xs text-[var(--txt2)] leading-relaxed line-clamp-2 mb-2">&ldquo;{item.description}&rdquo;</p>
        <div className="flex items-center gap-3 text-[10px] text-[var(--txt3)]">
          {item.clientName && <span className="font-semibold text-[var(--txt)]">{item.clientName}</span>}
          {item.stitches && <span>{(item.stitches / 1000).toFixed(1)}k stitches</span>}
          <span>{item.outputFormat}</span>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════ */
export function PortfolioClient() {
  const [activeCat, setActiveCat] = useState("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "compare">("grid");

  useEffect(() => {
    fetchPortfolio()
      .then((data) => {
        setItems(data.items);
        const validSlugs = ["digitizing", "vector", "patches"];
        const filteredCats = data.categories.filter((c: any) => validSlugs.includes(c.slug));
        if (filteredCats.length) setCategories(filteredCats);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const mainCategories = [
    { slug: "all", name: "All Work", emoji: "✦", color: "#2563EB" },
    ...categories.filter((c) => c.slug !== "all"),
  ];

  const subs = activeCat !== "all" ? (SUB_CATEGORIES[activeCat] || []) : [];

  const filtered = items.filter((i) => {
    if (activeCat !== "all" && i.category?.slug !== activeCat) return false;
    if (activeSub && !i.tags?.includes(activeSub)) return false;
    return true;
  });

  // Before/after items
  const beforeAfterItems = filtered.filter(
    (i) => i.images?.some((img: any) => img.isBefore) && i.images?.some((img: any) => !img.isBefore)
  );

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* ════════════════════════════════════════════════════════
          HERO — Stats-rich conversion header
          ════════════════════════════════════════════════════════ */}
      <section className="relative text-center pt-12 pb-6 sm:pt-16 sm:pb-8 md:pt-20 md:pb-10 px-4 sm:px-6 overflow-hidden">
        <GradientOrb color="#2563EB" size={400} className="top-[-120px] left-1/2 -translate-x-1/2 opacity-18" />
        <GradientOrb color="#F97316" size={220} className="top-[15%] right-[3%] opacity-8" />

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-5"
        >
          Our Portfolio
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-syne font-bold text-[clamp(34px,7vw,68px)] leading-[1.05] mb-4"
        >
          See the Quality
          <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            Before You Order
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg text-[var(--txt2)] max-w-2xl mx-auto leading-relaxed mb-6"
        >
          Every project below was hand-digitized by our team. Real files. Real results. No stock photography.
          Browse {fmtPlus(SITE_STATS.ordersCompleted)} orders worth of embroidery quality.
        </motion.p>

        {/* Trust stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          <StatPill icon={Star} value={`${SITE_STATS.avgRating}/5`} label="Rating" />
          <StatPill icon={FileCheck} value={fmtPlus(SITE_STATS.ordersCompleted)} label="Orders" />
          <StatPill icon={Clock} value={`${SITE_STATS.avgDeliveryHours}h`} label="Delivery" />
          <StatPill icon={Globe} value={fmtPlus(SITE_STATS.countriesServed)} label="Countries" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FILTERS — Visual category chips + sub-filters
          ════════════════════════════════════════════════════════ */}
      <section className="pb-6 sm:pb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          {/* Main categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {mainCategories.map((cat) => {
              const count =
                cat.slug === "all"
                  ? items.length
                  : items.filter((i) => i.category?.slug === cat.slug).length;
              return (
                <FilterChip
                  key={cat.slug}
                  label={cat.name}
                  emoji={cat.emoji}
                  count={count}
                  isActive={activeCat === cat.slug}
                  color={cat.color}
                  onClick={() => {
                    setActiveCat(cat.slug);
                    setActiveSub(null);
                  }}
                />
              );
            })}
          </div>

          {/* Sub-category chips */}
          <AnimatePresence>
            {subs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap justify-center gap-1.5 mb-2"
              >
                <button
                  onClick={() => setActiveSub(null)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 border"
                  style={{
                    background: !activeSub ? "#2563EB" : "var(--surface)",
                    color: !activeSub ? "#fff" : "var(--txt2)",
                    borderColor: !activeSub ? "transparent" : "var(--border2)",
                  }}
                >
                  All {categories.find((c) => c.slug === activeCat)?.name || ""}
                </button>
                {subs.map((sub) => {
                  const isSel = activeSub === sub;
                  const subCount = items.filter(
                    (i) => i.category?.slug === activeCat && i.tags?.includes(sub)
                  ).length;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSub(isSel ? null : sub)}
                      className="px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 border"
                      style={{
                        background: isSel ? "#F97316" : "var(--surface)",
                        color: isSel ? "#fff" : "var(--txt2)",
                        borderColor: isSel ? "transparent" : "var(--border2)",
                      }}
                    >
                      {sub} ({subCount})
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* View mode toggle + count */}
          <div className="flex items-center justify-between max-w-[1400px] mx-auto mt-2">
            <p className="text-xs sm:text-sm text-[var(--txt3)]">
              Showing <strong className="text-[var(--txt)]">{filtered.length}</strong> projects
              {activeSub && (
                <>
                  {" "}in <strong className="text-[#F97316]">{activeSub}</strong>
                </>
              )}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewMode("grid")}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 border"
                style={{
                  background: viewMode === "grid" ? "#2563EB15" : "var(--surface)",
                  color: viewMode === "grid" ? "#2563EB" : "var(--txt3)",
                  borderColor: viewMode === "grid" ? "#2563EB30" : "var(--border2)",
                }}
              >
                <SlidersHorizontal size={12} className="inline mr-1" />
                Gallery
              </button>
              {beforeAfterItems.length > 0 && (
                <button
                  onClick={() => setViewMode("compare")}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 border"
                  style={{
                    background: viewMode === "compare" ? "#F9731615" : "var(--surface)",
                    color: viewMode === "compare" ? "#F97316" : "var(--txt3)",
                    borderColor: viewMode === "compare" ? "#F9731630" : "var(--border2)",
                  }}
                >
                  <ArrowUpRight size={12} className="inline mr-1" />
                  Before / After
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CONTENT — Conditional: Gallery Grid / Before-After / Empty / Loading
          ════════════════════════════════════════════════════════ */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={28} className="animate-spin text-[var(--txt3)]" />
              <p className="text-sm text-[var(--txt3)]">Loading portfolio...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <ImageOff size={32} className="text-[var(--txt3)] opacity-40" />
              <p className="text-sm text-[var(--txt3)]">Couldn't load portfolio. Please try again.</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-[#2563EB] hover:underline"
              >
                Refresh page
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-[var(--elevated)] border border-[var(--border)]">
                {categories.find((c) => c.slug === activeCat)?.emoji || "📂"}
              </div>
              <p className="text-sm font-semibold text-[var(--txt)]">No projects in this category yet</p>
              <p className="text-xs text-[var(--txt3)] max-w-sm text-center">
                We're working on adding more portfolio items. Check back soon or contact us to see relevant samples.
              </p>
              <Link href="/contact">
                <Button variant="grad" size="sm" className="mt-2">
                  Request Samples
                </Button>
              </Link>
            </div>
          ) : viewMode === "compare" ? (
            /* ── Before/After Comparison Grid ─────────────────── */
            <div className="space-y-8">
              <AnimatedSection>
                <div className="text-center mb-8">
                  <SectionBadge color="#F97316">Before &amp; After</SectionBadge>
                  <h2 className="font-syne font-bold text-2xl sm:text-3xl mt-3 mb-2">
                    See the Transformation
                  </h2>
                  <p className="text-sm text-[var(--txt2)] max-w-xl mx-auto">
                    Original artwork vs digitized embroidery files. Every project below shows the quality difference
                    hand-digitizing makes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {beforeAfterItems.map((item) => (
                    <BeforeAfterCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>

                {/* Remaining items without before/after */}
                {filtered.filter((i) => !beforeAfterItems.includes(i)).length > 0 && (
                  <div className="mt-12">
                    <h3 className="font-syne font-bold text-lg mb-5 text-center text-[var(--txt2)]">
                      More Projects
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {filtered
                        .filter((i) => !beforeAfterItems.includes(i))
                        .map((item, idx) => (
                          <GalleryCard
                            key={item.id}
                            item={item}
                            index={idx}
                            onClick={() => setSelectedItem(item)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </AnimatedSection>
            </div>
          ) : (
            /* ── Standard Gallery Grid ───────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((item, idx) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MID-PAGE CTA — Quick conversion prompt
          ════════════════════════════════════════════════════════ */}
      {filtered.length > 0 && (
        <section className="py-8 sm:py-10">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#2563EB]/15 bg-gradient-to-r from-[#2563EB]/8 via-[#7C3AED]/5 to-[#F97316]/8 p-6 sm:p-10 text-center">
              <GradientOrb color="#2563EB" size={200} className="-top-16 left-1/3 opacity-12" />

              <div className="relative z-10 max-w-xl mx-auto">
                <Sparkles size={20} className="mx-auto text-[#2563EB] mb-3" />
                <h2 className="font-syne font-bold text-xl sm:text-2xl mb-2">
                  Like What You See?
                </h2>
                <p className="text-sm text-[var(--txt2)] mb-5">
                  Upload your design and get the same quality — free revisions, fast turnaround, starting from just $7.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <Link href="/contact">
                    <Button variant="grad" size="lg" rightIcon={<ArrowRight size={15} />}>
                      Upload Design — Free Quote
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="ghost" size="md">
                      View Pricing
                    </Button>
                  </Link>
                </div>
                <p className="text-[10px] text-[var(--txt3)] mt-3">
                  ♾️ Free revisions &bull; 🔄 All formats &bull; ⚡ 3–24h delivery &bull; 💳 Pay when satisfied
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          CLIENT RESULTS — Social proof section
          ════════════════════════════════════════════════════════ */}
      {items.filter((i) => i.clientName).length > 0 && (
        <section className="py-10 sm:py-14">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
            <AnimatedSection>
              <div className="text-center mb-8">
                <SectionBadge color="#16A34A">Client Results</SectionBadge>
                <h2 className="font-syne font-bold text-2xl sm:text-3xl mt-3 mb-2">
                  Trusted by Embroidery Pros
                </h2>
                <p className="text-sm text-[var(--txt2)] max-w-xl mx-auto">
                  Real feedback from real clients. Every project delivered production-ready.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {items
                  .filter((i) => i.clientName)
                  .slice(0, 6)
                  .map((item) => (
                    <ClientResultCard key={item.id} item={item} />
                  ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          TRUST BAR — Verification signals
          ════════════════════════════════════════════════════════ */}
      <section className="py-8 sm:py-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Star, label: `${SITE_STATS.avgRating}/5 Rating`, sub: `${fmtPlus(SITE_STATS.verifiedReviews)} verified reviews` },
              { icon: Shield, label: "100% Guaranteed", sub: "Pay when satisfied" },
              { icon: Zap, label: "3–24h Delivery", sub: "Rush & urgent free" },
              { icon: Download, label: "8+ File Formats", sub: "DST, PES, EMB & more" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-[var(--elevated)] border border-[var(--border)]"
                >
                  <Icon size={20} className="text-[#2563EB] mb-2" />
                  <p className="font-syne font-bold text-sm text-[var(--txt)]">{item.label}</p>
                  <p className="text-[11px] text-[var(--txt3)] mt-0.5">{item.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FINAL CTA — Conversion close
          ════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/10 via-white/40 to-[#F97316]/10 p-8 sm:p-12 md:p-16 text-center shadow-[0_0_60px_rgba(37,99,235,0.1)] backdrop-blur-xl">
            <GradientOrb color="#2563EB" size={280} className="-top-24 left-1/2 -translate-x-1/2 opacity-20" />

            <div className="relative z-10 max-w-xl mx-auto">
              <div className="text-5xl mb-4">🧵</div>
              <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-3">
                Ready for Production-Ready Files?
              </h2>
              <p className="text-base sm:text-lg text-[var(--txt2)] mb-2">
                Upload your design. Get a proof. Pay when satisfied.
              </p>
              <p className="text-sm text-[var(--txt3)] mb-6">
                From <strong className="text-[var(--txt)]">$7</strong> per design. Free revisions. Free formats. Free rush delivery.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/contact">
                  <Button variant="grad" size="lg" className="!px-8" rightIcon={<ArrowRight size={16} />}>
                    Upload Design — Free Quote
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-[var(--txt3)] mt-4">
                🔄 Free revisions forever &bull; All machine formats &bull; Pay when satisfied
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MODAL — Detail view
          ════════════════════════════════════════════════════════ */}
      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
