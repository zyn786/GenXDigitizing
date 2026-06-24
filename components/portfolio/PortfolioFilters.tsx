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
  const validSlugs = categories.map(c => c.slug);
  const current = validSlugs.includes(active) ? active : validSlugs[0];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto">
      {categories.map((cat) => {
        const isActive = current === cat.slug;

        return (
          <motion.button
            key={cat.slug}
            onClick={() => onChange(cat.slug)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl
              text-xs sm:text-sm font-semibold transition-all duration-200 border cursor-pointer w-full
              ${isActive
                ? "text-white shadow-lg"
                : "text-[var(--txt2)] hover:text-[var(--txt)] bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border3)]"
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
            <span className="text-sm sm:text-base leading-none flex-shrink-0">{cat.emoji}</span>
            <span className="truncate">{cat.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
