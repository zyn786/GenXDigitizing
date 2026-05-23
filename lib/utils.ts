// @ts-nocheck
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  OrderStatus,
  ServiceType,
  Priority,
  ClientTier,
  PayStatus,
  LeadStage,
  Turnaround,
  ServiceCategory,
} from "@/types";

// ── Tailwind class merging ─────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Service definitions ────────────────────────────────────────

export const SERVICE_CATEGORIES: Record<
  ServiceCategory,
  { label: string; emoji: string; color: string; gradient: string }
> = {
  digitizing: {
    label: "Embroidery Digitizing",
    emoji: "🧵",
    color: "#2563EB",
    gradient: "linear-gradient(135deg,#2563EB,#1D4ED8)",
  },
  vector: {
    label: "Vector Redraw",
    emoji: "✏️",
    color: "#F97316",
    gradient: "linear-gradient(135deg,#F97316,#EA580C)",
  },
  sewout: {
    label: "Patch Design",
    emoji: "🏷️",
    color: "#16A34A",
    gradient: "linear-gradient(135deg,#16A34A,#15803D)",
  },
};

export const DEFAULT_PRICES: Record<string, number> = {
  digitizing_standard: 7,
  digitizing_large:    18,
  digitizing_jumbo:    25,
  vector_basic:        8,
  vector_standard:     15,
  vector_complex:      30,
  sewout_standard:     5,
  sewout_large:        10,
  sewout_jumbo:        15,
};

export const SERVICE_TIERS = [
  { id: "digitizing_standard", category: "digitizing" as ServiceCategory, label: "Standard Design",       size: '4″–8″',         est: "12–24h", isBigDesign: false, sortOrder: 1 },
  { id: "digitizing_large",    category: "digitizing" as ServiceCategory, label: "Large Design",          size: '8″–12″',        est: "12–24h", isBigDesign: false, sortOrder: 2 },
  { id: "digitizing_jumbo",    category: "digitizing" as ServiceCategory, label: "Jumbo / Full Back",     size: '12″+',          est: "~12h",   isBigDesign: true,  sortOrder: 3 },
  { id: "vector_basic",        category: "vector"     as ServiceCategory, label: "Basic Logo",            size: "Up to 2 colors",est: "12–24h", isBigDesign: false, sortOrder: 4 },
  { id: "vector_standard",     category: "vector"     as ServiceCategory, label: "Standard",              size: "Up to 5 colors",est: "12–24h", isBigDesign: false, sortOrder: 5 },
  { id: "vector_complex",      category: "vector"     as ServiceCategory, label: "Complex Illustration",  size: "Multi-color",   est: "~12h",   isBigDesign: true,  sortOrder: 6 },
  { id: "sewout_standard",     category: "sewout"     as ServiceCategory, label: "Standard Design",       size: '4″–8″',         est: "12–24h", isBigDesign: false, sortOrder: 7 },
  { id: "sewout_large",        category: "sewout"     as ServiceCategory, label: "Large Design",          size: '8″–12″',        est: "12–24h", isBigDesign: false, sortOrder: 8 },
  { id: "sewout_jumbo",        category: "sewout"     as ServiceCategory, label: "Jumbo / Full Back",     size: '12″+',          est: "~12h",   isBigDesign: true,  sortOrder: 9 },
];

export const TURNAROUND_OPTIONS: Record<string, { label: string; time: string; icon: string; color: string; note: string }> = {
  standard: { label: "Standard", time: "12–24 hours", icon: "🕐", color: "#2563EB", note: "Default for all orders" },
  rush:     { label: "Rush",     time: "6 hours",     icon: "⚡", color: "#F97316", note: "Most designs eligible"  },
  urgent:   { label: "Urgent",   time: "3 hours",     icon: "🔥", color: "#DC2626", note: "Standard & vector only" },
};

export const OUTPUT_FORMATS = [
  "DST", "PES", "EMB", "JEF", "XXX", "VIP", "HUS", "EXP", "VP3", "SEW",
  "AI", "SVG", "EPS", "PDF",
] as const;

// ── Status / Tier styles ────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
  submitted:   "Submitted",
  assigned:    "Assigned",
  in_progress: "In Progress",
  review:      "QA Review",
  approved:    "Approved",
  delivered:   "Delivered",
  revision:    "Revision",
  refunded:    "Refunded",
  cancelled:   "Cancelled",
};

