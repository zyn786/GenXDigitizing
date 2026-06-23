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
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPortfolio();
        setItems(data.items);
        const validSlugs = ["digitizing", "vector", "patches"];
        const dbCategories = data.categories.filter((c: any) => validSlugs.includes(c.slug));
        if (dbCategories.length > 0) {
          const merged = dbCategories.map((c: any) => ({
            ...c,
            count: data.items.filter((i: any) => i.category?.slug === c.slug).length,
          }));
          setCategories([
            { id: "all", name: "All Work", slug: "all", emoji: "✦", color: "#2563EB", sortOrder: 0, count: data.items.length },
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
    counts[cat.slug] = cat.slug === "all"
      ? items.length
      : items.filter((i) => i.category?.slug === cat.slug).length;
  }

  return (
    <>

      {/* ── Portfolio Section ─────────────────────────────── */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-[var(--bg)] !px-0">
        {/* Heading + Filters */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            Our Portfolio
          </span>

          {/* Title */}
          <h2 className="font-syne font-bold text-[clamp(32px,5vw,56px)] leading-[1.08] mb-3 text-[var(--txt)]">
            See Our Best{" "}
            <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
              Work
            </span>
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-[var(--txt2)] max-w-lg mx-auto mb-8">
            Professional embroidery digitizing, vector art, and custom patch design — hand-crafted for quality and precision.
          </p>

          {/* Filters */}
          {!loading && !error && (
            <PortfolioFilters
              active={activeCategory}
              onChange={setActiveCategory}
              counts={counts}
              categories={categories}
            />
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--txt3)]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-[var(--txt3)] text-sm">Failed to load portfolio. Check back soon.</p>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--txt3)]">No projects in this category yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {filtered.slice(0, 4).map((item, idx) => (
                  <div key={item.id || idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                    <PortfolioCard
                      item={item}
                      index={idx}
                      onClick={() => setSelectedItem(item)}
                      onCategoryClick={setActiveCategory}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA — contained */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 flex justify-center mt-12">
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
