"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
    <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--elevated)] border border-[var(--border)]">
      <Icon size={13} className="text-[#2563EB] flex-shrink-0" />
      <span className="text-[11px] sm:text-xs font-semibold text-[var(--txt)] whitespace-nowrap">{value}</span>
      <span className="text-[10px] text-[var(--txt3)] whitespace-nowrap">{label}</span>
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
      className="relative inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[12px] sm:text-sm font-semibold transition-all duration-200 border cursor-pointer"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${color}, ${color}DD)`
          : "var(--surface)",
        color: isActive ? "#fff" : "var(--txt2)",
        borderColor: isActive ? "transparent" : "var(--border2)",
        boxShadow: isActive ? `0 0 24px ${color}30` : "none",
      }}
    >
      <span className="text-sm sm:text-base">{emoji}</span>
      <span>{label}</span>
      {count > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1.5"
          style={{
            background: isActive ? `${color}30` : "var(--border)",
            color: isActive ? color : "var(--txt3)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Portfolio Card (image-only) ─────────────────────── */
function GalleryCard({
  item,
  onClick,
  index,
  onCategoryClick,
}: {
  item: PortfolioItem;
  onClick: () => void;
  index: number;
  onCategoryClick?: (slug: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const category = item.category;
  const thumbnail = item.images?.find((i: any) => i.isThumbnail || i.sortOrder === -1);
  const firstImage = thumbnail || item.images?.[0];
  const accent = item.accent || category?.color || "#2563EB";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="group relative rounded-[8px] cursor-pointer overflow-hidden transition-all duration-300 bg-[var(--surface)]"
      style={{
        border: `1px solid ${isHovered ? accent + "40" : "var(--border2)"}`,
        boxShadow: isHovered
          ? `0 16px 48px ${accent}14`
          : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Image area */}
      <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden" style={{ background: `${accent}06` }}>
        {firstImage && !imgError ? (
          <>
            <img
              src={firstImage.url}
              alt={item.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
              style={{
                transform: isHovered ? "scale(1.06)" : "scale(1)",
              }}
            />
            {/* Hover: View indicator */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 rounded-[8px] overflow-hidden"
              style={{
                background: `linear-gradient(180deg, transparent 40%, ${accent}30 100%)`,
              }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: `${accent}90`, backdropFilter: "blur(8px)" }}
              >
                <Eye size={15} />
                View
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff size={28} className="opacity-20" style={{ color: accent }} />
          </div>
        )}

        {item.images.length > 1 && (
          <span className="absolute top-2.5 right-2.5 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm">
            +{item.images.length - 1}
          </span>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 sm:p-4 flex flex-col gap-2">
        <h3 className="font-syne font-bold text-sm sm:text-[15px] leading-snug text-[var(--txt)] line-clamp-1">
          {item.title}
        </h3>

        {item.description ? (
          <p className="text-[11px] sm:text-xs text-[var(--txt2)] leading-relaxed line-clamp-2">
            {item.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
          {category && (
            <span className="text-[9px] sm:text-[11px] font-medium px-2 py-px sm:px-2.5 sm:py-1 rounded-full bg-[var(--elevated)] text-[var(--txt3)] border border-[var(--border)]">
              {category.emoji} {category.name}
            </span>
          )}
          {item.tags && item.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-[9px] sm:text-[11px] font-medium px-2 py-px sm:px-2.5 sm:py-1 rounded-full bg-[var(--elevated)] text-[var(--txt3)] border border-[var(--border)]">
              {tag}
            </span>
          ))}
          {item.tags && item.tags.length > 3 && (
            <span className="text-[9px] sm:text-[11px] text-[var(--txt3)]">+{item.tags.length - 3}</span>
          )}
        </div>
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
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchPortfolio()
      .then((data) => {
        setItems(data.items);
        const validSlugs = ["digitizing", "vector", "patches"];
        const filteredCats = data.categories.filter((c: any) => validSlugs.includes(c.slug));
        if (filteredCats.length) setCategories(filteredCats);

        // Auto-open item from ?item= query param
        const itemSlug = searchParams.get("item");
        if (itemSlug) {
          const match = data.items.find((i: PortfolioItem) => i.slug === itemSlug);
          if (match) setSelectedItem(match);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [searchParams]);

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
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-1.5 sm:gap-2 mb-3">
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

          {/* Count */}
          <div className="text-center max-w-[1400px] mx-auto mt-2">
            <p className="text-xs text-[var(--txt3)]">
              Showing <strong className="text-[var(--txt)]">{filtered.length}</strong> projects
              {activeSub && <span> in <strong className="text-[#F97316]">{activeSub}</strong></span>}
            </p>
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
          ) : (
            /* ── Gallery Grid ───────────────────────── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {filtered.map((item, idx) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onClick={() => setSelectedItem(item)}
                  onCategoryClick={(slug) => { setActiveCat(slug); setActiveSub(null); }}
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
          FINAL CTA
          ════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-syne font-bold text-2xl sm:text-3xl md:text-4xl mb-3 text-[var(--txt)]">
            Ready for Production-Ready Files?
          </h2>
          <p className="text-sm sm:text-base text-[var(--txt2)] mb-6 max-w-md mx-auto">
            Upload your design — get a proof — pay when satisfied. From <strong className="text-[var(--txt)]">$7</strong> per design.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contact">
              <Button variant="grad" size="lg" rightIcon={<ArrowRight size={15} />}>
                Upload Design — Free Quote
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="md">View Pricing</Button>
            </Link>
          </div>
          <p className="text-[11px] text-[var(--txt3)] mt-4">
            🔄 Free revisions forever &bull; All machine formats &bull; Pay when satisfied
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MODAL — Detail view
          ════════════════════════════════════════════════════════ */}
      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