export const STATUS_CLASS: Record<string, string> = {
  submitted:   "bg-[#E76F2E]/15 text-[#E76F2E]   border-[#E76F2E]/30",
  assigned:    "bg-[#2FA4D7]/15 text-[#2FA4D7]   border-[#2FA4D7]/30",
  in_progress: "bg-blue-400/15  text-blue-300     border-blue-400/30",
  review:      "bg-yellow-400/15 text-yellow-300  border-yellow-400/30",
  approved:    "bg-cyan-400/15  text-cyan-300    border-cyan-400/30",
  delivered:   "bg-green-500/15 text-green-400    border-green-500/30",
  revision:    "bg-purple-400/15 text-purple-300  border-purple-400/30",
  refunded:    "bg-gray-400/15  text-gray-400     border-gray-400/30",
  cancelled:   "bg-red-500/15   text-red-400      border-red-500/30",
};

export const PRIORITY_CLASS: Record<Priority, string> = {
  high:   "bg-[#E76F2E]/15 text-[#E76F2E] border-[#E76F2E]/30",
  medium: "bg-[#2FA4D7]/15 text-[#2FA4D7] border-[#2FA4D7]/30",
  low:    "bg-white/8      text-slate-400  border-white/15",
};

export const TIER_CLASS: Record<string, string> = {
  vip:    "bg-[#E76F2E]/15 text-[#E76F2E] border-[#E76F2E]/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  new:    "bg-[#2FA4D7]/15 text-[#2FA4D7] border-[#2FA4D7]/30",
};

export const PAY_CLASS: Record<PayStatus, string> = {
  paid:     "bg-green-500/15  text-green-400  border-green-500/30",
  pending:  "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  refunded: "bg-gray-400/15   text-gray-400   border-gray-400/30",
  failed:   "bg-red-500/15    text-red-400    border-red-500/30",
};

export const LEAD_STAGE_CLASS: Record<LeadStage, string> = {
  lead:        "bg-[#2FA4D7]/15 text-[#2FA4D7]  border-[#2FA4D7]/30",
  contacted:   "bg-purple-400/15 text-purple-300 border-purple-400/30",
  quote_sent:  "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  negotiation: "bg-[#E76F2E]/15 text-[#E76F2E]  border-[#E76F2E]/30",
  won:         "bg-green-500/15 text-green-400   border-green-500/30",
  lost:        "bg-red-500/15   text-red-400     border-red-500/30",
};

// ── Formatters ─────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = "USD",
  compact = false
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  return new Intl.DateTimeFormat("en-US", opts).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelative(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) { return "just now"; }
  if (m < 60) { return `${m}m ago`; }
  const h = Math.floor(m / 60);
  if (h < 24) { return `${h}h ago`; }
  const d = Math.floor(h / 24);
  if (d < 7) { return `${d}d ago`; }
  return formatDate(date);
}

export function formatFileSize(kb: number): string {
  if (kb < 1024) { return `${kb} KB`; }
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatStitchCount(count: number): string {
  return count.toLocaleString("en-US");
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── SLA helpers ────────────────────────────────────────────────

export function isOverdue(deadline?: string | null): boolean {
  if (!deadline) { return false; }
  return new Date(deadline) < new Date();
}

export function hoursUntilDeadline(deadline?: string | null): number | null {
  if (!deadline) { return null; }
  return Math.round((new Date(deadline).getTime() - Date.now()) / 3_600_000);
}

export function slaStatusColor(deadline?: string | null): string {
  const h = hoursUntilDeadline(deadline);
  if (h === null) { return "text-slate-400"; }
  if (h < 0)  { return "text-red-400"; }
  if (h < 2)  { return "text-red-400"; }
  if (h < 4)  { return "text-[#E76F2E]"; }
  return "text-green-400";
}

export function calculateSLADeadline(turnaround: Turnaround, isBigDesign: boolean): Date {
  const now = new Date();
  const hoursMap: Record<Turnaround, number> = {
    standard: isBigDesign ? 12 : 24,
    rush:     isBigDesign ? 12 : 6,
    urgent:   isBigDesign ? 12 : 3,
  };
  const hours = hoursMap[turnaround];
  return new Date(now.getTime() + hours * 3_600_000);
}

// ── Misc ───────────────────────────────────────────────────────

export function pct(part: number, total: number, decimals = 0): number {
  if (total === 0) { return 0; }
  return Number(((part / total) * 100).toFixed(decimals));
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) { return str; }
  return str.slice(0, maxLength - 3) + "…";
}
