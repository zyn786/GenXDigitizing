---
name: Phase 11B production hardening
description: Edge middleware, rate limiting, SEO metadata, client status label refresh applied 2026-05-10
type: project
---

Scope: production-hardening pass adding edge-level route protection, brute-force defenses on auth/contact, OG metadata, and refreshed client status labels.

**Why:** Pre-production audit found `typescript.ignoreBuildErrors: true` in next.config.ts (TS errors silently shipped), no `middleware.ts` (auth was layout-only — API routes had no edge guard), no per-IP rate limiting on login/register/contact, missing OpenGraph for social sharing, and client-facing status copy diverged from the spec ("In Production" instead of "Assigned"/"In Progress", "Completed" instead of "Final Files Unlocked").

**How to apply:**
- `middleware.ts` at repo root uses `auth(...)` from NextAuth v5 beta as edge middleware. Matcher covers `/admin/:path*`, `/client/:path*`, `/api/admin/:path*`, `/api/client/:path*`, `/api/designer/:path*`. Returns 401/403 JSON for API paths; redirects UI paths to `/login?next=...`. Treat this as the first guard; per-route session checks remain.
- `lib/auth/rate-limit.ts` is in-memory (per-process Map). Acceptable for single-instance deploys; behind a load balancer this needs Redis backing — `checkRateLimit(key, max, windowMs)` signature is the swap surface. Currently applied: login 5/min, register 5/min, contact 3/10min, all keyed by `getClientIp(headers)`.
- Client status labels live in `lib/workflow/status.ts` `CLIENT_STATUS_LABELS` / `CLIENT_STATUS_TONES`. Spec mapping: NEW/SUBMITTED→Order Received, QUOTED→Quote Ready, ASSIGNED_TO_DESIGNER→Assigned, IN_PROGRESS→In Progress, DELIVERED→Final Files Unlocked. Don't revert to "In Production" — that label is gone by design.
- Sitemap pulls `serviceSummaries` and `nicheSummaries` from `lib/marketing-data.ts` and the latest visible+APPROVED `portfolioItem.updatedAt` for portfolio lastModified.
