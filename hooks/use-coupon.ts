"use client";

// ============================================================
// useCoupon — client-side coupon state management
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { getVisitorState, markVisited, getCouponCookie, setCouponCookie, clearCouponCookie } from "@/lib/visitor";
import type { Coupon, CouponValidationResult, CouponOffer } from "@/types/coupon";

export interface UseCouponReturn {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: Coupon | null;
  discount: number;
  isApplying: boolean;
  error: string | null;
  applyCoupon: () => Promise<void>;
  removeCoupon: () => void;
  isFirstVisitor: boolean;
  visitorId: string;
  autoOffers: CouponOffer[];
}

export function useCoupon(fileCount: number, email?: string): UseCouponReturn {
  const [visitorId, setVisitorId] = useState("");
  const [isFirstVisitor, setIsFirstVisitor] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoOffers, setAutoOffers] = useState<CouponOffer[]>([]);

  // Init visitor on mount
  useEffect(() => {
    const state = getVisitorState();
    setVisitorId(state.visitorId);
    setIsFirstVisitor(state.isNew);
    markVisited();

    // Restore coupon from cookie
    const saved = getCouponCookie();
    if (saved) setCouponCode(saved);
  }, []);

  // Build auto-offers based on context
  useEffect(() => {
    const offers: CouponOffer[] = [];

    if (isFirstVisitor) {
      offers.push({
        id: "first_order",
        title: "First design from $3.50",
        description: "50% off your first order",
        discountLabel: "50% OFF",
        type: "first_order",
        isAutoApplied: false,
        couponCode: "FIRST50",
      });
    }

    if (fileCount >= 10) {
      offers.push({
        id: "bulk_30",
        title: "Bulk discount applied",
        description: "30% off for 10+ designs",
        discountLabel: "30% OFF",
        type: "bulk",
        isAutoApplied: true,
        couponCode: "BULK30",
      });
    } else if (fileCount >= 5) {
      offers.push({
        id: "bulk_20",
        title: "Bulk discount applied",
        description: "20% off for 5+ designs",
        discountLabel: "20% OFF",
        type: "bulk",
        isAutoApplied: true,
        couponCode: "BULK20",
      });
    }

    if (isFirstVisitor) {
      offers.push({
        id: "rush_free",
        title: "Free rush upgrade",
        description: "Get rush delivery free on your first order",
        discountLabel: "FREE",
        type: "rush",
        isAutoApplied: true,
        couponCode: "RUSHFREE",
      });
    }

    setAutoOffers(offers);
  }, [isFirstVisitor, fileCount]);

  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setError("Enter a coupon code");
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          visitorId,
          fileCount,
          email,
        }),
      });

      const result: CouponValidationResult = await res.json();

      if (!result.valid) {
        setError(result.error || "Invalid coupon");
        setAppliedCoupon(null);
        setDiscount(0);
        return;
      }

      setAppliedCoupon(result.coupon || null);
      setDiscount(result.discount || 0);
      setCouponCookie(couponCode);
    } catch {
      setError("Failed to validate coupon");
    } finally {
      setIsApplying(false);
    }
  }, [couponCode, visitorId, fileCount, email]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    setError(null);
    clearCouponCookie();
  }, []);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    discount,
    isApplying,
    error,
    applyCoupon,
    removeCoupon,
    isFirstVisitor,
    visitorId,
    autoOffers,
  };
}
