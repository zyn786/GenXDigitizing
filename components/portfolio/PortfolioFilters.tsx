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
  // Default to first category if none active or active not in list
  const validSlugs = categories.map((c) => c.slug);
  const current = validSlugs.includes(active) ? active : validSlugs[0];

  return (
    <div className="mx-auto grid max-w-md grid-cols-3 gap-2 sm:gap-3">
      {categories.map((cat) => {
        const isActive = current === cat.slug;

        return (
          <motion.button
            key={cat.slug}
            onClick={() => onChange(cat.slug)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
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
            <span className="truncate">{cat.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
