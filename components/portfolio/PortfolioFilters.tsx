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
  return (
    <div className="flex gap-2 flex-wrap justify-center mb-10">
      {categories.map((cat) => {
        const isActive = active === cat.slug;
        const count = counts[cat.slug] ?? 0;

        return (
          <motion.button
            key={cat.slug}
            onClick={() => onChange(cat.slug)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-semibold transition-all duration-200 border cursor-pointer
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
            <span className="text-base leading-none">{cat.emoji}</span>
            <span>{cat.name}</span>
            {count > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1.5 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[var(--elevated)] text-[var(--txt3)]"
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
