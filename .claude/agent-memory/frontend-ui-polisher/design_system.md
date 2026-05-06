---
name: GenX Design System
description: Color palette, CSS custom properties, Tailwind patterns, and visual identity tokens
type: project
---

## Color System (globals.css CSS vars + Tailwind v4 @theme)

**Dark mode palette (default for public site):**
- Background: `#07111f` / `#0a1625` / `#0d1b2e` (deep navy)
- Primary: HSL `245 88% 68%` (electric violet/indigo)
- Accent: HSL `258 84% 69%` (purple)
- Foreground: HSL `225 25% 95%` (near white)

**Brand tokens (`:root` CSS vars):**
- `--genx-navy-900: #07111f`
- `--genx-violet: #7c3aed`
- `--genx-violet-light: #8b5cf6`
- `--genx-gold: #f59e0b`
- `--glass-bg: rgba(255,255,255,0.05)`
- `--glass-border: rgba(255,255,255,0.10)`

## Core Tailwind CSS Utility Classes (defined in @layer components)

- `.glass-panel` — `bg-card/72 backdrop-blur-xl border border-border/80`
- `.premium-shadow` — layered box-shadow with navy + violet glow
- `.hero-glow` — radial gradient background for hero sections
- `.gradient-text` — indigo→violet gradient text
- `.gradient-text-gold` — amber→yellow gradient text
- `.section-eyebrow` — `text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground`
- `.card-hover` — `transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`
- `.btn-primary` — full-width primary pill button
- `.btn-outline` — full-width outline pill button

## Custom Animations

- `animate-fade-in-up` — `fade-in-up 0.5s ease-out both`
- `animate-fade-in` — `fade-in 0.4s ease-out both`
- `marquee-track` — 35s infinite horizontal scroll
- `animate-float` — float 6s ease-in-out infinite
- `animate-float-slow` — float-slow 8s infinite
- `animate-orb-drift` — orb-drift 15s infinite
- `animate-shimmer` — shimmer 3s linear infinite

## Consistent Patterns

- Border radius: `rounded-[2rem]` for cards, `rounded-full` for pills/badges, `rounded-[1.75rem]` for smaller panels
- Card pattern: `glass-panel premium-shadow rounded-[2rem] border-border/80`
- Button shapes: `shape="pill"` on Button component for all public CTAs
- Eyebrow text: always `.section-eyebrow` class before headings
- Hero sections: full-viewport dark navy with radial gradient orbs + framer-motion entrance
