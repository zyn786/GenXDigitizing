"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Medal, Zap, TrendingUp, Loader2 } from "lucide-react";
import { HorizontalSlider } from "./HorizontalSlider";
import { PortfolioModal } from "./PortfolioModal";
import { PortfolioFilters } from "./PortfolioFilters";
import { fetchPortfolio, DEFAULT_CATEGORIES } from "./data";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/Button";
import type { PortfolioItem, PortfolioCategory } from "./data";

function AnimatedStat({
  value,
  suffix,
  label,
  icon,
}: {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);

  return (
    <div ref={ref} className="text-center">
      <div className="w-10 h-10 rounded-xl bg-white/10
        border border-white/15 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <div className="font-jakarta font-extrabold text-2xl md:text-3xl text-white">
        <motion.span>{display}</motion.span>
        {suffix}
      </div>
      <div className="text-xs text-white/60 mt-1">{label}</div>
    </div>
  );
}

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
      {/* ── Animated Stats Section ────────────────────────── */}
      <AnimatedSection className="pt-16 md:pt-20 pb-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F3460] rounded-3xl p-8 sm:p-10 md:p-14 overflow-hidden">
            {/* Glow orb */}
            <div className="absolute -top-[20%] -right-[10%] w-[300px] h-[300px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-8 sm:mb-10">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs
                  font-semibold uppercase tracking-wider mb-4
                  bg-white/15 text-white border border-white/20">
                  <Sparkles size={12} />
                  Trusted Worldwide
                </span>
                <h2 className="font-jakarta font-extrabold text-2xl md:text-4xl text-white mb-3">
                  Numbers That Speak
                </h2>
                <p className="text-white/70 text-sm max-w-md mx-auto">
                  Every order is hand-digitized by experienced professionals who care about stitch quality.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-3xl mx-auto">
                <AnimatedStat
                  value={5000}
                  suffix="+"
                  label="Orders Completed"
                  icon={<Medal size={16} className="text-white" />}
                />
                <AnimatedStat
                  value={500}
                  suffix="+"
                  label="Clients Worldwide"
                  icon={<TrendingUp size={16} className="text-white" />}
                />
                <AnimatedStat
                  value={4}
                  suffix="h"
                  label="Avg. Delivery"
                  icon={<Zap size={16} className="text-white" />}
                />
                <AnimatedStat
                  value={99}
                  suffix="%"
                  label="Satisfaction"
                  icon={<Sparkles size={16} className="text-white" />}
                />
              </div>

              {/* Trust badges */}
              <div className="flex justify-center gap-2 sm:gap-4 mt-8 sm:mt-10 flex-wrap">
                {[
                  "🧵 Hand-digitized",
                  "✓ Machine-tested",
                  "♾️ Free revisions",
                  "🔄 All formats",
                  "⚡ 3-24h delivery",
                ].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 text-xs font-medium
                      text-white/90 px-3 py-1.5 rounded-full
                      bg-white/10 border border-white/15"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

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
