// ============================================================
// Shared subscription plan configuration
// Single source of truth for plan pricing, design counts, etc.
// ============================================================

export interface PlanConfig {
  designs: number;
  price: number;
  priceAnnual: number;
  label: string;
  emoji: string;
  features: string[];
  savings: string;
  /** Credit cost multiplier: big designs cost this many credits (default 1) */
  creditCostBigDesign: number;
}

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  starter: {
    designs: 10,
    price: 55,
    priceAnnual: 550,
    label: "Starter",
    emoji: "🥉",
    features: [
      "10 Basic Left Chest Designs",
      "Free Minor Edits",
      "PES, DST, EMB & All Formats",
      "12-24 Hour Delivery",
      "Email Support",
    ],
    savings: "20%",
    creditCostBigDesign: 3,
  },
  business: {
    designs: 30,
    price: 169,
    priceAnnual: 1690,
    label: "Business",
    emoji: "🥈",
    features: [
      "30 Basic Designs",
      "Priority Queue",
      "Free Edits",
      "Multiple File Formats",
      "Faster Turnaround",
      "Dedicated Account Manager",
    ],
    savings: "More Every Month",
    creditCostBigDesign: 2,
  },
  pro: {
    designs: 50,
    price: 279,
    priceAnnual: 2790,
    label: "Pro",
    emoji: "🥇",
    features: [
      "50 Basic Designs",
      "Highest Priority",
      "Unlimited Minor Edits",
      "Same-Day Delivery (When Possible)",
      "Dedicated Designer Support",
      "Premium Customer Service",
    ],
    savings: "Best Value",
    creditCostBigDesign: 2,
  },
  pro_max: {
    designs: 80,
    price: 499,
    priceAnnual: 4990,
    label: "Pro Max",
    emoji: "💎",
    features: [
      "80 Basic Designs",
      "Ultra-High Priority",
      "Unlimited Edits & Revisions",
      "Same-Day Delivery Guaranteed",
      "Dedicated Senior Designer",
      "VIP Customer Service",
      "Custom Design Consultation",
    ],
    savings: "Maximum Output",
    creditCostBigDesign: 1,
  },
};

/** Get plan display price as formatted string. */
export function getPlanPrice(plan: string): string {
  const config = PLAN_CONFIG[plan];
  if (!config) return "—";
  return `$${config.price}`;
}

/** Get annual price display. */
export function getAnnualPrice(plan: string): string {
  const config = PLAN_CONFIG[plan];
  if (!config) return "—";
  return `$${config.priceAnnual}`;
}

/** Get credit cost for a design tier. Uses per-tier credit_cost if available, falls back to plan's big-design cost. */
export function getCreditCost(plan: string, isBigDesign: boolean, tierCreditCost?: number | null): number {
  if (tierCreditCost && tierCreditCost > 0) return tierCreditCost;
  if (!isBigDesign) return 1;
  const config = PLAN_CONFIG[plan];
  return config?.creditCostBigDesign ?? 2;
}
