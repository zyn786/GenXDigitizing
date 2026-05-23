"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { Button } from "@/components/ui/Button";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { PortfolioModal } from "@/components/portfolio/PortfolioModal";
import { fetchPortfolio, DEFAULT_CATEGORIES, SUB_CATEGORIES } from "@/components/portfolio/data";
import type { PortfolioItem, PortfolioCategory } from "@/components/portfolio/data";

export function PortfolioClient() {
  const [active, setActive] = useState("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<PortfolioCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetchPortfolio()
      .then((data) => {
        setItems(data.items);
        const validSlugs = ["digitizing", "vector", "patches"];
        const filteredCats = data.categories.filter((c: any) => validSlugs.includes(c.slug));
        if (filteredCats.length) setCategories(filteredCats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryChange = (slug: string) => {
    setActive(slug);
    setActiveSub(null);
  };

  const mainCategories = [
    { slug: "all", name: "All Work", emoji: "✦", color: "#2563EB" },
    ...categories.filter((c) => c.slug !== "all"),
  ];

  const subs = active !== "all" ? (SUB_CATEGORIES[active] || []) : [];

  const filtered = items.filter((i) => {
    if (active !== "all" && i.category?.slug !== active) return false;
    if (activeSub && !i.tags?.includes(activeSub)) return false;
    return true;
  });

  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      {/* HERO */}
      <div className="relative text-center py-10 sm:py-12 md:py-14 px-4 sm:px-6 overflow-hidden">
        <GradientOrb color="#2563EB" size={280} className="-top-[30%] -left-[10%]" />
        <GradientOrb color="#F97316" size={200} className="top-[10%] -right-[5%]" />

        <span className="inline-flex px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
          bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-4">
          Our Portfolio
        </span>

        <h1 className="font-syne font-extrabold text-[clamp(32px,7vw,70px)] leading-[1.05] mb-3 sm:mb-4">
          Our{" "}
          <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
            Work
          </span>
        </h1>

        <p className="text-[var(--txt2)] max-w-[540px] mx-auto text-sm sm:text-base">
          Real embroidery work — digitized, tested, and production-ready.
        </p>
      </div>

      {/* Main category filters */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-8 px-4 sm:px-6">
        {mainCategories.map((c) => {
          const isSel = active === c.slug;
          const count = c.slug === "all"
            ? items.length
            : items.filter((i) => i.category?.slug === c.slug).length;

          return (
            <button
              key={c.slug}
              onClick={() => handleCategoryChange(c.slug)}
              className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 border"
              style={{
                background: isSel
                  ? "linear-gradient(135deg, #2563EB, #F97316)"
                  : "var(--surface)",
                color: isSel ? "#fff" : "var(--txt2)",
                borderColor: isSel ? "transparent" : "var(--border2)",
              }}
            >
              {c.emoji} {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Sub-category chips */}
      {subs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-6 sm:mb-8 px-4 sm:px-6">
          <button
            onClick={() => setActiveSub(null)}
            className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-medium transition-all duration-200 border"
            style={{
              background: !activeSub ? "#2563EB" : "var(--surface)",
              color: !activeSub ? "#fff" : "var(--txt2)",
              borderColor: !activeSub ? "transparent" : "var(--border2)",
            }}
          >
            All {categories.find((c) => c.slug === active)?.name || ""}
          </button>
          {subs.map((sub) => {
            const isSubSel = activeSub === sub;
            const subCount = items.filter(
              (i) => i.category?.slug === active && i.tags?.includes(sub)
            ).length;
            return (
              <button
                key={sub}
                onClick={() => setActiveSub(isSubSel ? null : sub)}
                className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-medium transition-all duration-200 border"
                style={{
                  background: isSubSel ? "#F97316" : "var(--surface)",
                  color: isSubSel ? "#fff" : "var(--txt2)",
                  borderColor: isSubSel ? "transparent" : "var(--border2)",
                }}
              >
                {sub} ({subCount})
              </button>
            );
          })}
        </div>
      )}

      {/* Portfolio content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[var(--txt3)]" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-[var(--txt3)] text-sm">No projects in this category yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Mobile: single column scroll */}
            <div className="flex flex-col lg:hidden gap-3 sm:gap-4">
              {filtered.map((item, i) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  index={i}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
            {/* Desktop: horizontal scroll */}
            <div className="hidden lg:flex gap-5 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pb-4 scrollbar-none"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {filtered.map((item, i) => (
                <div key={item.id} className="snap-start flex-shrink-0 w-[340px] xl:w-[380px]">
                  <PortfolioCard
                    item={item}
                    index={i}
                    onClick={() => setSelectedItem(item)}
                  />
                </div>
              ))}
              <div className="flex-shrink-0 w-1" />
            </div>
          </>
        )}

      </div>

      {/* Final CTA */}
      <section className="py-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] border border-[#2563EB]/20 bg-gradient-to-br from-[#2563EB]/10 via-white/40 to-[#F97316]/10 p-8 sm:p-12 md:p-16 text-center shadow-[0_0_60px_rgba(37,99,235,0.1)]">
            <div className="relative z-10">
              <div className="text-[56px] mb-4">🧵</div>
              <h2 className="font-syne font-extrabold text-2xl sm:text-3xl md:text-4xl mb-4">Ready to get started?</h2>
              <p className="text-base sm:text-lg text-[var(--txt2)] mb-8 max-w-[480px] mx-auto">
                From <strong className="text-[#F97316]">$7</strong> per design. Free revisions. Free formats. Delivered in hours.
              </p>
              <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-4">
                <Link href="/login">
                  <Button variant="ghost" size="md" className="lg:size-lg">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="grad" size="md" className="lg:size-lg" rightIcon={<ArrowRight size={15} />}>
                    Register Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
