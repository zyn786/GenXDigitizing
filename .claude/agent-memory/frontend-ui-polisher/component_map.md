---
name: Component Map
description: Where to find reusable UI components, marketing sections, workflow components, and layout shells
type: project
---

## UI Primitives — `components/ui/`

- `button.tsx` — CVA-based Button. Variants: default, secondary, outline, ghost, premium, destructive. Shapes: default (rounded-2xl), pill (rounded-full). Sizes: default, lg, sm, icon.
- `card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `badge.tsx` — Badge with variants: default, primary, success, warning, danger, info, violet, gold, muted
- `card-3d.tsx` — 3D tilt card using framer-motion mouse tracking
- `empty-state.tsx` — Centered empty state with icon + title + description + action CTA
- `skeleton.tsx` — Shimmer skeleton with `animate-pulse`
- `scroll-section-nav.tsx` — Fixed right-side section dot navigation (portaled to body)
- `theme-toggle.tsx` — Dark/light mode toggle
- `logout-button.tsx` — Logout button with NextAuth signOut

## Marketing Components — `components/marketing/`

- `hero-section.tsx` — Full-viewport video hero with ticker strip, CTA buttons
- `service-pillars.tsx` — 3-card service grid with hover effects + background images
- `stitch-transform-section.tsx` — Before/After slider + animated thread lines
- `production-showcase.tsx` (server) + `production-showcase-client.tsx` — Portfolio grid with filters
- `why-scaffold-matters.tsx` — 4-card "Why GenX" section with Card3D
- `delivery-sequence.tsx` — 4-step how-it-works grid + HeroMockup
- `testimonials-section.tsx` — Placeholder testimonial cards (ready for real data)
- `cta-banner.tsx` — Bottom CTA with glow orbs and floating dots
- `hero-mockup.tsx` — 3D order card mockup with mouse-tilt effect
- `embroidery-hoop.tsx` — Interactive before/after slider with pointer events
- `public-shell-background.tsx` — Animated gradient orbs + stitch SVG lines + grid
- `portfolio-hero-section.tsx` — Portfolio page hero with stats strip
- `pricing-hero-section.tsx` — Pricing page hero with CTA panel
- `contact-hero-section.tsx` — Contact page hero with promise cards
- `services-hero-section.tsx` — Services page hero with service highlight cards
- `direct-order-modal.tsx` — Multi-step order modal (3 steps: contact → details → files)

## Workflow Components — `components/workflow/`

- `order-status-badge.tsx` — Colored pill badge from status tone functions
- `workflow-timeline.tsx` — Vertical timeline with progress summary bar (upgraded)
- `client-orders-table.tsx` — Card-based order list with status indicators (upgraded)
- `order-progress-bar.tsx` — Gradient progress bar (color changes by completion %)
- `admin-order-queue.tsx` — Sortable/filterable admin order table

## Layout Components — `components/layout/`

- `dashboard-shell.tsx` — Shared shell for client + admin portals (sidebar + header)
- `portal-nav.tsx` — PortalNav (desktop sidebar) + PortalNavMobile (horizontal scroll strip)
- `site-header.tsx` — Sticky glassmorphism header with transparent-on-hero behavior
- `site-footer.tsx` — Dark glass footer with 3-column nav grid
- `site-preloader.tsx` — Animated splash screen (shown once per session)

## Status/Color Helpers — `lib/workflow/status.ts`

- `getClientWorkflowStatusLabel(status)` — Client-friendly status text
- `getClientWorkflowStatusTone(status)` — Tailwind color classes for client status badge
- `getAdminWorkflowStatusTone(status)` — Tailwind color classes for admin status badge
- Color mapping: SUBMITTED=blue, IN_PROGRESS=amber, PROOF_READY=violet, APPROVED=emerald, DELIVERED=teal, CANCELLED=red
