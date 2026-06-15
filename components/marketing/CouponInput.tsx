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
      <label className="block text-[11px] sm:text-xs font-semibold text-[var(--txt2)] mb-1.5">
        Coupon Code
      </label>

      <AnimatePresence mode="wait">
        {appliedCoupon ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[#16A34A]/5 border border-[#16A34A]/15"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#16A34A]/15 flex items-center justify-center flex-shrink-0">
              <Check size={14} className="text-[#16A34A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] sm:text-[13px] font-semibold text-[#16A34A]">
                {appliedCoupon.code} applied
              </p>
              {discount > 0 && (
                <p className="text-[11px] sm:text-[12px] text-[var(--txt2)]">
                  {appliedCoupon.discount_type === "percentage"
                    ? `${appliedCoupon.discount_value}% off — save ~$${discount.toFixed(2)}`
                    : `$${discount.toFixed(2)} off`}
                </p>
              )}
            </div>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--txt3)] hover:text-red-500 transition-colors flex-shrink-0"
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
                onChange={e => onChange(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === "Enter") onApply(); }}
                placeholder="Enter code (e.g. FIRST50)"
                maxLength={20}
                className="flex-1 rounded-xl px-4 py-2.5 sm:py-3 text-[13px] sm:text-[14px] border border-[var(--border2)] bg-[var(--surface)] text-[var(--txt)] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 placeholder:text-[var(--txt3)] uppercase font-mono tracking-wide transition-all"
              />
              <button
                type="button"
                onClick={onApply}
                disabled={isApplying || !value.trim()}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#2563EB] text-white font-semibold text-[13px] sm:text-[14px] hover:bg-[#1D4ED8] active:scale-[0.97] transition-all disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
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
                  className="text-[11px] sm:text-[12px] text-red-500 mt-1.5 flex items-center gap-1"
                >
                  <X size={11} /> {error}
                </motion.p>
              )}
            </AnimatePresence>

            <p className="text-[10px] sm:text-[11px] text-[var(--txt3)] mt-1.5">
              Try: <button type="button" onClick={() => { onChange("FIRST50"); }} className="underline hover:text-[var(--txt)] font-mono">FIRST50</button>
              {" · "}
              <button type="button" onClick={() => { onChange("BULK20"); }} className="underline hover:text-[var(--txt)] font-mono">BULK20</button>
              {" · "}
              <button type="button" onClick={() => { onChange("RUSHFREE"); }} className="underline hover:text-[var(--txt)] font-mono">RUSHFREE</button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
