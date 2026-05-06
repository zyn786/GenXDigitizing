---
name: GenX Digitizing Project Overview
description: Core tech stack, architecture, and routing structure for the GenX Digitizing platform
type: project
---

Next.js 16 (App Router) + Tailwind CSS v4 + Framer Motion + Prisma 7 + NextAuth v5 embroidery SaaS platform.

**Route groups:**
- `(public)` — Marketing site: /, /services, /portfolio, /pricing, /contact, /quote, /order
- `(auth)` — Login, register, forgot-password, verify-email
- `(client)` — Client portal: /client/dashboard, /client/orders, /client/files, /client/invoices, etc.
- `(admin)` — Admin/staff: /admin/dashboard, /admin/orders, /admin/designer, etc.

**Key layout files:**
- `app/layout.tsx` — Root layout: Inter font, ThemeProvider, SessionProvider
- `app/(public)/layout.tsx` — Public shell: SiteHeader + SiteFooter + PreloaderProvider + PublicShellBackground + PageTransition
- `app/(client)/client/layout.tsx` — Client portal: auth check + DashboardShell (mode="client")
- `app/(admin)/admin/layout.tsx` — Admin portal: role check + DashboardShell (mode="admin")

**Why:** Full-featured embroidery digitizing SaaS with quote→proof→payment→files workflow, PostgreSQL, S3/R2 file storage, Resend emails.

**How to apply:** Every page change must respect the route group + layout nesting. Never touch API routes under app/api/, auth.ts, server actions, or prisma/.
