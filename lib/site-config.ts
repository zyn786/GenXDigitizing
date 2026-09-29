/**
 * Trust claims for the marketing site — single source of truth.
 *
 * Every value here is a POLICY or CAPABILITY claim, provable from this repo:
 *   $7 standard design   -> service_tiers.digitizing_standard
 *   12h turnaround       -> the published policy (see the home-page FAQ)
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
export const SITE_CLAIMS = {
  price: { value: "$7", label: "Standard designs" },
  turnaround: { value: "12h", label: "Standard turnaround" },
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
  "⚡ 12-hour turnaround",
  "♻️ Unlimited free revisions",
  "🌍 All major machine formats",
] as const;

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
