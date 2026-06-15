"use client";

// ============================================================
// TieredPricingTable — volume discount pricing display
// ============================================================

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

const TIERS = [
  { count: 1, price: 7.0, save: null },
  { count: 3, price: 5.95, save: "15%" },
  { count: 5, price: 5.60, save: "20%" },
  { count: 10, price: 4.90, save: "30%" },
  { count: 20, price: 3.50, save: "50%" },
];

interface TieredPricingTableProps {
  fileCount: number;
}

export function TieredPricingTable({ fileCount }: TieredPricingTableProps) {
  const [expanded, setExpanded] = useState(false);

  const currentTier = [...TIERS].reverse().find(t => fileCount >= t.count) || TIERS[0];

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 text-left hover:bg-[var(--elevated)]/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <div>
            <p className="text-[12px] sm:text-[13px] font-semibold text-[var(--txt)]">
              Volume pricing — save up to 50%
            </p>
            {fileCount > 1 && currentTier.save && (
              <p className="text-[11px] text-[#16A34A] font-medium">
                {fileCount} designs → ${currentTier.price}/design (save {currentTier.save})
              </p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={15} className="text-[var(--txt3)] flex-shrink-0" /> : <ChevronDown size={15} className="text-[var(--txt3)] flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-3 sm:px-4 py-3 sm:py-4">
          <div className="space-y-1">
            {TIERS.map((tier, i) => {
              const isCurrent = fileCount >= tier.count && (i === TIERS.length - 1 || fileCount < TIERS[i + 1].count);
              const isReached = fileCount >= tier.count;
              return (
                <div
                  key={tier.count}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[12px] sm:text-[13px] transition-all ${
                    isCurrent ? "bg-[#2563EB]/8 border border-[#2563EB]/15 font-semibold" :
                    isReached ? "bg-[#16A34A]/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isReached ? "bg-[#16A34A]/15 text-[#16A34A]" : "bg-gray-100 text-gray-400"
                    }`}>
                      {isReached ? "✓" : tier.count}
                    </span>
                    <span className={isCurrent ? "text-[var(--txt)]" : "text-[var(--txt2)]"}>
                      {tier.count} design{tier.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={isCurrent ? "text-[#2563EB] font-bold" : "text-[var(--txt)] font-medium"}>
                      {formatCurrency(tier.price)}/ea
                    </span>
                    {tier.save && (
                      <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold ${
                        isCurrent ? "bg-[#2563EB] text-white" : "bg-[#16A34A]/10 text-[#16A34A]"
                      }`}>
                        Save {tier.save}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] sm:text-[11px] text-[var(--txt3)] mt-3 text-center">
            Prices shown per design. Exact quote after file review.
          </p>
        </div>
      )}
    </div>
  );
}
