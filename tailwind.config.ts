import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:        "var(--bg)",
          surface:   "var(--surface)",
          elevated:  "var(--elevated)",
          elevated2: "var(--elevated2)",
          txt:       "var(--txt)",
          txt2:      "var(--txt2)",
          txt3:      "var(--txt3)",
          border:    "var(--border)",
          border2:   "var(--border2)",
          border3:   "var(--border3)",
          blue:    "var(--blue)",
          orange:  "var(--orange)",
          success: "var(--success)",
          red:     "var(--red)",
        },
        primary: {
          DEFAULT: "#2563EB",
          light: "#EFF3FF",
          dark: "#1D4ED8",
        },
        accent: {
          DEFAULT: "#F97316",
          light: "#FFF7ED",
          dark: "#C2410C",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#F0FDF4",
          dark: "#15803D",
        },
        grey: {
          DEFAULT: "#6B7280",
          light: "#9CA3AF",
          dark: "#4B5563",
        },
        purple: {
          DEFAULT: "#7C3AED",
          light: "rgba(124, 58, 237, 0.10)",
          dark: "#5B21B6",
        },
        cyan: {
          DEFAULT: "#06B6D4",
          light: "rgba(6, 182, 212, 0.10)",
          dark: "#0891B2",
        },
        amber: {
          DEFAULT: "#F59E0B",
          light: "rgba(245, 158, 11, 0.10)",
          dark: "#D97706",
        },
        rose: {
          DEFAULT: "#F43F5E",
          light: "rgba(244, 63, 94, 0.10)",
          dark: "#DB2777",
        },
      },

      fontFamily: {
        syne: ["var(--font-syne)", "'Syne'", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      // ── Typography Scale ──────────────────────────────────
      // Strict 10-step scale. Use these, not arbitrary text-[Npx].
      fontSize: {
        "2xs":   ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.02em" }], // 10px — captions, overlines
        xs:      ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],      // 11px — small labels
        sm:      ["0.75rem",  { lineHeight: "1.125rem" }],                              // 12px — small body
        base:    ["0.8125rem", { lineHeight: "1.375rem" }],                              // 13px — body
        md:      ["0.875rem",  { lineHeight: "1.5rem" }],                                // 14px — large body
        lg:      ["1rem",     { lineHeight: "1.625rem" }],                               // 16px — subtitle
        xl:      ["1.25rem",  { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],     // 20px — h4
        "2xl":   ["1.5rem",   { lineHeight: "2rem", letterSpacing: "-0.015em" }],       // 24px — h3
        "3xl":   ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],     // 30px — h2
        "4xl":   ["2.25rem",  { lineHeight: "2.5rem", letterSpacing: "-0.025em" }],     // 36px — h1
      },

      // ── Spacing Rhythm — 4px base ─────────────────────────
      spacing: {
        "0":   "0",
        "0.5": "0.125rem", // 2px
        "1":   "0.25rem",  // 4px
        "1.5": "0.375rem", // 6px
        "2":   "0.5rem",   // 8px
        "2.5": "0.625rem", // 10px
        "3":   "0.75rem",  // 12px
        "3.5": "0.875rem", // 14px
        "4":   "1rem",     // 16px
        "5":   "1.25rem",  // 20px
        "6":   "1.5rem",   // 24px
        "7":   "1.75rem",  // 28px
        "8":   "2rem",     // 32px
        "9":   "2.25rem",  // 36px
        "10":  "2.5rem",   // 40px
        "11":  "2.75rem",  // 44px
        "12":  "3rem",     // 48px
        "14":  "3.5rem",   // 56px
        "16":  "4rem",     // 64px
        "20":  "5rem",     // 80px
        "24":  "6rem",     // 96px
      },

      // ── Line Heights ──────────────────────────────────────
      lineHeight: {
        tight:    "1.15",
        snug:     "1.35",
        normal:   "1.5",
        relaxed:  "1.625",
        loose:    "1.75",
      },

      // ── Letter Spacing ────────────────────────────────────
      letterSpacing: {
        tighter: "-0.025em",
        tight:   "-0.015em",
        normal:  "0",
        wide:    "0.01em",
        wider:   "0.02em",
        widest:  "0.05em",
      },

      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl:    "0.75rem",
        lg:    "0.625rem",
        md:    "0.5rem",
        sm:    "0.375rem",
      },

      animation: {
        "marquee":      "marquee 35s linear infinite",
        "marquee-rev":  "marqueeReverse 35s linear infinite",
        "float":        "float 8s ease-in-out infinite",
        "fade-in-up":   "fade-in-up 0.4s ease-out both",
        "pulse-success": "pulse-success 0.6s ease-out",
        shimmer:          "shimmer 2s ease-in-out infinite",
        "gradient-shimmer": "gradient-shimmer 3s ease-in-out infinite",
        "scale-in":       "scale-in 0.2s ease-out both",
      },
      keyframes: {
        marquee:      { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        marqueeReverse: { from: { transform: "translateX(-50%)" }, to: { transform: "translateX(0)" } },
        float:        { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        "fade-in-up":   { from: { opacity: "0", transform: "translateY(30px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pulse-success":{ "0%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(16,185,129,0.5)" }, "50%": { transform: "scale(1.02)", boxShadow: "0 0 0 8px rgba(16,185,129,0)" }, "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(16,185,129,0)" } },
        shimmer:        { "100%": { transform: "translateX(100%)" } },
        "gradient-shimmer": { "0%, 100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        "scale-in":     { from: { opacity: "0", transform: "scale(0.9)" }, to: { opacity: "1", transform: "scale(1)" } },
      },

      backgroundImage: {
        "gradient-brand":   "linear-gradient(135deg, #2563EB, #F97316)",
        "gradient-blue":    "linear-gradient(135deg, #2563EB, #1D4ED8)",
        "gradient-warm":    "linear-gradient(135deg, #F97316, #2563EB)",
        "gradient-full":    "linear-gradient(135deg, #2563EB, #1D4ED8, #F97316)",
        "gradient-success": "linear-gradient(135deg, #16A34A, #15803D)",
        "gradient-purple":  "linear-gradient(135deg, #7C3AED, #D946EF)",
        "gradient-green":   "linear-gradient(135deg, #10B981, #06B6D4)",
        "gradient-indigo":  "linear-gradient(135deg, #6366F1, #3B82F6)",
      },

      boxShadow: {
        "card":       "0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
        "dropdown":   "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        "modal":      "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
        "toast":      "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        "glow":       "0 0 24px rgba(37,99,235,0.2)",
        "glow-lg":    "0 0 40px rgba(37,99,235,0.25)",
        "inset":      "inset 0 1px 3px rgba(0,0,0,0.04)",
      },

      zIndex: {
        base:     "0",
        dropdown: "10",
        sticky:   "20",
        sidebar:  "30",
        overlay:  "40",
        drawer:   "50",
        modal:    "60",
        toast:    "100",
        tooltip:  "150",
        topmost:  "200",
        debug:    "9999",
      },

      transitionDuration: {
        instant: "100ms",
        fast:    "150ms",
        normal:  "200ms",
        slow:    "300ms",
        slower:  "500ms",
        slowest: "800ms",
      },
    },
  },
  plugins: [],
};

export default config;
