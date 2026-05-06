---
name: Session 1 Changes
description: Summary of UI/UX improvements made in the first redesign session (May 2026)
type: project
---

## Session 1 — May 5, 2026 — Frontend Redesign Pass

**Why:** Full frontend premium redesign requested. The existing site already had good glassmorphism and framer-motion. Focus was on gaps: plain hero sections on inner pages, basic stats, plain workflow components.

**How to apply:** These are baseline improvements. Future sessions should build on top, not revert.

### Files Changed

**globals.css**
- Added GenX brand token CSS vars (`--genx-navy-*`, `--genx-violet`, `--genx-gold`, `--glass-bg`, `--glass-border`)
- Added 7 new `@keyframes`: float, float-slow, glow-pulse, shimmer, thread-draw, orb-drift, border-glow
- Added utility classes: `.genx-glass`, `.genx-glass-hover`, `.gradient-text-shimmer`, `.animate-float`, `.animate-float-slow`, `.animate-float-delayed`, `.animate-shimmer`, `.animate-orb-drift`, `.input-premium`, `.noise-overlay`, `.section-divider-top`

**components/marketing/portfolio-hero-section.tsx**
- Was: plain text-only section
- Now: glassmorphism hero panel with stat cards, framer-motion entrance, service chips, CTA button, ambient glow orbs

**components/marketing/pricing-hero-section.tsx**
- Was: plain text header
- Now: glassmorphism panel with gold eyebrow badge, feature checklist, right-side CTA panel with quick links

**components/marketing/contact-hero-section.tsx**
- Was: plain text header
- Now: glassmorphism panel with animated "What to expect" promise cards with icons

**components/marketing/services-hero-section.tsx**
- Was: functional but plain layout
- Now: animated entrance with eyebrow badge, gradient text headline, staggered feature cards

**components/marketing/testimonials-section.tsx**
- Was: "reviews coming soon" placeholder with a single card
- Now: 3 premium glass testimonial cards with stars, quotes, avatar initials + view portfolio CTA

**components/marketing/hero-section.tsx**
- Added `poster="/brand/hero-poster.jpg"` attribute to hero video element

**components/workflow/workflow-timeline.tsx**
- Was: basic icon list with minimal color
- Now: has progress summary bar (x of y steps, percent bar), animated active state pulse, config-driven icon+color system

**components/workflow/client-orders-table.tsx**
- Was: basic card list
- Now: left accent color bars for active orders, status dot indicators (some animated), PROOF_READY callout banner, hover state group effects

**components/workflow/order-progress-bar.tsx**
- Was: plain indigo bar
- Now: color changes by completion (blue → amber → violet → emerald), shimmer track, optional label prop

**components/workflow/admin-order-queue.tsx**
- Was: basic table with basic inputs
- Now: better input styles (backdrop-blur, focus ring), sticky header bg, row hover + group-hover effects, italic "Unassigned" text

**components/ui/badge.tsx**
- Was: single variant
- Now: CVA-based with variants: default, primary, success, warning, danger, info, violet, gold, muted

**components/ui/empty-state.tsx**
- Was: plain border box
- Now: ambient top glow, icon box with inner gradient, improved icon wrapper

**app/(admin)/admin/dashboard/page.tsx**
- StatCard: added gradient text for values, hover top accent line, ring on icon container

**app/(client)/client/dashboard/page.tsx**
- Stat cards: each has colored top accent gradient line and color-coded value text (blue/violet/emerald/amber)

**app/not-found.tsx**
- Was: plain centered card
- Now: large 404 with gradient fill, ambient glow orbs, glassmorphism card, better copy

**components/layout/portal-nav.tsx**
- Active nav items now have a left accent bar + slightly stronger icon ring

**components/layout/dashboard-shell.tsx**
- Added subtle top gradient accent line to sticky header

### Build Status
- TypeScript: PASS (no errors)
- ESLint: PASS (no warnings)
- Next.js build: PASS (1 pre-existing cache-control warning, unrelated)
