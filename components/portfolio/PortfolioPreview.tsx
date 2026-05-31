"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { HorizontalSlider } from "./HorizontalSlider";
import { PortfolioModal } from "./PortfolioModal";
import { PortfolioFilters } from "./PortfolioFilters";
import { fetchPortfolio, DEFAULT_CATEGORIES } from "./data";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeading } from "@/components/shared/SectionHeading";

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
      <AnimatedSection className="py-24 bg-[var(--bg)] !px-0">
        {/* Heading — contained */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <SectionHeading
            label="Our Portfolio"
            labelColor="blue"
            title="See Our Best"
            gradientTitle="Work"
            description="Professional embroidery digitizing, vector art, and custom patch design — hand-crafted for quality and precision."
          />

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
            <HorizontalSlider
              items={filtered}
              onItemClick={setSelectedItem}
              emptyMessage="No projects in this category yet. Check back soon!"
              autoSlide
            />
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
