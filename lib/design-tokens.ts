/**
 * Centralized Design Token System — GenX Digitizing
 *
 * Single source of truth for all visual primitives.
 * Import from here in tailwind.config.ts, components, and anywhere styling lives.
 *
 * NEVER hardcode hex values, pixel values, or z-indices in components.
 * ALWAYS reference these tokens.
 */

// ═══════════════════════════════════════════════════════════════
//  COLORS
// ═══════════════════════════════════════════════════════════════

export const colors = {
  // Surfaces — warm off-white → dark grey
  surface: {
    bg:        "#FAFAF9",
    card:      "#F7F8FF",
    elevated:  "#E5E7EB",
    elevated2: "#D1D5DB",
  },

  // Text — near-black → muted grey
  text: {
    primary:   "#050816",
    secondary: "#374151",
    muted:     "#6B7280",
  },

  // Borders — opacity-based on near-black
  border: {
    subtle: "rgba(5, 8, 22, 0.10)",
    medium: "rgba(5, 8, 22, 0.16)",
    strong: "rgba(5, 8, 22, 0.22)",
  },

  // Brand primaries
  blue: {
    DEFAULT:   "#2563EB",
    light:     "#EFF3FF",
    text:      "#1D4ED8",
    dark:      "#1D4ED8",
  },
  orange: {
    DEFAULT:   "#F97316",
    light:     "#FFF7ED",
    text:      "#C2410C",
    dark:      "#EA580C",
  },
  green: {
    DEFAULT:   "#16A34A",
    light:     "#F0FDF4",
    text:      "#15803D",
    dark:      "#047857",
  },
  red: {
    DEFAULT:   "#DC2626",
    light:     "#FEF2F2",
    text:      "#B91C1C",
    dark:      "#991B1B",
  },

  // Extended palette — used across components
  purple: {
    DEFAULT:   "#7C3AED",
    light:     "rgba(124, 58, 237, 0.10)",
    text:      "#6D28D9",
    dark:      "#5B21B6",
  },
  cyan: {
    DEFAULT:   "#06B6D4",
    light:     "rgba(6, 182, 212, 0.10)",
    text:      "#0E7490",
    dark:      "#0891B2",
  },
  amber: {
    DEFAULT:   "#F59E0B",
    light:     "rgba(245, 158, 11, 0.10)",
    text:      "#92400E",
    dark:      "#D97706",
  },
  rose: {
    DEFAULT:   "#F43F5E",
    light:     "rgba(244, 63, 94, 0.10)",
    text:      "#BE185D",
    dark:      "#DB2777",
  },

  // Semantic aliases
  neutral: {
    DEFAULT:   "#4B5563",
    light:     "#6B7280",
    dark:      "#374151",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//  TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════

export const typography = {
  fontFamily: {
    heading: "var(--font-syne), 'Syne', sans-serif",
    body:    "var(--font-inter), 'Inter', sans-serif",
    mono:    "'JetBrains Mono', 'Fira Code', monospace",
  },

  size: {
    "2xs":  { fontSize: "0.625rem",  lineHeight: "0.875rem",  letterSpacing: "0.02em"  }, // 10px
    xs:     { fontSize: "0.6875rem", lineHeight: "1rem",      letterSpacing: "0.01em"  }, // 11px
    sm:     { fontSize: "0.75rem",   lineHeight: "1.125rem",  letterSpacing: "0"       }, // 12px
    base:   { fontSize: "0.8125rem", lineHeight: "1.375rem",  letterSpacing: "0"       }, // 13px
    md:     { fontSize: "0.875rem",  lineHeight: "1.5rem",    letterSpacing: "0"       }, // 14px
    lg:     { fontSize: "1rem",      lineHeight: "1.625rem",  letterSpacing: "0"       }, // 16px
    xl:     { fontSize: "1.25rem",   lineHeight: "1.75rem",   letterSpacing: "-0.01em" }, // 20px
    "2xl":  { fontSize: "1.5rem",    lineHeight: "2rem",      letterSpacing: "-0.015em"}, // 24px
    "3xl":  { fontSize: "1.875rem",  lineHeight: "2.25rem",   letterSpacing: "-0.02em" }, // 30px
    "4xl":  { fontSize: "2.25rem",   lineHeight: "2.5rem",    letterSpacing: "-0.025em"}, // 36px
  },

  lineHeight: {
    tight:   "1.15",
    snug:    "1.35",
    normal:  "1.5",
    relaxed: "1.625",
    loose:   "1.75",
  },

  letterSpacing: {
    tighter: "-0.025em",
    tight:   "-0.015em",
    normal:  "0",
    wide:    "0.01em",
    wider:   "0.02em",
    widest:  "0.05em",
  },

  weight: {
    light:    "300",
    normal:   "400",
    medium:   "500",
    semibold: "600",
    bold:     "700",
    extrabold:"800",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//  SPACING — 4px base grid
// ═══════════════════════════════════════════════════════════════

export const spacing = {
  0:   "0",
  0.5: "0.125rem", // 2px
  1:   "0.25rem",  // 4px
  1.5: "0.375rem", // 6px
  2:   "0.5rem",   // 8px
  2.5: "0.625rem", // 10px
  3:   "0.75rem",  // 12px
  3.5: "0.875rem", // 14px
  4:   "1rem",     // 16px
  5:   "1.25rem",  // 20px
  6:   "1.5rem",   // 24px
  7:   "1.75rem",  // 28px
  8:   "2rem",     // 32px
  9:   "2.25rem",  // 36px
  10:  "2.5rem",   // 40px
  11:  "2.75rem",  // 44px
  12:  "3rem",     // 48px
  14:  "3.5rem",   // 56px
  16:  "4rem",     // 64px
  20:  "5rem",     // 80px
  24:  "6rem",     // 96px
} as const;

// ═══════════════════════════════════════════════════════════════
//  RADII
// ═══════════════════════════════════════════════════════════════

export const radius = {
  none:    "0",
  sm:      "0.375rem",  // 6px  — badges, small pills
  md:      "0.5rem",    // 8px  — buttons, inputs, small cards
  lg:      "0.625rem",  // 10px — form elements, dropdowns
  xl:      "0.75rem",   // 12px — cards, nav items
  "2xl":   "1rem",      // 16px — modals, large cards
  "3xl":   "1.5rem",    // 24px — section cards, stat cards
  "4xl":   "2rem",      // 32px — hero cards
  full:    "9999px",    // pills, badges, avatars
} as const;

// ═══════════════════════════════════════════════════════════════
//  SHADOWS — elevation scale
// ═══════════════════════════════════════════════════════════════

export const shadows = {
  none:     "none",
  card:     "0 1px 2px rgba(0,0,0,0.04)",
  cardHover:"0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
  dropdown: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
  modal:    "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
  toast:    "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  glow:     "0 0 24px rgba(37,99,235,0.2)",
  glowLg:   "0 0 40px rgba(37,99,235,0.25)",
  inset:    "inset 0 1px 3px rgba(0,0,0,0.04)",
} as const;

// ═══════════════════════════════════════════════════════════════
//  Z-INDEX — layered scale
// ═══════════════════════════════════════════════════════════════

export const zIndex = {
  base:       "0",
  dropdown:   "10",
  sticky:     "20",
  sidebar:    "30",
  overlay:    "40",
  drawer:     "50",
  modal:      "60",
  toast:      "100",
  tooltip:    "150",
  topmost:    "200",
  debug:      "9999",
} as const;

// ═══════════════════════════════════════════════════════════════
//  MOTION
// ═══════════════════════════════════════════════════════════════

export const motion = {
  duration: {
    instant:  "100ms",
    fast:     "150ms",
    normal:   "200ms",
    slow:     "300ms",
    slower:   "500ms",
    slowest:  "800ms",
  },
  easing: {
    default:    "ease-out",
    spring:     "cubic-bezier(0.22, 1, 0.36, 1)",
    easeInOut:  "ease-in-out",
    linear:     "linear",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//  GRADIENTS
// ═══════════════════════════════════════════════════════════════

export const gradients = {
  brand:      "linear-gradient(135deg, #2563EB, #F97316)",
  blue:       "linear-gradient(135deg, #2563EB, #1D4ED8)",
  warm:       "linear-gradient(135deg, #F97316, #2563EB)",
  full:       "linear-gradient(135deg, #2563EB, #1D4ED8, #F97316)",
  success:    "linear-gradient(135deg, #16A34A, #15803D)",
  purple:     "linear-gradient(135deg, #7C3AED, #D946EF)",
  greenBlue:  "linear-gradient(135deg, #10B981, #06B6D4)",
  indigoBlue: "linear-gradient(135deg, #6366F1, #3B82F6)",
  orangeRed:  "linear-gradient(135deg, #E76F2E, #EF4444)",
} as const;

// ═══════════════════════════════════════════════════════════════
//  BREAKPOINTS
// ═══════════════════════════════════════════════════════════════

export const breakpoints = {
  sm:    "640px",
  md:    "768px",
  lg:    "1024px",
  xl:    "1280px",
  "2xl": "1536px",
} as const;

// ═══════════════════════════════════════════════════════════════
//  COMPONENT-SPECIFIC TOKENS
// ═══════════════════════════════════════════════════════════════

// Card stat colors — used by stat cards across all portals
export const STAT_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)",   border: "rgba(59,130,246,0.20)",   icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)",   border: "rgba(16,185,129,0.20)",   icon: "#059669", text: "#047857" },
  { bg: "#F59E0B", bgSoft: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.20)",   icon: "#D97706", text: "#92400E" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)",    border: "rgba(6,182,212,0.20)",    icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)",   border: "rgba(139,92,246,0.20)",   icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)",    border: "rgba(236,72,153,0.20)",    icon: "#DB2777", text: "#BE185D" },
] as const;

// Notification type colors
export const NOTIF_COLORS: Record<string, typeof STAT_COLORS[number]> = {
  order_update: STAT_COLORS[0],
  payment:      STAT_COLORS[1],
  sla_warning:  STAT_COLORS[2],
  system:       STAT_COLORS[3],
  message:      STAT_COLORS[4],
  review:       STAT_COLORS[5],
};

// Turnaround priority colors
export const TURNAROUND_COLORS = {
  urgent:   { bg: "#EF4444", bgSoft: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   icon: "#DC2626", text: "#B91C1C", glow: "rgba(239,68,68,0.20)" },
  rush:     { bg: "#F59E0B", bgSoft: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  icon: "#D97706", text: "#92400E", glow: "rgba(245,158,11,0.20)" },
  standard: { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  icon: "#059669", text: "#047857", glow: "rgba(16,185,129,0.20)" },
} as const;

// Tab filter colors
export const TAB_COLORS: Record<string, { bg: string; bgSoft: string; border: string; text: string; glow: string }> = {
  all:        { bg: "#6366F1", bgSoft: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.25)",  text: "#4338CA", glow: "rgba(99,102,241,0.20)" },
  approved:   { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.25)",   text: "#0E7490", glow: "rgba(6,182,212,0.20)" },
  delivered:  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  text: "#047857", glow: "rgba(16,185,129,0.20)" },
  urgent:     { bg: "#EF4444", bgSoft: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   text: "#B91C1C", glow: "rgba(239,68,68,0.20)" },
  rush:       { bg: "#F59E0B", bgSoft: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  text: "#92400E", glow: "rgba(245,158,11,0.20)" },
  standard:   { bg: "#6366F1", bgSoft: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.25)",  text: "#4338CA", glow: "rgba(99,102,241,0.20)" },
  fiveStar:   { bg: "#F59E0B", bgSoft: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  text: "#92400E", glow: "rgba(245,158,11,0.20)" },
} as const;

// Role-specific gradients (avatars, profile strips)
export const ROLE_GRADIENTS: Record<string, string> = {
  admin:    "linear-gradient(135deg, #3B82F6, #6366F1)",
  client:   "linear-gradient(135deg, #0EA5E9, #06B6D4)",
  crm:      "linear-gradient(135deg, #6366F1, #8B5CF6)",
  designer: "linear-gradient(135deg, #10B981, #06B6D4)",
} as const;

export const ROLE_COLORS: Record<string, string> = {
  admin:    "#3B82F6",
  client:   "#0EA5E9",
  crm:      "#6366F1",
  designer: "#10B981",
} as const;

// ═══════════════════════════════════════════════════════════════
//  VISUAL LANGUAGE — how to use tokens together
// ═══════════════════════════════════════════════════════════════

/**
 * Card Philosophy
 * ─────────────────
 * All cards: rounded-2xl (16px), p-5 (20px), bg-surface, border-[var(--border)]
 * Stat cards: rounded-2xl (16px), p-4 (16px), bg-elevated, lift hover
 * Info cards: rounded-xl (12px), p-4, bg-elevated
 * Modals: rounded-2xl (16px), p-6 (24px), shadow-modal
 *
 * One card style across the entire product. No rounded-[14px], no custom radii.
 */

/**
 * Glow Philosophy
 * ─────────────────
 * Card hover glow: accent color at 15% opacity, 60px blur
 * Brand glow: shadows.glow (24px, 20% blue) — for CTAs, active states
 * Brand glow large: shadows.glowLg (40px, 25% blue) — for hero sections
 * Tab active glow: per TAB_COLORS[tab].glow — 12px, per-color
 *
 * Every glow uses the same pattern: color + blur radius + 0.15-0.25 opacity.
 * No glow should be hardcoded. Use shadows.* or TAB_COLORS[].glow.
 */

/**
 * Button Philosophy
 * ─────────────────
 * All buttons: CVA Button component only. No CSS .btn classes. No raw <button> with inline styles.
 * Primary (grad): #2563EB bg → #1D4ED8 hover, translateY(-1px), shadow-md
 * Secondary (ghost): #4B5563 bg → #374151 hover
 * Tertiary (ghost2): transparent, text-var(--txt3) → text-var(--txt)
 * Outline: transparent, blue border → blue bg on hover
 * Danger: #DC2626 bg → #B91C1C hover
 * All: active scale(0.97), focus-visible ring, 200ms transition
 */

/**
 * Motion Philosophy
 * ─────────────────
 * Hover/Fade/Slide/Scale: CSS transitions only (150-300ms ease-out)
 * Press feedback: CSS active:scale(0.97)
 * Scroll reveals: CSS animate-fade-in-up (zero JS)
 * Layout animations: framer-motion layoutId (tab indicators, nav active bar)
 * Enter/Exit transitions: framer-motion AnimatePresence (modals, toasts, menus)
 * Complex choreography: framer-motion (spring counters, drag interactions)
 *
 * Rule: if it can be CSS, it MUST be CSS. framer-motion only for layoutId + AnimatePresence.
 */

/**
 * Icon Philosophy
 * ─────────────────
 * UI icons: lucide-react exclusively. Size: 14-20px. Color: currentColor or token.
 * Decorative/emotional: emoji only (empty states, category labels).
 * Never mix emoji icons with lucide icons in the same visual group.
 */

/**
 * Grid Philosophy
 * ─────────────────
 * Stat cards: grid-cols-2 sm:grid-cols-4 gap-3 (2 on mobile, 4 on desktop)
 * Content cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
 * Form layouts: grid-cols-1 sm:grid-cols-2 gap-4
 * Page container: max-w-[900px] mx-auto (portals), max-w-[1400px] mx-auto (marketing)
 * Content padding: px-3 sm:px-4 md:px-6 py-4 sm:py-5 (portals)
 *
 * All gaps: 12-16px (gap-3 to gap-4). Never gap-2 for content cards.
 */

export const VISUAL_LANGUAGE = {
  card: {
    radius:     radius["2xl"],
    padding:    spacing[5],
    background: "var(--surface)",
    border:     "var(--border)",
    shadow:     shadows.card,
    hoverLift:  "translateY(-2px)",
  },
  statCard: {
    radius:     radius["2xl"],
    padding:    spacing[4],
    background: "var(--elevated)",
    border:     "var(--border)",
  },
  infoCard: {
    radius:     radius.xl,
    padding:    spacing[4],
    background: "var(--elevated)",
  },
  glow: {
    cardHover:  "0 20px 60px ${accent}15",
    brand:      shadows.glow,
    brandLg:    shadows.glowLg,
  },
  grid: {
    stats:  "grid-cols-2 sm:grid-cols-4 gap-3",
    cards:  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    form:   "grid-cols-1 sm:grid-cols-2 gap-4",
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//  TOKEN MAP — for tailwind.config.ts import
// ═══════════════════════════════════════════════════════════════

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  zIndex,
  motion,
  gradients,
  breakpoints,
} as const;

export type Tokens = typeof tokens;
