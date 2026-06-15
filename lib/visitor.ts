"use client";

// ============================================================
// Visitor detection — localStorage-based, no auth required
// ============================================================

const VISITED_KEY = "gx_visited";
const VISITOR_ID_KEY = "gx_visitor_id";
const OFFER_DISMISSED_KEY = "gx_offer_dismissed_at";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface VisitorState {
  visitorId: string;
  isNew: boolean;
  visitedAt: string | null;
}

/** Get or create visitor state. Call once on mount. */
export function getVisitorState(): VisitorState {
  if (typeof window === "undefined") {
    return { visitorId: "", isNew: true, visitedAt: null };
  }
  const visitedAt = localStorage.getItem(VISITED_KEY);
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  const isNew = !visitedAt;

  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return { visitorId, isNew, visitedAt };
}

/** Mark visitor as having visited. Call after first interaction. */
export function markVisited(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(VISITED_KEY)) {
    localStorage.setItem(VISITED_KEY, new Date().toISOString());
  }
}

/** Check if a specific offer type was dismissed within the cooldown (default 24h). */
export function isOfferDismissed(offerType: string, cooldownMs: number = 24 * 60 * 60 * 1000): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(`${OFFER_DISMISSED_KEY}_${offerType}`);
  if (!raw) return false;
  const dismissedAt = new Date(raw).getTime();
  return Date.now() - dismissedAt < cooldownMs;
}

/** Dismiss an offer type for the cooldown period. */
export function dismissOffer(offerType: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${OFFER_DISMISSED_KEY}_${offerType}`, new Date().toISOString());
}

/** Check if current time is within a range (hours, local time). */
export function isTimeInRange(startHour: number, endHour: number): boolean {
  const h = new Date().getHours();
  return h >= startHour && h < endHour;
}

/** Get coupon code from cookie. */
export function getCouponCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)gx_coupon_code=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Set coupon code cookie (30 days, SameSite=Lax). */
export function setCouponCookie(code: string): void {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setDate(d.getDate() + 30);
  document.cookie = `gx_coupon_code=${encodeURIComponent(code)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

/** Clear coupon code cookie. */
export function clearCouponCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "gx_coupon_code=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}
