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
    <div className="flex gap-1.5 flex-wrap justify-center mb-10">
      {categories.map((cat) => {
        const isActive = active === cat.slug;
        const count = counts[cat.slug] ?? 0;

        return (
          <button
            key={cat.slug}
            onClick={() => onChange(cat.slug)}
            className={`relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full
              text-xs font-medium transition-all duration-200 border cursor-pointer
              hover:scale-[1.03] active:scale-[0.97]
              ${isActive
                ? "text-[var(--txt)] font-bold shadow-lg"
                : "text-[var(--txt2)] hover:text-[var(--txt)]"
              }`}
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${cat.color}20, ${cat.color}10)`
                : "var(--border)",
              borderColor: isActive ? `${cat.color}50` : "var(--border2)",
              boxShadow: isActive ? `0 0 20px ${cat.color}20` : "none",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}08)`,
                  border: `1px solid ${cat.color}40`,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-sm">{cat.emoji}</span>
            <span className="relative z-10">{cat.name}</span>
            <span
              className={`relative z-10 inline-flex items-center justify-center min-w-[18px] h-4
                rounded-full text-[9px] font-bold px-1
                ${isActive
                  ? "bg-white/15 text-[var(--txt)]"
                  : "bg-[var(--border2)] text-[var(--txt3)]"
                }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
