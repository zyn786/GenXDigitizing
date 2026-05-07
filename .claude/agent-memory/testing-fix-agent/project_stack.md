---
name: Project stack and tooling
description: Core tech stack, package manager, and key integration points for the GenX Digitizing platform
type: project
---

Package manager: pnpm (pnpm-lock.yaml present, packageManager field in package.json is pnpm@10.8.0)

Build scripts:
- `pnpm run build` — next build (production gate)
- `pnpm run typecheck` — tsc --noEmit
- `pnpm run lint` — eslint .
- `pnpm run db:generate` — prisma generate (also runs on postinstall)

Key integration points verified working:
- `usePreloader` from `@/components/layout/site-preloader` — exports `{ isRevealing: boolean }`
- `DirectOrderModal` from `@/components/marketing/direct-order-modal` — accepts `mode?: "order" | "quote"` prop (no longer used in hero-section; replaced with Link to /orders)
- `Button` from `@/components/ui/button` — supports `variant`, `shape`, `size`, `asChild` props; variant includes "premium"
- `ScrollSectionNav` from `@/components/ui/scroll-section-nav` — accepts `sections: { id: string; label: string }[]`
- `SectionHeader` from `@/components/ui/section-header` — accepts `eyebrow`, `title`, `text?`, `align?: "center" | "left"`
- `OrderWizard` from `@/components/orders/order-wizard` — client component, accepts `user?: { name, email } | null` and `isFirstOrder?: boolean`; handles both auth and guest flows; /orders page is the canonical entry point routing all order flows

**Why:** Tracking integration point contracts so future agents don't need to re-verify them from scratch.
**How to apply:** When a new component imports one of these, confirm the prop signatures match before running checks.
