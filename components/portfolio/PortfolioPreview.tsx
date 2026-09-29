"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioModal } from "./PortfolioModal";
import { PortfolioFilters } from "./PortfolioFilters";
import { fetchPortfolio, DEFAULT_CATEGORIES } from "./data";
import { AnimatedSection } from "@/components/shared/AnimatedSection";

import { Button } from "@/components/ui/Button";
import type { PortfolioItem, PortfolioCategory } from "./data";

export function PortfolioPreview() {
  const [activeCategory, setActiveCategory] = useState("digitizing");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPortfolio();
        // 10 per category for landing preview
        const pick = (slug: string) =>
          data.items.filter((i: any) => i.category?.slug === slug).slice(0, 10);
        const selected = [...pick("digitizing"), ...pick("vector"), ...pick("patches")];
        setItems(selected);
        const validSlugs = ["digitizing", "vector", "patches"];
        const dbCategories = data.categories.filter((c: any) => validSlugs.includes(c.slug));
        if (dbCategories.length > 0) {
          const merged = dbCategories.map((c: any) => ({
            ...c,
            count: pick(c.slug).length,
          }));
          setCategories([
            {
              id: "all",
              name: "All Work",
              slug: "all",
              emoji: "✦",
              color: "#2563EB",
              sortOrder: 0,
              count: selected.length,
            },
            ...merged,
          ]);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category?.slug === activeCategory);

  const counts: Record<string, number> = {};
  for (const cat of categories) {
    counts[cat.slug] =
      cat.slug === "all" ? items.length : items.filter((i) => i.category?.slug === cat.slug).length;
  }

  return (
    <>
      {/* ── Portfolio Section ─────────────────────────────── */}
      <AnimatedSection className="bg-[var(--bg)] !px-0 py-10 sm:py-16 md:py-20">
        {/* Heading + Filters */}
        <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-6 md:px-12">
          {/* Badge */}
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#2563EB] sm:mb-5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2563EB]" />
            Our Portfolio
          </span>

          {/* Title */}
          <h2 className="mb-2 font-syne text-[clamp(32px,5vw,56px)] font-bold leading-[1.08] text-[var(--txt)] sm:mb-3">
            See Our Best{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
              Work
            </span>
          </h2>

          {/* Description */}
          <p className="mx-auto mb-5 max-w-lg text-sm text-[var(--txt2)] sm:mb-6 sm:text-base">
            Professional embroidery digitizing, vector art, and custom patch design — hand-crafted
            for quality and precision.
          </p>

          {/* Filters — 3 categories only, single row */}
          {!loading && !error && (
            <div className="mb-6 sm:mb-8">
              <PortfolioFilters
                active={activeCategory}
                onChange={setActiveCategory}
                counts={counts}
                categories={categories.filter((c) => c.slug !== "all")}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--txt3)]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--txt3)]">Failed to load portfolio. Check back soon.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--txt3)]">
                  No projects in this category yet. Check back soon!
                </p>
              </div>
            ) : (
              <>
                {/* Mobile: swipeable snap slider */}
                <div className="relative pb-6 pt-2 sm:hidden">
                  {/* Ambient glow */}
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[250px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[100px]"
                    style={{
                      background: `radial-gradient(circle, ${filtered[0]?.accent || "#2563EB"} 0%, transparent 70%)`,
                    }}
                  />
                  {/* Cards */}
                  <div
                    className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pl-5 pr-5"
                    style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                  >
                    {filtered.map((item, idx) => (
                      <div key={item.id || idx} className="w-[82vw] shrink-0 snap-start">
                        <PortfolioCard
                          item={item}
                          index={idx}
                          onClick={() => setSelectedItem(item)}
                          onCategoryClick={setActiveCategory}
                        />
                      </div>
                    ))}
                    <div className="w-4 shrink-0" />
                  </div>
                  <p className="mt-2.5 text-center text-[10px] text-[var(--txt3)] opacity-50">
                    ← swipe →
                  </p>
                </div>

                {/* Desktop: marquee auto-scroll */}
                <div className="relative hidden overflow-hidden py-6 sm:block">
                  {/* Ambient glow */}
                  <div
                    className="opacity-8 pointer-events-none absolute left-1/4 top-1/2 h-[200px] w-[400px] -translate-y-1/2 rounded-full blur-[120px]"
                    style={{
                      background: `radial-gradient(circle, ${filtered[0]?.accent || "#2563EB"} 0%, transparent 70%)`,
                    }}
                  />
                  <div
                    className="opacity-6 pointer-events-none absolute right-1/4 top-1/2 h-[200px] w-[400px] -translate-y-1/2 rounded-full blur-[120px]"
                    style={{ background: `radial-gradient(circle, #7C3AED 0%, transparent 70%)` }}
                  />
                  {/* Marquee */}
                  <div className="animate-marquee-slow flex w-max gap-5 px-8">
                    {filtered.length > 0
                      ? [...filtered, ...filtered, ...filtered].map((item, idx) => (
                          <div
                            key={`${item.id}-${idx}`}
                            className="w-[280px] shrink-0 transition-transform duration-300 hover:scale-[1.02] lg:w-[320px]"
                          >
                            <PortfolioCard
                              item={item}
                              index={idx % filtered.length}
                              onClick={() => setSelectedItem(item)}
                              onCategoryClick={setActiveCategory}
                            />
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* CTA — contained */}
        <div className="mx-auto mt-8 flex max-w-[1400px] justify-center px-4 sm:mt-12 sm:px-6 md:px-12">
          <Link href="/portfolio">
            <Button variant="grad" size="lg" rightIcon={<ArrowRight size={15} />}>
              View Full Portfolio
            </Button>
          </Link>
        </div>
      </AnimatedSection>

      {/* ── Modal ──────────────────────────────────────────── */}
      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
