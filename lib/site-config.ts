/**
 * Centralized site statistics — single source of truth for marketing pages.
 * Every stat displayed on the site MUST reference these values.
 * Update here, updates everywhere.
 *
 * NOTE: Home page fetches live stats via getLiveStats() which may show
 * higher numbers. These values serve as fallback/floor — update quarterly
 * to match actual performance. Last updated: 2026-06-25.
 */
export const SITE_STATS = {
  ordersCompleted: 5000,
  clientsServed: 500,
  satisfactionRate: 99,
  countriesServed: 100,
  avgRating: 4.9,
  avgDeliveryHours: 4,
  verifiedReviews: 500,
} as const;

export const SITE_INFO = {
  name: "genxdigitizing",
  tagline: "Premium Embroidery Digitizing",
  phone: "+18302102135",
  whatsapp: "18302102135",
  email: "hello@genxdigitizing.com",
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
