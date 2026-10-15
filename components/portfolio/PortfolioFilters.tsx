"use client";

import { motion } from "framer-motion";
import type { PortfolioCategory } from "./data";

interface PortfolioFiltersProps {
  active: string;
  onChange: (id: string) => void;
  counts: Record<string, number>;
  categories: PortfolioCategory[];
}

export function PortfolioFilters({ active, onChange, counts, categories }: PortfolioFiltersProps) {
  /**
   * Only fall back when `active` names something that is not offered at all.
   * This used to fall back whenever `active` was missing from the list — and
   * the caller deliberately withholds the "all" entry — so selecting "All
   * Work" highlighted the *first* category while the grid showed everything.
   * "all" is always a real, selectable state, so it is honoured explicitly.
   */
  const validSlugs = categories.map((c) => c.slug);
  const current = active === "all" || validSlugs.includes(active) ? active : validSlugs[0];

  return (
    // Flex-wrap, not a fixed grid: the homepage now renders every category
    // that has work, and a hardcoded 3-column grid stranded the fourth.
    <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
      {categories.map((cat) => {
        const isActive = current === cat.slug;
        const count = counts[cat.slug] ?? 0;

        return (
          <motion.button
            key={cat.slug}
            onClick={() => onChange(cat.slug)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
              isActive
                ? "text-white shadow-lg"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--txt2)] hover:border-[var(--border3)] hover:text-[var(--txt)]"
            }`}
            style={
              isActive
                ? {
                    background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`,
                    borderColor: cat.color,
                    boxShadow: `0 4px 20px ${cat.color}40`,
                  }
                : {}
            }
          >
            <span className="flex-shrink-0 text-sm leading-none sm:text-base">{cat.emoji}</span>
            <span className="whitespace-nowrap">{cat.name}</span>
            {count > 0 && (
              <span
                className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive ? "bg-white/25 text-white" : "bg-[var(--elevated)] text-[var(--txt3)]"
                }`}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
