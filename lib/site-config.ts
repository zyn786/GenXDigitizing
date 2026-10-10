/**
 * Trust claims for the marketing site — single source of truth.
 *
 * Every value here is a POLICY or CAPABILITY claim, provable from this repo:
 *   $7 standard design   -> service_tiers.digitizing_standard
 *   3–24h turnaround     -> the published policy, and lib/sla.ts (the enforced windows)
 *   unlimited revisions  -> the published policy
 *   8 machine formats    -> the output_fmt enum in migration 001
 *
 * RULE: never put a performance metric here that cannot be read from the
 * database. This file previously carried hardcoded counts — 5,000 orders,
 * 500 clients, a 4.9/5 rating from 500 "verified reviews" — that were never
 * true. They rendered across fifteen files including schema.org structured
 * data, which is deceptive advertising (FTC Act §5 and equivalents) and a
 * Google structured-data policy violation that risks a manual action.
 *
 * If you want real numbers on the page, FETCH them. getLiveStats() in
 * app/(marketing)/home/page.tsx already does exactly that and was previously
 * paid for on every homepage load and then thrown away.
 *
 * The honest position is stronger than the invented one: real portfolio work
 * and a clear price beat a rating nobody can verify.
 */
/**
 * Turnaround, stated as the range the system actually schedules.
 *
 * The site said "12-hour turnaround" in about twenty places while
 * `TURNAROUND_HOURS.standard` in lib/sla.ts schedules 24 — so the promise and
 * the enforced deadline disagreed, and the order confirmation email said "12–24h"
 * on top of that. Three numbers for one thing.
 *
 * The range below is the honest one: urgent is 3 hours, standard is 24, and
 * rush sits between. Large designs are quoted at 12 hours
 * (BIG_DESIGN_HOURS) — that is deliberate and unchanged, so a "~12h" claim on a
 * jumbo or full-back design is correct and should stay.
 *
 * Declared before SITE_CLAIMS because SITE_CLAIMS uses it.
 */
export const TURNAROUND_RANGE_LABEL = "3–24h";

export const SITE_CLAIMS = {
  price: { value: "$7", label: "Standard designs" },
  turnaround: { value: TURNAROUND_RANGE_LABEL, label: "Delivery options" },
  revisions: { value: "Free", label: "Unlimited revisions" },
  formats: { value: "8", label: "Machine formats" },
} as const;

/** Ordered for display. Every entry is the same shape as SITE_CLAIMS.x. */
export const SITE_CLAIM_LIST = [
  SITE_CLAIMS.price,
  SITE_CLAIMS.turnaround,
  SITE_CLAIMS.revisions,
  SITE_CLAIMS.formats,
] as const;

/** Short one-liners for footers, badges and dense layouts. */
export const SITE_CLAIM_TAGS = [
  "⭐ $7 standard designs",
  `⚡ ${TURNAROUND_RANGE_LABEL} delivery`,
  "♻️ Unlimited free revisions",
  "🌍 All major machine formats",
] as const;

/**
 * Social preview image, shared by every page that declares its own `openGraph`.
 *
 * Next.js replaces a child's `openGraph` object wholesale rather than merging
 * it with the parent's, so a page that sets its own title and description but
 * no `images` silently ships with NO og:image — the preview card on every share
 * is blank. Three pages did exactly that. Import this instead of re-declaring
 * the dimensions.
 */
export const SITE_OG_IMAGE = {
  url: "/images/black_logo.png",
  width: 1200,
  height: 630,
  alt: "genxdigitizing — Professional Embroidery Digitizing",
} as const;

export const SITE_INFO = {
  name: "genxdigitizing",
  tagline: "Premium Embroidery Digitizing",
  phone: "+18302102135",
  whatsapp: "18302102135",
  email: "order@genxdigitizing.com",
  trustpilotEmail: "genxdigitizing.com+a5c28d839b@invite.trustpilot.com",
  address: {
    street: "1214 New York 55",
    city: "Lagrangeville",
    region: "NY",
    postalCode: "12540",
    country: "US",
  },
  founded: 2024,
  social: {
    instagram: "https://www.instagram.com/genxdigitizing",
    facebook: "https://www.facebook.com/genxdigitizing",
  },
} as const;

/** Format number with commas */
export function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Format number with + suffix */
export function fmtPlus(n: number): string {
  return `${fmt(n)}+`;
}
