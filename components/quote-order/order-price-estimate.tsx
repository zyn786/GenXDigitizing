"use client";

import { useMemo } from "react";
import { Sparkles, Tag } from "lucide-react";
import { estimateOrderPrice } from "@/lib/pricing/order-estimate";
import type { QuoteOrderInput } from "@/schemas/quote-order";
import { cn } from "@/lib/utils";

type Props = {
  values: Partial<QuoteOrderInput>;
  eligibleForFree: boolean;
  isAuthenticated: boolean;
  /** Only show when there's enough data for a meaningful estimate */
  compact?: boolean;
  className?: string;
};

export function OrderPriceEstimate({
  values,
  eligibleForFree,
  isAuthenticated,
  compact = false,
  className,
}: Props) {
  const estimate = useMemo(() => {
    if (!values.serviceType) return null;
    return estimateOrderPrice(
      {
        serviceType: values.serviceType,
        placement: values.placement ?? null,
        designWidthIn: values.designWidthIn ?? null,
        designHeightIn: values.designHeightIn ?? null,
        quantity: values.quantity ?? 1,
        is3dPuff: values.threeDPuff || values.is3dPuffJacketBack || false,
        isJacketBack:
          values.is3dPuffJacketBack ||
          values.placement === "JACKET_BACK" ||
          values.placement === "PUFF_JACKET_BACK" ||
          false,
        stitchCount: values.stitchCount ?? null,
        turnaround: values.turnaround ?? "STANDARD",
        colorCount: values.colorQuantity ?? 1,
        isFirstOrder: eligibleForFree,
        isAuthenticated,
      },
    );
  }, [values, eligibleForFree, isAuthenticated]);

  if (!estimate) return null;

  const hasAddons = estimate.addons.length > 0;
  const hasDiscounts = estimate.discounts.length > 0;
  const isFree = estimate.isFirstOrderFreeApplied;
  const showBreakdown = !compact || hasAddons || hasDiscounts || isFree;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card px-4 py-3",
        isFree
          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
          : "border-border/60",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium">Estimated {isFree ? "total" : "price"}</span>
        </div>
        <span
          className={cn(
            "text-lg font-bold tracking-tight",
            isFree
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground",
          )}
        >
          {isFree ? "Free" : `$${estimate.total.toFixed(2)}`}
        </span>
      </div>

      {isFree && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            First order free applied — <strong>$0 due</strong>. Valid for new clients on
            their first digitizing order.
          </span>
        </div>
      )}

      {!isFree && !isAuthenticated && eligibleForFree && (
        <div className="mt-2 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-300">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Log in or create an account to claim your <strong>first order free</strong>.
        </div>
      )}

      {!isFree && isAuthenticated && !eligibleForFree && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          You&apos;ve already used your first-order-free credit. Standard pricing applies.
        </p>
      )}

      {showBreakdown && !isFree && (
        <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
          {/* Base */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Base digitizing</span>
            <span>${estimate.baseAmount.toFixed(2)}</span>
          </div>

          {/* Addons */}
          {estimate.addons.map((a) => (
            <div key={a.label} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{a.label}</span>
              <span>+${a.amount.toFixed(2)}</span>
            </div>
          ))}

          {/* Discounts */}
          {estimate.discounts.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span>{d.label}</span>
              <span>-${Math.abs(d.amount).toFixed(2)}</span>
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-border/30 pt-1.5">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Estimated total</span>
              <span>${estimate.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {compact && !showBreakdown && !isFree && !isAuthenticated && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Select size, placement, and delivery speed for full pricing.
        </p>
      )}

      {/* Disclaimer */}
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/60">
        Final invoice is confirmed by our team after artwork review.
      </p>
    </div>
  );
}
