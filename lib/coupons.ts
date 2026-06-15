// @ts-nocheck
// ============================================================
// Coupon validation & redemption logic (server-side)
// ============================================================

import { createAdminClient } from "@/lib/supabase/server";
import type { Coupon, CouponContext, CouponValidationResult } from "@/types/coupon";

/** Validate a coupon code against the database. */
export async function validateCoupon(
  code: string,
  context: CouponContext,
): Promise<CouponValidationResult> {
  const supabase = createAdminClient();
  const normalized = code.trim().toUpperCase();

  // Lookup coupon
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalized)
    .eq("status", "active")
    .single();

  if (error || !coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  const c = coupon as Coupon;

  // Expiry check
  if (c.expires_at && new Date(c.expires_at) < new Date()) {
    return { valid: false, error: "This coupon has expired" };
  }

  // Start date check
  if (c.starts_at && new Date(c.starts_at) > new Date()) {
    return { valid: false, error: "This coupon is not yet active" };
  }

  // Redemption limit check
  if (c.max_redemptions !== null && c.current_redemptions >= c.max_redemptions) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }

  // File count check
  if (context.fileCount < c.min_file_count) {
    return {
      valid: false,
      error: `Upload at least ${c.min_file_count} file${c.min_file_count > 1 ? "s" : ""} to use this coupon`,
    };
  }

  // First-order-only check
  if (c.is_first_order_only) {
    const { count } = await supabase
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", c.id)
      .eq("visitor_id", context.visitorId);

    if (count && count > 0) {
      return { valid: false, error: "This coupon can only be used on your first order" };
    }
  }

  // Calculate discount
  const subtotal = context.orderTotal ?? 7; // default base price $7
  const discount = calculateDiscount(c, subtotal);

  return { valid: true, coupon: c, discount };
}

/** Calculate discount amount from a coupon. */
export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discount_type === "percentage") {
    return Math.round((subtotal * coupon.discount_value) / 100 * 100) / 100;
  }
  // fixed_amount
  return Math.min(coupon.discount_value, subtotal);
}

/** Find auto-applicable coupons based on context (bulk, first-order). */
export async function getAutoCoupons(context: CouponContext): Promise<Coupon[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("status", "active")
    .eq("is_bulk_discount", true)
    .lte("min_file_count", context.fileCount)
    .order("min_file_count", { ascending: false });

  return (data as Coupon[]) ?? [];
}

/** Record a coupon redemption. */
export async function recordRedemption(
  couponId: string,
  visitorId: string,
  email: string | null,
  orderReference: string | null,
  discountAmount: number,
): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from("coupon_redemptions").insert({
    coupon_id: couponId,
    visitor_id: visitorId,
    email,
    order_reference: orderReference,
    discount_amount: discountAmount,
    metadata: { recorded_at: new Date().toISOString() },
  });

  // Atomic increment — avoids read-then-write race condition
  await supabase.rpc("increment_coupon_counter", { coupon_id: couponId });
}
