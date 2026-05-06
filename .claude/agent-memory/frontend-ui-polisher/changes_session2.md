---
name: Mobile UX Audit Session 2
description: Full mobile responsive pass — typography scale, stat cards, hero sections, footer, animations, overflow fixes
type: project
---

## Session Goal
Full mobile UX audit and fix across the entire site (May 2026).

## Files Changed

### Hero & Public Sections
- `components/marketing/hero-section.tsx` — responsive text-3xl→4xl→5xl+, stacked CTAs on mobile (flex-col → sm:flex-row), ticker font size reduced, padding reduced for mobile
- `components/marketing/portfolio-hero-section.tsx` — h1 responsive, glass card padding responsive, stats grid-cols-2 on mobile
- `components/marketing/pricing-hero-section.tsx` — glass panel p-5 mobile, h1 responsive
- `components/marketing/contact-hero-section.tsx` — glass panel p-5 mobile, h1 responsive
- `components/marketing/services-hero-section.tsx` — h1 responsive
- `components/marketing/public-page-hero.tsx` — p-5 mobile, h1 and p responsive
- `components/marketing/testimonials-section.tsx` — h2 responsive
- `components/marketing/service-pillars.tsx` — section padding responsive, card min-h responsive (320→430), heading responsive
- `components/marketing/stitch-transform-section.tsx` — section py-12 mobile (was py-28), image min-h reduced
- `components/marketing/delivery-sequence.tsx` — h2 responsive
- `components/marketing/why-scaffold-matters.tsx` — h2 responsive
- `components/marketing/cta-banner.tsx` — section padding responsive, inner card px-5 mobile, h2 responsive, buttons flex-col mobile
- `components/marketing/direct-order-modal.tsx` — trigger button full-width mobile (w-full sm:w-auto), min-h-[44px]
- `components/marketing/production-showcase-client.tsx` — section py-10 mobile, h2 responsive

### Layout
- `components/layout/site-footer.tsx` — sm:grid-cols-2 layout, responsive card padding

### Client Portal
- `app/(client)/client/dashboard/page.tsx` — h1 responsive, stats grid-cols-2 on mobile, card padding p-3 mobile, stat values text-2xl mobile
- `app/(client)/client/orders/page.tsx` — h1 responsive, header flex-col mobile
- `app/(client)/client/files/page.tsx` — h1 responsive
- `app/(client)/client/invoices/page.tsx` — h1 responsive
- `app/(client)/client/reports/page.tsx` — h1 responsive
- `app/(client)/client/revisions/page.tsx` — h1 responsive
- `app/(client)/client/profile/page.tsx` — h1 responsive
- `app/(client)/client/onboarding/page.tsx` — h1 responsive
- `app/(client)/client/quotes/[quoteId]/page.tsx` — h1 responsive

### Admin Portal
- `app/(admin)/admin/dashboard/page.tsx` — h1 responsive, stat cards grid-cols-2, compact padding and text on mobile
- `app/(admin)/admin/orders/page.tsx` — h1 responsive
- `app/(admin)/admin/marketing/page.tsx` — stat cards grid-cols-2, compact sizes mobile
- `app/(admin)/admin/reports/page.tsx` — h1 responsive, stat cards grid-cols-2 mobile
- `app/(admin)/admin/marketing/campaigns/page.tsx` — h1 responsive
- `app/(admin)/admin/staff/new/page.tsx` — h1 responsive
- `app/(admin)/admin/notifications/rules/page.tsx` — h1 responsive
- `app/(admin)/admin/audit-unlock/page.tsx` — h1 responsive
- `app/(admin)/admin/invoices/[invoiceId]/page.tsx` — CardTitle responsive
- Multiple admin pages — `text-3xl md:text-4xl` → `text-2xl md:text-3xl lg:text-4xl` (bulk sed)

### Workflow Components
- `components/workflow/admin-order-queue.tsx` — mobile card layout added (flex on mobile, hidden grid on desktop)

### Global CSS
- `app/globals.css` — Added @media (max-width: 767px) block to disable animate-float, animate-float-slow, animate-float-delayed, animate-orb-drift on mobile

## Key Patterns Applied
- Typography: `text-2xl md:text-3xl lg:text-4xl` for all page h1s on portal pages
- Typography: `text-3xl sm:text-4xl md:text-5xl` etc for hero sections
- Stat cards: always `grid-cols-2` mobile base, `lg:grid-cols-4` or `lg:grid-cols-3`
- Stat values: `text-2xl md:text-3xl` (never bare text-3xl on mobile in 2-col grids)
- CTA buttons: `flex-col sm:flex-row` or `w-full sm:w-auto`
- Touch targets: all interactive elements get `min-h-[44px]`
- Section padding: `py-10 md:py-16 lg:py-24` pattern
- Card padding: `p-4 md:p-6 lg:p-8` or `p-5 md:p-10` pattern

## Build Result
TypeScript: pass (no errors), Lint: pass, Build: pass
