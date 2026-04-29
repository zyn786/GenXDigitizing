# GenX Digitizing — Full Website Documentation

> Premium embroidery digitizing, vector art, and custom patches SaaS platform with a public marketing site, client portal, and admin operations workspace.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Public Website](#public-website)
4. [Authentication](#authentication)
5. [Client Portal](#client-portal)
6. [Admin Workspace](#admin-workspace)
7. [Services & Pricing](#services--pricing)
8. [API Routes](#api-routes)
9. [Database Models](#database-models)
10. [Roles & Permissions](#roles--permissions)
11. [Integrations](#integrations)
12. [Environment Variables](#environment-variables)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Shadcn/ui, Framer Motion |
| Auth | NextAuth v5 (beta.31) + PrismaAdapter — JWT strategy |
| Database | PostgreSQL via Prisma 7 (Prisma-managed cloud) |
| Storage | AWS S3 / Cloudflare R2 (presigned URLs) |
| Email | Resend API |
| Package Manager | pnpm 10 |
| Testing | Vitest (unit + integration), Playwright (e2e) |
| Node | ≥ 20.11.0 |

---

## Project Structure

```
app/
├── (public)/          # Marketing site — unauthenticated
├── (auth)/            # Login, register, OTP, password flows
├── (client)/          # Client portal — role: CLIENT
├── (admin)/           # Staff/admin workspace — all staff roles
└── api/               # API route handlers

components/
├── admin/             # Admin-only UI components
├── auth/              # Auth forms and guards
├── billing/           # Invoice and payment UI
├── branding/          # Logo and brand elements
├── client/            # Client portal components
├── layout/            # Shell, nav, footer
├── marketing/         # Public marketing sections
├── providers/         # Theme and session providers
├── quote-order/       # Order/quote builder
├── staff/             # Staff management components
├── support/           # Chat/support components
├── ui/                # Base UI primitives
└── workflow/          # Order workflow components

lib/
├── activity/          # Audit activity logger
├── admin/             # Audit token (HMAC-SHA256)
├── auth/              # Password, OTP, TOTP, session, roles, tokens
├── billing/           # Invoice types, repository, status, schemas
├── chat/              # Chat server, repository, serializers, uploads
├── marketing-data.ts  # Services, niches, testimonials, FAQs
├── notifications/     # Email notification senders, rules
├── payments/          # Payment types, repository, schemas
├── pricing/           # Pricing config, bulk discount rules
├── quote-order/       # Service catalog, pricing engine
├── s3.ts              # S3/R2 presigned URL helpers
├── site.ts            # Site config, nav, role-based nav builder
└── workflow/          # Order types, repository, status helpers
```

---

## Public Website

All public pages live under `app/(public)/` and are accessible without authentication.

### Home Page `/`

**Components rendered (in order):**
- `ScrollSectionNav` — sticky sidebar nav with section links
- `HeroSection` — headline, subheadline, dual CTA (Get a Quote / View Pricing)
- `StitchTransformSection` — before/after embroidery showcase
- `ServicePillars` — three service pillars: Digitizing, Vector Art, Patches
- `ProductionShowcaseSection` — real production image grid, machine features
- `WhyScaffoldMatters` — trust differentiators
- `DeliverySequence` — 4-step how-it-works flow
- `TestimonialsSection` — client testimonials
- `FinalCtaBanner` — bottom CTA

**Page sections (scroll-nav anchors):**

| ID | Label |
|---|---|
| `home` | Home |
| `services` | Services |
| `what-we-do` | What We Do |
| `our-work` | Our Work |
| `why-us` | Why Us |
| `how-it-works` | How It Works |
| `reviews` | Reviews |
| `get-started` | Get Started |

---

### Services Page `/services`

Overview of all service categories. Components:
- `ServicesHeroSection`
- `ServiceCategoryGrid` — cards for Embroidery Digitizing, Vector Art, Custom Patches
- `ServiceWorkflowStrip` — 4-step workflow
- `ServicesPageCta`

---

### Service Detail Page `/services/[slug]`

Dynamic page per service. Slugs:

| Slug | Service |
|---|---|
| `embroidery-digitizing` | Embroidery Digitizing |
| `vector-art` | Vector Art Conversion |
| `custom-patches` | Custom Patches |

Each page includes: eyebrow, headline, summary, bullet list of capabilities, 4-step process, and FAQ accordion.

---

### Niche Detail Page `/niches/[slug]`

Dynamic page per specialty niche. Slugs:

| Slug | Service | Title |
|---|---|---|
| `left-chest-logo` | Embroidery Digitizing | Left Chest Logo Digitizing |
| `cap-hat-logo` | Embroidery Digitizing | Cap / Hat Logo Digitizing |
| `3d-puff` | Embroidery Digitizing | 3D Puff Digitizing |
| `jpg-to-vector` | Vector Art | JPG to Vector Conversion |
| `print-ready-artwork` | Vector Art | Print-Ready Artwork Prep |
| `embroidered-patches` | Custom Patches | Embroidered Patches |
| `chenille-patches` | Custom Patches | Chenille Patches |

Each page includes: summary, use cases, specs, and core benefit.

---

### Pricing Page `/pricing`

- `PricingHeroSection`
- `PricingPlansGrid` — pricing tiers fetched from DB (`/api/pricing`)
- `PricingNotesPanel` — footnotes, revision policy
- `ServicesPageCta`

---

### Portfolio Page `/portfolio`

- Fetches portfolio items from DB including service type, niche slug, and image keys
- `PortfolioClient` — client component with search bar, service/niche filters, before/after modal viewer

---

### Contact Page `/contact`

- `ContactHeroSection`
- `ContactDetailsPanel` — address, phone, email
- `ContactFormPanel` — submits to `POST /api/contact`
- `ContactCtaStrip`

---

### Quote Page `/quote`

Public order/quote builder. Renders `QuoteOrderBuilder` in quote mode.

---

### Order Page `/order`

Public order submission. Renders `QuoteOrderBuilder` in order mode. Requires login; modal intercept at `(.)login`.

---

### Legal Pages

| Route | Page |
|---|---|
| `/privacy-policy` | Privacy Policy |
| `/refund-policy` | Refund Policy |
| `/terms-and-conditions` | Terms and Conditions |

---

### Modal Intercept

`/login` opened from within the public layout renders as a modal (`@modal` parallel route) via `app/(public)/@modal/(.)login/page.tsx` — no full page navigation.

---

## Authentication

All auth pages live under `app/(auth)/`. Layout: centered card, branding logo.

| Route | Purpose |
|---|---|
| `/login` | Email + password or Google OAuth sign-in |
| `/register` | New client account registration |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password via token |
| `/verify-email` | 6-digit OTP entry (email verification) |
| `/post-login` | Redirect logic after sign-in (routes to portal) |

### Auth Features

- **Google OAuth** — via `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- **Email + Password** — bcrypt hashed passwords
- **OTP Verification** — 6-digit code sent by Resend, configurable TTL and resend cooldown
- **TOTP (2FA)** — used for billing audit unlock
- **Inactivity Logout** — client-side timer via `InactivityLogout` component
- **JWT Strategy** — sessions stored in JWT, not DB sessions table

---

## Client Portal

All client pages live under `app/(client)/client/`. Requires `CLIENT` role.

### Navigation

| Route | Label |
|---|---|
| `/client/dashboard` | Dashboard |
| `/client/orders` | My Orders |
| `/client/quotes` | Quote Requests |
| `/client/files` | Files |
| `/client/invoices` | Invoices |
| `/client/support` | Chat & Support |
| `/client/profile` | My Profile |

---

### Dashboard `/client/dashboard`

- Welcome panel with account summary
- `DashboardActions` — quick action buttons (New Order, New Quote, View Files)

---

### Orders `/client/orders`

- `ClientOrdersTable` — list of all orders with status badges
- Statuses: SUBMITTED → IN_PROGRESS → PROOF_READY → REVISION_REQUESTED → DELIVERED

---

### Order Detail `/client/orders/[orderId]`

- Full production specs card: placement, dimensions, stitch count, fabric type, file formats, colors, thread details, trims, special instructions, quantity, estimated price
- Proof review card (approve or request revision)
- Delivery files section: locked behind invoice payment (`filesUnlocked`), `ClientDownloadButton` per file when unlocked
- Order timeline and progress bar

---

### Quote Requests `/client/quotes`

- List of submitted quotes (DRAFT status orders)
- `ConvertQuoteButton` — promotes quote to live order

---

### Files `/client/files`

- Files tab across all orders
- Download gated by `invoice.filesUnlocked` — shows lock state with invoice link if not unlocked

---

### Invoices `/client/invoices`

- `ClientInvoiceList` — all invoices with status badges
- Statuses: DRAFT → SENT → PAID → OVERDUE → CANCELLED

---

### Invoice Detail `/client/invoices/[invoiceId]`

- Line items, discounts, payments
- `PaymentProofForm` — upload payment screenshot for manual payment accounts
- Payment accounts displayed with account type and instructions

---

### Support `/client/support`

- `ChatSupportShell` — polling-based chat (8 s thread refresh, 15 s heartbeat)
- `ChatThreadListPanel` — all support threads
- `ConversationLauncherButton` — open new thread

---

### Support Thread `/client/support/[threadId]`

- `ChatThreadViewPanel` — full message thread with file attachments (S3 presigned URLs)
- Real-time presence via heartbeat polling

---

### Profile `/client/profile`

- `ProfileEditForm` — update name, contact info
- Onboarding state display

---

### Onboarding `/client/onboarding`

- First-time setup flow for new clients

---

## Admin Workspace

All admin pages live under `app/(admin)/admin/`. Requires any staff role. Role-gated navigation via `getAdminNav(role)`.

### Navigation by Role

#### SUPER_ADMIN & MANAGER

| Route | Label |
|---|---|
| `/admin/dashboard` | Dashboard |
| `/admin/orders` | Order Queue |
| `/admin/quotes` | Quote Requests |
| `/admin/invoices` | Invoices |
| `/admin/payment-proofs` | Payment Proofs |
| `/admin/support` | Support Inbox |
| `/admin/staff` | Staff & Commissions |
| `/admin/portfolio` | Portfolio |
| `/admin/pricing` | Pricing |
| `/admin/pricing-config` | Pricing Config |
| `/admin/leads` | Lead Sources |
| `/admin/payment-accounts` | Payment Methods |
| `/admin/reports` | Reports |
| `/admin/coupons` | Coupons |
| `/admin/notifications` | Notifications |
| `/admin/activity` | Activity Log |
| `/admin/audit` | Audit Access |
| `/admin/settings` | Settings (SUPER_ADMIN only) |

#### DESIGNER

| Route | Label |
|---|---|
| `/admin/designer` | Designer Dashboard |
| `/admin/designer/earnings` | My Earnings |
| `/admin/notifications` | Notifications |

#### CHAT_SUPPORT

| Route | Label |
|---|---|
| `/admin/support` | Support Inbox |
| `/admin/notifications` | Notifications |

#### MARKETING

| Route | Label |
|---|---|
| `/admin/marketing` | Marketing Hub |
| `/admin/notifications` | Notifications |

---

### Admin Dashboard `/admin/dashboard`

High-level KPIs — order counts, revenue, recent activity.

---

### Order Queue `/admin/orders`

- `AdminOrderQueue` — filterable table (by status, designer, date)
- Status controls, designer assignment, quick actions

---

### Order Detail `/admin/orders/[orderId]`

- Full `ProductionSpecsCard`: placement, dimensions, stitch count, fabric, file formats, colors, thread brand, trims, special instructions, quantity, estimated price, free design flag, lead source chip
- `OrderStatusControls` — advance workflow status
- `DesignerAssignControl` — assign to a designer
- `OrderFileUploader` — upload final design files (presigned S3 URL)
- Order timeline, proof cards, revision queue

---

### Quote Requests `/admin/quotes`

- All DRAFT orders submitted by clients
- Approve (convert to order) or reject

---

### Invoices `/admin/invoices`

- `AdminInvoiceList` — full invoice table with filters
- Create, send, void invoices

---

### Invoice Detail `/admin/invoices/[invoiceId]`

- Line items, discounts, payment history
- Billing audit unlock (TOTP-gated)

---

### Payment Proofs `/admin/payment-proofs`

- `PaymentProofsManager` — list of all uploaded payment screenshots
- Approve (unlocks order files) or reject per proof
- View proof image via `GET /api/admin/payment-proofs/[proofId]/image`

---

### Payment Accounts `/admin/payment-accounts`

- `PaymentAccountsManager` — CRUD for manual payment accounts
- Types: `BANK_TRANSFER`, `JAZZCASH`, `EASYPAISA`, `PAYPAL`, `OTHER`
- Clients see active accounts on invoice detail page

---

### Support Inbox `/admin/support`

- `ChatSupportShell` in admin mode — all threads across all clients
- Assign threads, respond, close

---

### Support Thread `/admin/support/[threadId]`

- Full conversation view with client, read receipts, file attachments

---

### Staff & Commissions `/admin/staff`

- Staff list with roles, status
- `CreateStaffForm` — invite new staff member

---

### Staff Detail `/admin/staff/[userId]`

- Profile, role, commission history
- `CommissionEditor` — configure commission type and rate
- `CommissionHistory` — past commission records

---

### Designer Dashboard `/admin/designer`

- Jobs queue assigned to the logged-in designer
- Upload files to orders

---

### Designer Job `/admin/designer/[orderId]`

- Full job detail for a designer
- `OrderFileUploader` — upload DST/PES/EMB files

---

### Designer Earnings `/admin/designer/earnings`

- Commission summary and history for the logged-in designer

---

### Portfolio `/admin/portfolio`

- `PortfolioManager` — add, edit, reorder, delete portfolio items
- Fields: title, service type, niche slug, before/after images, sort order
- Service options: `EMBROIDERY_DIGITIZING`, `VECTOR_ART`, `CUSTOM_PATCHES`, `VECTOR_ART`, `CUSTOM_PATCHES`

---

### Pricing `/admin/pricing`

- `PricingEditor` — manage service tiers, addons, delivery options
- Reads from `ServiceCategory`, `ServiceTier`, `ServiceAddon`, `DeliveryOption` models

---

### Pricing Config `/admin/pricing-config`

- `PricingConfigEditor` — key-value admin pricing settings
- Controls: stitch rate per 1,000 stitches, free first design toggle, 3D Puff Jacket Back base price
- Bulk discount rules editor — quantity tiers with discount percent

---

### Lead Sources `/admin/leads`

- `LeadSourceDashboard` — bar chart breakdown of lead sources
- Recent clients table with source attribution

**Lead Source values:** `WEBSITE`, `FACEBOOK`, `INSTAGRAM`, `GOOGLE`, `REFERRAL`, `WHATSAPP`, `DIRECT_VISIT`, `CAMPAIGN`, `MANUAL`, `UNKNOWN`

---

### Reports `/admin/reports`

- Revenue and order analytics

---

### Coupons `/admin/coupons`

- `CouponsManager` — create and manage discount coupon codes
- Types: `PERCENT`, `FIXED`

---

### Marketing Hub `/admin/marketing`

- Campaigns overview
- `CampaignsManager`

---

### Campaigns `/admin/marketing/campaigns`

- Create email/SMS campaigns
- Types: `EMAIL`, `SMS`
- Statuses: `DRAFT`, `SCHEDULED`, `SENT`, `CANCELLED`

---

### Notifications `/admin/notifications`

- Notification preferences per event type
- Channels: `EMAIL`, `IN_APP`
- Event types: order created, proof ready, revision requested, files delivered, invoice sent, payment received, files unlocked

---

### Notification Rules `/admin/notifications/rules`

- Admin-level global notification rules

---

### Activity Log `/admin/activity`

- `ActivityLog` table — all audit events with actor, entity, action, metadata

---

### Audit Access `/admin/audit`

- `BillingAuditViewer` — TOTP unlock (5-min token), paginated `BillingAuditLog`
- Shows before/after JSON diffs, entity badges, key-unlock events
- SUPER_ADMIN only

---

### Audit Unlock `/admin/audit-unlock`

- TOTP verification entry point for billing audit access

---

### Settings `/admin/settings`

- Global platform settings (SUPER_ADMIN only)

---

## Services & Pricing

### Services

#### Embroidery Digitizing — Base $12

Production-ready stitch files for all garment types and placements.

**Niches:** Left Chest Logo, Cap/Hat Logo, Large Design, Jacket Back, 3D Puff, 3D Puff Jacket Back, Sleeve, Full Back

**File formats delivered:** DST, PES, EMB, EXP, JEF, VP3, XXX, HUS, SEW, PDF, SVG, AI, PNG

#### Vector Art Conversion — Base $18

Manual path redraws, print-ready artwork, color separations.

**Niches:** JPG to Vector, Print-Ready Artwork, Logo Redraw, Color Separation

#### Custom Patches — Base $24

Embroidered, chenille, woven, PVC, and leather patches.

**Niches:** Embroidered Patches, Chenille Patches, PVC Patches, Woven Patches, Leather Patches

---

### Pricing Engine

Pricing is computed by `lib/quote-order/pricing.ts`:

| Factor | Effect |
|---|---|
| Base price | Per service type |
| Stitch count | $1.00 per 1,000 stitches (configurable) |
| Size (inches) | +$2 per inch over 4 in (when no stitch count) |
| Colors | +$1.50 per color over 4 |
| Complexity | LOW: $0 / MEDIUM: +$6 / HIGH: +$14 |
| Source cleanup | +$8 |
| Small text | +$6 |
| 3D Puff | +$10 |
| Placement surcharge | Large Design / Jacket Back: +$8; Full Back / Full Front: +$15 |
| Turnaround | STANDARD: $0 / URGENT: +$12 / SAME_DAY: +$24 |
| Bulk discount | 5 pcs: 5% / 10 pcs: 10% / 25 pcs: 15% / 50 pcs: 20% |
| 3D Puff Jacket Back | Flat $35 base + turnaround adj (premium separate service) |
| Free first design | 100% discount if enabled + first order |

---

### Design Placements

| Value | Label | Max Size |
|---|---|---|
| `LEFT_CHEST` | Left Chest | 5 in |
| `RIGHT_CHEST` | Right Chest | 5 in |
| `HAT_FRONT` | Hat / Cap Front | 5 in |
| `HAT_SIDE` | Hat / Cap Side | 5 in |
| `HAT_BACK` | Hat / Cap Back | 5 in |
| `LARGE_DESIGN` | Large Design | 12 in |
| `JACKET_BACK` | Jacket Back | 12 in |
| `JACKET_CHEST` | Jacket Chest | 5 in |
| `SLEEVE_LEFT` | Left Sleeve | 5 in |
| `SLEEVE_RIGHT` | Right Sleeve | 5 in |
| `FULL_BACK` | Full Back | 14 in |
| `FULL_FRONT` | Full Front | 14 in |
| `POCKET` | Pocket | 3 in |
| `LEG` | Leg / Pant | 6 in |
| `PUFF_LEFT_CHEST` | 3D Puff Left Chest | 5 in |
| `PUFF_HAT` | 3D Puff Hat / Cap | 5 in |
| `PUFF_JACKET_BACK` | 3D Puff Jacket Back ★ | 12 in |
| `OTHER` | Other / Custom | 14 in |

★ Premium service — flat-rate pricing separate from stitch-count model.

---

## API Routes

### Public / Auth

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/contact` | Contact form submission |
| GET | `/api/pricing` | Public pricing catalog |
| POST | `/api/quote` | Submit quote (DRAFT order) |
| POST | `/api/order` | Submit live order |
| POST | `/api/payment-proof-upload` | Presigned URL for payment screenshot |

### Client

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/client/orders` | List client orders |
| GET | `/api/client/orders/[orderId]` | Order detail |
| GET | `/api/client/quotes` | List draft quotes |
| POST | `/api/client/uploads` | Presigned upload URL |
| GET | `/api/client/payment-accounts` | Active payment accounts |
| POST | `/api/client/invoices/[invoiceId]/payment-proof` | Submit payment proof |
| GET | `/api/client/orders/[orderId]/files` | Order files (locked/unlocked) |
| GET | `/api/client/order-files/[fileId]/download` | Download file (403 if locked) |

### Admin

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/admin/staff` | Staff list / create |
| PATCH | `/api/admin/staff/[userId]/commission` | Update commission |
| GET | `/api/admin/staff/[userId]/commissions` | Commission history |
| GET/POST | `/api/admin/portfolio` | Portfolio items |
| PATCH/DELETE | `/api/admin/portfolio/[itemId]` | Edit / delete portfolio item |
| POST | `/api/admin/portfolio-upload` | Presigned portfolio image upload |
| GET/POST | `/api/admin/campaigns` | Campaigns list / create |
| PATCH/DELETE | `/api/admin/campaigns/[campaignId]` | Edit / delete campaign |
| GET/POST | `/api/admin/coupons` | Coupons list / create |
| PATCH/DELETE | `/api/admin/coupons/[couponId]` | Edit / delete coupon |
| GET | `/api/admin/quotes/[orderId]` | Quote detail |
| GET/PATCH | `/api/admin/orders/[orderId]` | Order detail / update status |
| POST | `/api/admin/order-files-upload` | Presigned design file upload |
| POST | `/api/admin/orders/[orderId]/files` | Save uploaded design file record |
| GET | `/api/admin/order-files/[fileId]/download` | Admin download file |
| GET/POST | `/api/admin/payment-accounts` | Payment accounts CRUD |
| PATCH/DELETE | `/api/admin/payment-accounts/[accountId]` | Edit / delete account |
| GET | `/api/admin/payment-proofs` | List all payment proofs |
| PATCH | `/api/admin/payment-proofs/[proofId]` | Approve or reject proof |
| GET | `/api/admin/payment-proofs/[proofId]/image` | View proof image |
| GET/POST | `/api/admin/pricing` | Pricing tiers |
| GET/POST | `/api/admin/pricing-config` | Pricing config settings |
| GET/POST/DELETE | `/api/admin/bulk-discounts` | Bulk discount rules |
| GET | `/api/admin/leads` | Lead source aggregation |
| POST | `/api/admin/billing-audit-unlock` | TOTP verify → audit token |
| GET | `/api/admin/billing-audit` | Paginated billing audit log |

### Workflow

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/workflow/orders` | Admin order queue |
| GET/PATCH | `/api/workflow/orders/[orderId]` | Workflow order detail / status update |

### Invoices

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/invoices/[invoiceId]/send` | Send invoice email to client |
| POST | `/api/invoices/[invoiceId]/payments` | Record payment |
| POST | `/api/invoices/[invoiceId]/audit-unlock` | TOTP unlock for invoice audit |

### Chat

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/chat/threads` | List / create threads |
| GET | `/api/chat/threads/[threadId]` | Thread detail |
| GET/POST | `/api/chat/threads/[threadId]/messages` | Messages in thread |
| PATCH/DELETE | `/api/chat/threads/[threadId]/messages/[messageId]` | Edit / delete message |
| POST | `/api/chat/threads/[threadId]/read` | Mark as read |
| POST | `/api/chat/threads/[threadId]/presence` | Heartbeat presence |
| GET | `/api/chat/presence` | Presence status |
| POST | `/api/chat/uploads` | Presigned chat attachment upload |
| PATCH/DELETE | `/api/chat/messages/[messageId]` | Edit / delete message |

---

## Database Models

### Auth & Users

| Model | Purpose |
|---|---|
| `User` | Core user record — email, name, role, image |
| `Account` | OAuth provider accounts (NextAuth) |
| `Session` | NextAuth sessions (not used in JWT mode) |
| `VerificationToken` | Email verification and password reset tokens |
| `OtpCode` | 6-digit OTP codes for email verification |
| `ClientProfile` | Client-specific data: leadSource, freeDesignUsed, totalOrderCount |
| `StaffProfile` | Staff-specific data: bio, hourly rate, commission config |
| `DesignerCommission` | Commission records per designer per order |

### Orders & Workflow

| Model | Purpose |
|---|---|
| `WorkflowOrder` | Central order record with all production fields |
| `OrderFile` | Design files uploaded by designers, locked until payment |

### Billing

| Model | Purpose |
|---|---|
| `Invoice` | Invoice with status, filesUnlocked flag |
| `InvoiceLineItem` | Per-line service items on invoice |
| `InvoiceDiscount` | Applied discounts (coupon or manual) |
| `Payment` | Payment records linked to invoices |
| `BillingAuditLog` | Immutable audit trail for all billing changes |
| `ManualPaymentAccount` | Bank/JazzCash/EasyPaisa accounts for manual payments |
| `PaymentProofSubmission` | Client-uploaded payment screenshots |

### Pricing

| Model | Purpose |
|---|---|
| `ServiceCategory` | Top-level service categories |
| `ServiceTier` | Pricing tiers per category |
| `ServiceAddon` | Optional addons per tier |
| `DeliveryOption` | Turnaround delivery options |
| `PricingConfig` | Admin-controlled key-value pricing settings |
| `BulkDiscountRule` | Quantity-based discount tiers |

### Marketing & CRM

| Model | Purpose |
|---|---|
| `Coupon` | Discount coupon codes |
| `MarketingCampaign` | Email/SMS campaigns |
| `PortfolioItem` | Public portfolio entries with before/after images |

### Chat & Support

| Model | Purpose |
|---|---|
| `ChatThread` | Support conversation threads |
| `ChatParticipant` | Users in a thread |
| `ChatMessage` | Individual messages |
| `ChatAttachment` | S3-hosted file attachments |
| `ChatMessageReceipt` | Read receipts |
| `UserPresence` | Heartbeat presence tracking |

### Notifications & Logging

| Model | Purpose |
|---|---|
| `NotificationRule` | Global notification rules per event |
| `NotificationOverride` | Per-user rule overrides |
| `NotificationPreference` | User notification preferences |
| `NotificationLog` | Delivery log — success or failure per send |
| `ActivityLog` | Full audit log for all admin/staff actions |

---

## Roles & Permissions

| Role | Access |
|---|---|
| `CLIENT` | Client portal only: orders, quotes, files, invoices, support, profile |
| `DESIGNER` | Designer dashboard, assigned jobs, file upload, earnings, notifications |
| `CHAT_SUPPORT` | Support inbox only + notifications |
| `MARKETING` | Marketing hub, campaigns + notifications |
| `MANAGER` | Full admin except settings and billing audit; can approve proofs |
| `SUPER_ADMIN` | Full access: all MANAGER permissions + settings + billing audit + TOTP unlock |

---

## Integrations

### Storage — AWS S3 / Cloudflare R2

Used for:
- Chat message attachments
- Client payment proof screenshots
- Admin design file uploads (DST/PES/EMB etc.)
- Portfolio before/after images

All file access uses **presigned URLs** — files are never served directly through Next.js.

### Email — Resend

Triggered emails (all non-fatal, logged to `NotificationLog`):

| Event | Template |
|---|---|
| ORDER_CREATED | New order confirmation to client |
| PROOF_READY | Proof ready for review |
| REVISION_PENDING | Revision submitted by client |
| DELIVERED | Files delivered |
| INVOICE_SENT | Invoice emailed to client |
| PAYMENT_RECEIVED | Payment recorded confirmation |
| FILES_UNLOCKED | Files unlocked after payment approval |

### Google OAuth

Sign-in with Google using `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection (pooled) |
| `DIRECT_URL` | ✅ | PostgreSQL direct (for migrations) |
| `AUTH_SECRET` | ✅ | NextAuth JWT signing secret (min 32 chars) |
| `AUTH_TRUST_HOST` | ✅ | Set `true` on Vercel |
| `AUTH_GOOGLE_ID` | ✅ | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | ✅ | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL (e.g. `https://genxdigitizing.com`) |
| `OTP_TTL_MINUTES` | ✅ | OTP expiry in minutes (default: 10) |
| `OTP_RESEND_COOLDOWN_SECONDS` | ✅ | OTP resend cooldown (default: 60) |
| `CHAT_ATTACHMENTS_BUCKET` | ✅ | S3/R2 bucket name |
| `S3_REGION` | ✅ | S3 region (`auto` for R2) |
| `S3_ENDPOINT` | ✅ | S3/R2 endpoint URL |
| `S3_ACCESS_KEY_ID` | ✅ | S3/R2 access key |
| `S3_SECRET_ACCESS_KEY` | ✅ | S3/R2 secret key |
| `S3_FORCE_PATH_STYLE` | ✅ | `true` for R2 / path-style S3 |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `RESEND_FROM_EMAIL` | ✅ | From address for emails |
| `ADMIN_EMAIL` | ✅ | Internal admin email for alerts |
| `AUDIT_TOKEN_SECRET` | — | HMAC secret for billing audit tokens (falls back to `AUTH_SECRET`) |

---

*Generated 2026-04-30*
