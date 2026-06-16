"use client";

// ============================================================
// OfferBanner — context-aware promotional banner
// ============================================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap } from "lucide-react";
import { isOfferDismissed, dismissOffer, isTimeInRange } from "@/lib/visitor";
import type { CouponOffer } from "@/types/coupon";

interface OfferBannerProps {
  autoOffers: CouponOffer[];
  isFirstVisitor: boolean;
  appliedCoupon: unknown | null;
  fileCount: number;
}

export function OfferBanner({ autoOffers, isFirstVisitor, appliedCoupon, fileCount }: OfferBannerProps) {
  const [dismissed, setDismissed] = useState(true);
  const [currentOffer, setCurrentOffer] = useState<CouponOffer | null>(null);

  useEffect(() => {
    // Don't show if already dismissed within cooldown
    if (isOfferDismissed("top_banner")) return;

    // Don't show if user already applied a coupon
    if (appliedCoupon) return;

    // Pick best offer
    // Priority: bulk > first_order > time_urgent > rush
    if (!autoOffers?.length) return;
    const bulk = autoOffers.find(o => o.type === "bulk");
    if (bulk && fileCount >= 5) {
      setCurrentOffer(bulk);
      setDismissed(false);
      return;
    }

    const firstOrder = autoOffers.find(o => o.type === "first_order");
    if (firstOrder && isFirstVisitor) {
      setCurrentOffer(firstOrder);
      setDismissed(false);
      return;
    }

    // Time urgency: show between 8AM-2PM
    if (isTimeInRange(8, 14) && !isOfferDismissed("time_urgent", 2 * 60 * 60 * 1000)) {
      setCurrentOffer({
        id: "time_urgent",
        title: "Order in next 2 hours",
        description: "Get in today's queue for fastest delivery",
        discountLabel: "FAST",
        type: "time_urgent",
        isAutoApplied: true,
      });
      setDismissed(false);
      return;
    }

    setDismissed(true);
  }, [autoOffers, isFirstVisitor, appliedCoupon, fileCount]);

  function handleDismiss() {
    setDismissed(true);
    dismissOffer("top_banner");
    if (currentOffer?.type === "time_urgent") {
      dismissOffer("time_urgent");
    }
  }

  if (dismissed || !currentOffer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4 sm:mb-5 overflow-hidden"
      >
        <div className={`rounded-xl px-4 py-3 sm:py-3.5 flex items-center gap-3 ${
          currentOffer.type === "bulk"
            ? "bg-[#16A34A]/5 border border-[#16A34A]/15"
            : currentOffer.type === "first_order"
              ? "bg-[#2563EB]/5 border border-[#2563EB]/15"
              : "bg-[#F97316]/5 border border-[#F97316]/15"
        }`}>
          <span className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/80 flex items-center justify-center">
            {currentOffer.type === "bulk" ? <Sparkles size={15} className="text-[#16A34A]" /> :
             currentOffer.type === "time_urgent" ? <Zap size={15} className="text-[#F97316]" /> :
             <Sparkles size={15} className="text-[#2563EB]" />}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-[12px] sm:text-[13px] font-semibold text-[var(--txt)]">
              {currentOffer.title}
              {currentOffer.discountLabel && (
                <span className={`ml-2 inline-block px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold ${
                  currentOffer.type === "bulk"
                    ? "bg-[#16A34A] text-white"
                    : currentOffer.type === "first_order"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F97316] text-white"
                }`}>{currentOffer.discountLabel}</span>
              )}
            </p>
            <p className="text-[11px] sm:text-[12px] text-[var(--txt2)]">
              {currentOffer.description}
              {currentOffer.couponCode && !currentOffer.isAutoApplied && (
                <span className="ml-1 font-mono font-bold text-[var(--txt)]">{currentOffer.couponCode}</span>
              )}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--txt3)] flex-shrink-0"
            aria-label="Dismiss offer"
          >
            <X size={13} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
