"use client";

// ============================================================
// CouponInput — coupon code entry with validation feedback
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import type { Coupon } from "@/types/coupon";

interface CouponInputProps {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  onRemove: () => void;
  appliedCoupon: Coupon | null;
  discount: number;
  isApplying: boolean;
  error: string | null;
}

export function CouponInput({
  value,
  onChange,
  onApply,
  onRemove,
  appliedCoupon,
  discount,
  isApplying,
  error,
}: CouponInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-[var(--txt2)] sm:text-xs">
        Coupon Code
      </label>

      <AnimatePresence mode="wait">
        {appliedCoupon ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center gap-3 rounded-xl border border-[#16A34A]/15 bg-[#16A34A]/5 p-3 sm:p-3.5"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#16A34A]/15 sm:h-8 sm:w-8">
              <Check size={14} className="text-[#16A34A]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-[#16A34A] sm:text-[13px]">
                {appliedCoupon.code} applied
              </p>
              {discount > 0 && (
                <p className="text-[11px] text-[var(--txt2)] sm:text-[12px]">
                  {appliedCoupon.discount_type === "percentage"
                    ? `${appliedCoupon.discount_value}% off — save ~$${discount.toFixed(2)}`
                    : `$${discount.toFixed(2)} off`}
                </p>
              )}
            </div>
            <button
              onClick={onRemove}
              className="flex-shrink-0 rounded-lg p-1.5 text-[var(--txt3)] transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApply();
                }}
                placeholder="Enter code (e.g. FIRST50)"
                maxLength={20}
                className="flex-1 rounded-xl border border-[var(--border2)] bg-[var(--surface)] px-4 py-2.5 font-mono text-[13px] uppercase tracking-wide text-[var(--txt)] outline-none transition-all placeholder:text-[var(--txt3)] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 sm:py-3 sm:text-[14px]"
              />
              <button
                type="button"
                onClick={onApply}
                disabled={isApplying || !value.trim()}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#1D4ED8] active:scale-[0.97] disabled:opacity-40 sm:px-5 sm:py-3 sm:text-[14px]"
              >
                {isApplying ? <Loader2 size={14} className="animate-spin" /> : null}
                Apply
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500 sm:text-[12px]"
                >
                  <X size={11} /> {error}
                </motion.p>
              )}
            </AnimatePresence>

            <p className="mt-1.5 text-[10px] text-[var(--txt3)] sm:text-[11px]">
              Try:{" "}
              <button
                type="button"
                onClick={() => {
                  onChange("FIRST50");
                }}
                className="font-mono underline hover:text-[var(--txt)]"
              >
                FIRST50
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => {
                  onChange("BULK20");
                }}
                className="font-mono underline hover:text-[var(--txt)]"
              >
                BULK20
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => {
                  onChange("RUSHFREE");
                }}
                className="font-mono underline hover:text-[var(--txt)]"
              >
                RUSHFREE
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
