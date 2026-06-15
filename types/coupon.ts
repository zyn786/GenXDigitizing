// ============================================================
// Coupon System Types
// ============================================================

export type DiscountType = "percentage" | "fixed_amount";
export type CouponStatus = "active" | "disabled" | "expired";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_file_count: number;
  max_redemptions: number | null;
  current_redemptions: number;
  applies_to: string[];
  is_first_order_only: boolean;
  is_bulk_discount: boolean;
  is_subscribe_offer: boolean;
  starts_at: string | null;
  expires_at: string | null;
  status: CouponStatus;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  visitor_id: string;
  email: string | null;
  order_reference: string | null;
  discount_amount: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CouponContext {
  visitorId: string;
  fileCount: number;
  email?: string;
  orderTotal?: number;
  serviceType?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  error?: string;
}

export interface CouponOffer {
  id: string;
  title: string;
  description: string;
  discountLabel: string;
  type: "first_order" | "bulk" | "rush" | "subscribe" | "time_urgent";
  isAutoApplied: boolean;
  couponCode?: string;
}

// For the upload API payload extension
export interface CouponSubmitData {
  coupon_code?: string;
  coupon_id?: string;
  discount_amount?: number;
  visitor_id?: string;
}
