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
import { SITE_CLAIMS } from "@/lib/site-config";
import type { PortfolioItem, PortfolioCategory } from "@/components/portfolio/data";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────── */

function SectionBadge({
  children,
  color = "#2563EB",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
    >
      {children}
    </span>
  );
}

function StatPill({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--elevated)] px-2.5 py-1.5 sm:gap-2 sm:px-3">
      <Icon size={13} className="flex-shrink-0 text-[#2563EB]" />
      <span className="whitespace-nowrap text-[11px] font-semibold text-[var(--txt)] sm:text-xs">
        {value}
      </span>
      <span className="whitespace-nowrap text-[10px] text-[var(--txt3)]">{label}</span>
    </div>
  );
}

function CategoryIcon({ emoji, size = "md" }: { emoji: string; size?: "sm" | "md" }) {
  return <span className={size === "sm" ? "text-sm" : "text-lg"}>{emoji}</span>;
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
      className="relative flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-all duration-200 sm:w-auto sm:flex-row sm:gap-1.5 sm:px-4 sm:py-2.5 sm:text-sm"
      style={{
        background: isActive ? `linear-gradient(135deg, ${color}, ${color}DD)` : "var(--surface)",
        color: isActive ? "#fff" : "var(--txt2)",
        borderColor: isActive ? "transparent" : "var(--border2)",
        boxShadow: isActive ? `0 0 24px ${color}30` : "none",
      }}
    >
      <span className="text-base leading-none sm:text-sm">{emoji}</span>
      <span className="text-[10px] leading-tight sm:text-sm">{label}</span>
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold sm:static sm:h-[18px] sm:min-w-[18px] sm:text-[10px]"
          style={{
            background: isActive ? `${color}30` : "var(--border)",
            color: isActive ? "#fff" : "var(--txt3)",
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
      className="group relative cursor-pointer overflow-hidden rounded-[8px] bg-[var(--surface)] transition-all duration-300"
      style={{
        border: `1px solid ${isHovered ? accent + "40" : "var(--border2)"}`,
        boxShadow: isHovered ? `0 16px 48px ${accent}14` : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Image area */}
      <div
        className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4]"
        style={{ background: `${accent}06` }}
      >
        {firstImage && !imgError ? (
          <>
            <Image
              src={firstImage.url}
              alt={item.title}
              fill
              loading="lazy"
              onError={() => setImgError(true)}
              className="object-cover transition-all duration-500"
              sizes="(max-width: 768px) 50vw, 33vw"
              style={{
                transform: isHovered ? "scale(1.06)" : "scale(1)",
              }}
            />
            {/* Hover: View indicator */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[8px] transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"
              style={{
                background: `linear-gradient(180deg, transparent 40%, ${accent}30 100%)`,
              }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white"
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
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white/90">
            +{item.images.length - 1}
          </span>
        )}
      </div>

      {/* Info section */}
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        <h3 className="line-clamp-1 font-syne text-sm font-bold leading-snug text-[var(--txt)] sm:text-[15px]">
          {item.title}
        </h3>

        {item.description ? (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-[var(--txt2)] sm:text-xs">
            {item.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {category && (
            <span className="rounded-full border border-[var(--border)] bg-[var(--elevated)] px-2 py-px text-[9px] font-medium text-[var(--txt3)] sm:px-2.5 sm:py-1 sm:text-[11px]">
              {category.emoji} {category.name}
            </span>
          )}
          {item.tags &&
            item.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border)] bg-[var(--elevated)] px-2 py-px text-[9px] font-medium text-[var(--txt3)] sm:px-2.5 sm:py-1 sm:text-[11px]"
              >
                {tag}
              </span>
            ))}
          {item.tags && item.tags.length > 3 && (
            <span className="text-[9px] text-[var(--txt3)] sm:text-[11px]">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ── Before/After Showcase Card ──────────────────────────── */
function BeforeAfterCard({ item, onClick }: { item: PortfolioItem; onClick: () => void }) {
  const accent = item.accent || item.category?.color || "#2563EB";
  const beforeImg = item.images?.find((i: any) => i.isBefore);
  const afterImg = item.images?.find((i: any) => !i.isBefore);

  if (!beforeImg || !afterImg) return null;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border2)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      <div className="grid grid-cols-2 gap-[2px]">
        {/* Before */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={beforeImg.url}
            alt="Before digitizing"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            sizes="50vw"
          />
          <span
            className="absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "#DC262615", color: "#DC2626", border: "1px solid #DC262630" }}
          >
            Before
          </span>
        </div>
        {/* After */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={afterImg.url}
            alt="After digitizing"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            sizes="50vw"
          />
          <span
            className="absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "#16A34A15", color: "#16A34A", border: "1px solid #16A34A30" }}
          >
            After
          </span>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between gap-3 p-3">
        <div>
          <h4 className="font-syne text-sm font-bold text-[var(--txt)]">{item.title}</h4>
          <p className="mt-0.5 text-[10px] text-[var(--txt3)]">
            {item.category?.name} — {item.outputFormat}
          </p>
        </div>
        <span className="bg-[#16A34A]/8 inline-flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-[#16A34A]">
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
      className="flex items-start gap-4 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border2)",
      }}
    >
      <div
        className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border"
        style={{ borderColor: `${accent}25` }}
      >
        {firstImg ? (
          <Image
            fill
            src={firstImg.url}
            alt={item.title}
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xl"
            style={{ background: `${accent}10` }}
          >
            {item.category?.emoji || "✦"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} className="fill-[#EAB308] text-[#EAB308]" />
          ))}
        </div>
        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-[var(--txt2)]">
          &ldquo;{item.description}&rdquo;
        </p>
        <div className="flex items-center gap-3 text-[10px] text-[var(--txt3)]">
          {item.clientName && (
            <span className="font-semibold text-[var(--txt)]">{item.clientName}</span>
          )}
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
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const validSlugs = ["digitizing", "vector", "patches"];
  const [activeCat, setActiveCat] = useState(
    validSlugs.includes(categoryParam || "") ? categoryParam! : "all"
  );
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetchPortfolio()
      .then((data) => {
        setItems(data.items);
        const dbValidCats = data.categories.filter((c: any) => validSlugs.includes(c.slug));
        if (dbValidCats.length) setCategories(dbValidCats);

        // Auto-open item from ?item= query param
        const itemSlug = searchParams.get("item");
        if (itemSlug) {
          const match = data.items.find((i: PortfolioItem) => i.slug === itemSlug);
          if (match) setSelectedItem(match);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [searchParams, validSlugs]);

  const mainCategories = [
    { slug: "all", name: "All Work", emoji: "✦", color: "#2563EB" },
    ...categories.filter((c) => c.slug !== "all"),
  ];

  const subs = activeCat !== "all" ? SUB_CATEGORIES[activeCat] || [] : [];

  const filtered = items.filter((i) => {
    if (activeCat !== "all" && i.category?.slug !== activeCat) return false;
    if (activeSub && !i.tags?.includes(activeSub)) return false;
    return true;
  });

  return (
    <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
      {/* ════════════════════════════════════════════════════════
          HERO — Stats-rich conversion header
          ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pb-6 pt-12 text-center sm:px-6 sm:pb-8 sm:pt-16 md:pb-10 md:pt-20">
        <GradientOrb
          color="#2563EB"
          size={400}
          className="opacity-18 left-1/2 top-[-120px] -translate-x-1/2"
        />
        <GradientOrb color="#F97316" size={220} className="opacity-8 right-[3%] top-[15%]" />

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#2563EB]"
        >
          Our Portfolio
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 font-syne text-[clamp(34px,7vw,68px)] font-bold leading-[1.05]"
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
          className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-[var(--txt2)] sm:text-lg"
        >
          Every project below was hand-digitized by our team. Real files. Real results. No stock
          photography.
        </motion.p>

        {/* Trust stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          <StatPill icon={Star} value={SITE_CLAIMS.price.value} label="Standard Designs" />
          <StatPill icon={FileCheck} value={SITE_CLAIMS.turnaround.value} label="Turnaround" />
          <StatPill icon={Clock} value={SITE_CLAIMS.revisions.value} label="Revisions" />
          <StatPill icon={Globe} value={SITE_CLAIMS.formats.value} label="Formats" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FILTERS — Visual category chips + sub-filters
          ════════════════════════════════════════════════════════ */}
      <section className="pb-6 sm:pb-8">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
          {/* Main categories */}
          <div className="mb-3 grid grid-cols-4 justify-center gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
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

          {/* Sub-category chips — scrollable on mobile, hide zero-count */}
          <AnimatePresence>
            {subs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2"
              >
                <div className="relative">
                  {/* Fade hint on right edge — mobile only */}
                  <div
                    className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-10 sm:hidden"
                    style={{
                      background: "linear-gradient(to left, var(--bg) 30%, transparent 100%)",
                    }}
                  />
                  <div
                    className="scrollbar-none flex flex-nowrap gap-2 overflow-x-auto px-2 pb-1.5 sm:px-0"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {/* "All" reset button */}
                    <button
                      onClick={() => setActiveSub(null)}
                      className="flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[12px] font-semibold transition-all duration-200 sm:px-3.5 sm:py-1.5 sm:text-[11px]"
                      style={{
                        background: !activeSub ? "#2563EB" : "var(--surface)",
                        color: !activeSub ? "#fff" : "var(--txt2)",
                        borderColor: !activeSub ? "transparent" : "var(--border2)",
                      }}
                    >
                      All
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
                          className="flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[12px] font-medium transition-all duration-200 sm:px-3.5 sm:py-1.5 sm:text-[11px]"
                          style={{
                            background: isSel ? "#F97316" : "var(--surface)",
                            color: isSel ? "#fff" : "var(--txt2)",
                            borderColor: isSel ? "transparent" : "var(--border2)",
                          }}
                        >
                          {sub} <span className="ml-0.5 opacity-60">{subCount}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Count */}
          <div className="mx-auto mt-2 max-w-[1400px] text-center">
            <p className="text-xs text-[var(--txt3)]">
              Showing <strong className="text-[var(--txt)]">{filtered.length}</strong> projects
              {activeSub && (
                <span>
                  {" "}
                  in <strong className="text-[#F97316]">{activeSub}</strong>
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CONTENT — Conditional: Gallery Grid / Before-After / Empty / Loading
          ════════════════════════════════════════════════════════ */}
      <section className="pb-12 sm:pb-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 size={28} className="animate-spin text-[var(--txt3)]" />
              <p className="text-sm text-[var(--txt3)]">Loading portfolio...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <ImageOff size={32} className="text-[var(--txt3)] opacity-40" />
              <p className="text-sm text-[var(--txt3)]">
                Couldn't load portfolio. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-[#2563EB] hover:underline"
              >
                Refresh page
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--elevated)] text-3xl">
                {categories.find((c) => c.slug === activeCat)?.emoji || "📂"}
              </div>
              <p className="text-sm font-semibold text-[var(--txt)]">
                No projects in this category yet
              </p>
              <p className="max-w-sm text-center text-xs text-[var(--txt3)]">
                We're working on adding more portfolio items. Check back soon or contact us to see
                relevant samples.
              </p>
              <Link href="/contact">
                <Button variant="grad" size="sm" className="mt-2">
                  Request Samples
                </Button>
              </Link>
            </div>
          ) : (
            /* ── Gallery Grid ───────────────────────── */
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {filtered.map((item, idx) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onClick={() => setSelectedItem(item)}
                  onCategoryClick={(slug) => {
                    setActiveCat(slug);
                    setActiveSub(null);
                  }}
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
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white/90 p-6 text-center sm:rounded-3xl sm:p-10">
              <GradientOrb color="#2563EB" size={200} className="opacity-12 -top-16 left-1/3" />

              <div className="relative z-10 mx-auto max-w-xl">
                <Sparkles size={20} className="mx-auto mb-3 text-[#2563EB]" />
                <h2 className="mb-2 font-syne text-xl font-bold sm:text-2xl">Like What You See?</h2>
                <p className="mb-5 text-sm text-[var(--txt2)]">
                  Upload your design and get the same quality — free revisions, fast turnaround,
                  starting from just $7.
                </p>
                <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
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
                <p className="mt-3 text-[10px] text-[var(--txt3)]">
                  ♾️ Free revisions &bull; 🔄 All formats &bull; ⚡ 3–24h delivery &bull; 💳 Pay
                  when satisfied
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL — Detail view
          ════════════════════════════════════════════════════════ */}
      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
