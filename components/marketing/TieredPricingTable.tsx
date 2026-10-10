"use client";

// ============================================================
// TieredPricingTable — volume discount pricing display
// ============================================================

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

// Only the tiers that an actual coupon can honour (BULK20 at 5+, BULK30 at 10+
// — see supabase/migrations/013_coupon_system.sql). Do not add a row here that
// no coupon backs: this table renders directly above the wizard's submit
// button, so anything shown is a price promise to the customer.
const TIERS = [
  { count: 1, price: 7.0, save: null },
  { count: 5, price: 5.6, save: "20%" },
  { count: 10, price: 4.9, save: "30%" },
];

interface TieredPricingTableProps {
  fileCount: number;
}

export function TieredPricingTable({ fileCount }: TieredPricingTableProps) {
  const [expanded, setExpanded] = useState(false);

  const currentTier = [...TIERS].reverse().find((t) => fileCount >= t.count) || TIERS[0];

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-[var(--elevated)]/50 flex w-full items-center justify-between gap-3 p-3 text-left transition-colors sm:p-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <div>
            <p className="text-[12px] font-semibold text-[var(--txt)] sm:text-[13px]">
              Volume pricing — save up to 30%
            </p>
            {fileCount > 1 && currentTier.save && (
              <p className="text-[11px] font-medium text-[#16A34A]">
                {fileCount} designs → ${currentTier.price}/design (save {currentTier.save})
              </p>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={15} className="flex-shrink-0 text-[var(--txt3)]" />
        ) : (
          <ChevronDown size={15} className="flex-shrink-0 text-[var(--txt3)]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-3 py-3 sm:px-4 sm:py-4">
          <div className="space-y-1">
            {TIERS.map((tier, i) => {
              const isCurrent =
                fileCount >= tier.count &&
                (i === TIERS.length - 1 || fileCount < TIERS[i + 1].count);
              const isReached = fileCount >= tier.count;
              return (
                <div
                  key={tier.count}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-[12px] transition-all sm:text-[13px] ${
                    isCurrent
                      ? "bg-[#2563EB]/8 border border-[#2563EB]/15 font-semibold"
                      : isReached
                        ? "bg-[#16A34A]/5"
                        : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isReached ? "bg-[#16A34A]/15 text-[#16A34A]" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isReached ? "✓" : tier.count}
                    </span>
                    <span className={isCurrent ? "text-[var(--txt)]" : "text-[var(--txt2)]"}>
                      {tier.count} design{tier.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        isCurrent ? "font-bold text-[#2563EB]" : "font-medium text-[var(--txt)]"
                      }
                    >
                      {formatCurrency(tier.price)}/ea
                    </span>
                    {tier.save && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:text-[11px] ${
                          isCurrent ? "bg-[#2563EB] text-white" : "bg-[#16A34A]/10 text-[#16A34A]"
                        }`}
                      >
                        Save {tier.save}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[10px] text-[var(--txt3)] sm:text-[11px]">
            Prices shown per design. Exact quote after file review.
          </p>
        </div>
      )}
    </div>
  );
}
